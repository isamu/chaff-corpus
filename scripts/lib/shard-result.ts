// What one shard of a run hands to the job that merges them, as JSON, and the merge itself. Pure.
import { isNonEmptyString, isPositiveInteger, isRecord } from "./guards.ts";
import { OUTCOMES, type Outcome, type OutcomeKind } from "./match.ts";
import type { RunContext } from "./report.ts";
import type { DocumentResult } from "./tally.ts";

/** One shard's run: the documents it ran, the ones it could not, and its problems. */
export type ShardResult = RunContext & { readonly results: readonly DocumentResult[] };

const outcomeOf = (outcome: Outcome): Outcome => ({ kind: outcome.kind, rule: outcome.rule, line: outcome.line, text: outcome.text });

/** The shard's result as JSON. A finding's details are left out: the report needs only rule, line and text. */
export const shardJson = (shard: ShardResult): string =>
  `${JSON.stringify({ ...shard, results: shard.results.map((result) => ({ ...result, outcomes: result.outcomes.map(outcomeOf) })) }, undefined, 2)}\n`;

const isOutcomeKind = (value: unknown): value is OutcomeKind => OUTCOMES.some((kind) => kind === value);

const parseOutcome = (value: unknown): Outcome | undefined =>
  isRecord(value) && isOutcomeKind(value["kind"]) && isNonEmptyString(value["rule"]) && isPositiveInteger(value["line"]) && typeof value["text"] === "string"
    ? { kind: value["kind"], rule: value["rule"], line: value["line"], text: value["text"] }
    : undefined;

const parseResult = (value: unknown): DocumentResult | undefined => {
  if (!isRecord(value) || !isNonEmptyString(value["id"]) || !isNonEmptyString(value["genre"]) || !isNonEmptyString(value["language"])) return undefined;
  if (typeof value["fullyJudged"] !== "boolean" || !Array.isArray(value["outcomes"])) return undefined;
  const outcomes = value["outcomes"].map(parseOutcome);
  if (outcomes.some((outcome) => outcome === undefined)) return undefined;
  return { id: value["id"], genre: value["genre"], language: value["language"], fullyJudged: value["fullyJudged"], outcomes: outcomes.flatMap((outcome) => outcome ?? []) };
};

const parseNotRun = (value: unknown): RunContext["notRun"][number] | undefined =>
  isRecord(value) && isNonEmptyString(value["id"]) && typeof value["reason"] === "string" ? { id: value["id"], reason: value["reason"] } : undefined;

const parseList = <T>(value: unknown, parse: (item: unknown) => T | undefined): T[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const items = value.map(parse);
  return items.some((item) => item === undefined) ? undefined : items.flatMap((item) => (item === undefined ? [] : [item]));
};

const asString = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);

/** A shard's JSON read back, or undefined when it is not one. */
export const parseShardResult = (value: unknown): ShardResult | undefined => {
  if (!isRecord(value) || !isNonEmptyString(value["chaffVersion"])) return undefined;
  const results = parseList(value["results"], parseResult);
  const notRun = parseList(value["notRun"], parseNotRun);
  const problems = parseList(value["problems"], asString);
  if (results === undefined || notRun === undefined || problems === undefined) return undefined;
  return { chaffVersion: value["chaffVersion"], results, notRun, problems };
};

/** A shard's file: what it holds, or why it cannot be read. */
export type ShardFile = { readonly path: string; readonly content: unknown } | { readonly path: string; readonly unreadable: string };

const versionsOf = (shards: readonly ShardResult[]): string => [...new Set(shards.map((shard) => shard.chaffVersion))].join(", ") || "unknown";

const byId = <T extends { readonly id: string }>(left: T, right: T): number => left.id.localeCompare(right.id);

/** All shards as one run. A file that is unreadable or not a shard result, or fewer files than shards, is a problem. */
export const mergeShards = (files: readonly ShardFile[], expectedShards: number): ShardResult => {
  const parsed = files.map((file) => ("content" in file ? { path: file.path, shard: parseShardResult(file.content) } : { path: file.path, unreadable: file.unreadable }));
  const shards = parsed.flatMap((entry) => ("shard" in entry && entry.shard !== undefined ? [entry.shard] : []));
  const fileProblems = parsed.flatMap((entry) => {
    if ("unreadable" in entry) return [`${entry.path}: ${entry.unreadable}`];
    return entry.shard === undefined ? [`${entry.path}: not a shard result`] : [];
  });
  const missing = files.length < expectedShards ? [`${String(expectedShards - files.length)} of ${String(expectedShards)} shards gave no result`] : [];
  return {
    chaffVersion: versionsOf(shards),
    results: shards.flatMap((shard) => shard.results).toSorted(byId),
    notRun: shards.flatMap((shard) => shard.notRun).toSorted(byId),
    problems: [...missing, ...fileProblems, ...shards.flatMap((shard) => shard.problems)],
  };
};
