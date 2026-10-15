// Runs chaff over every document and compares its findings with expected/. Fails only when a correct finding is lost,
// a fully judged document gets a new finding, a document's meta is invalid, or chaff cannot run.
//   --update          write new findings into expected/ as unjudged (verdicts are never touched)
//   --resolve         --update, and settle what the run decides: a gone false positive is removed, a found miss becomes
//                     correct, a lost correct finding stays (a regression); prints the resolved/found/regressed list
//   --resolve-out <f> also write that list to <f> (Markdown, for a pull request body)
//   --chaff <path>    run a local chaffjs (a lab checkout after `yarn build`, or the package folder) instead of the pinned one
//   --only <id,...>   run these documents only
//   --jobs <n>        how many documents run at once
//   --offline         use .cache/ only for the documents that may not be redistributed
//   --shard <i/n>     run only shard i of n (CI runs the shards in parallel; scripts/merge.ts joins them)
//   --json <path>     write this run's results there for scripts/merge.ts, and leave the exit decision to it
import { appendFileSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { availableParallelism, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import { chaffPackage, knownGenres, prepareWorkDir, runChaff, type ChaffPackage } from "./lib/chaff.ts";
import { committedText, documentFiles, EXPECTED, expectedPath, readExpected, readMeta, type DocumentFiles } from "./lib/corpus.ts";
import { isFullyJudged, type Expected } from "./lib/expected.ts";
import { expectedYaml } from "./lib/expected-write.ts";
import { uncommittedText, type Available } from "./lib/fetch.ts";
import type { Finding } from "./lib/finding.ts";
import { matchDocument, withoutText } from "./lib/match.ts";
import { LANGUAGES, type Meta } from "./lib/meta.ts";
import { renderReport, type RunContext } from "./lib/report.ts";
import { idsInShard, parseShard, type Shard } from "./lib/shard.ts";
import { shardJson, type ShardResult } from "./lib/shard-result.ts";
import { failuresOf, type DocumentResult } from "./lib/tally.ts";
import { renderResolveSummary, resolvedExpected, type ResolveChange } from "./lib/resolve.ts";
import { updatedExpected } from "./lib/update.ts";

const { values: options } = parseArgs({
  options: {
    update: { type: "boolean", default: false },
    resolve: { type: "boolean", default: false },
    "resolve-out": { type: "string" },
    chaff: { type: "string" },
    only: { type: "string" },
    jobs: { type: "string" },
    offline: { type: "boolean", default: false },
    shard: { type: "string" },
    json: { type: "string" },
  },
});

/** One document ready to run, or why it is not. */
type Prepared = { readonly meta: Meta; readonly text: string } | { readonly id: string; readonly notRun: string } | { readonly problem: string };

/** One document run: its findings, or why chaff could not give them. */
type Ran = { readonly meta: Meta; readonly findings: readonly Finding[] } | { readonly problem: string };

const DEFAULT_JOBS = Math.max(1, Math.floor(availableParallelism() / 2));
const jobs = Math.max(1, Number(options.jobs ?? DEFAULT_JOBS) || DEFAULT_JOBS);
const only = options.only === undefined ? undefined : new Set(options.only.split(","));

const shardOption = (): Shard | undefined => {
  if (options.shard === undefined) return undefined;
  const shard = parseShard(options.shard);
  if (shard === undefined) throw new Error(`--shard ${options.shard}: expected i/n with 1 <= i <= n`);
  return shard;
};
const shard = shardOption();

/** About what chaff's start-up costs, in bytes of text: a small document takes about as long as this much more text. */
const START_UP_WEIGHT_BYTES = 70_000;

const weightOf = (file: DocumentFiles): number => START_UP_WEIGHT_BYTES + file.textPaths.reduce((sum, path) => sum + statSync(path).size, 0);

const inShard = (files: DocumentFiles[]): DocumentFiles[] => {
  if (shard === undefined) return files;
  const ids = idsInShard(files.map((file) => ({ id: file.place.id, weight: weightOf(file) })), shard);
  return files.filter((file) => ids.has(file.place.id));
};

const textOf = async (files: DocumentFiles, meta: Meta): Promise<Available> => {
  const committed = committedText(files);
  return committed === undefined ? uncommittedText(meta, options.offline) : { text: committed };
};

const prepare = async (files: DocumentFiles, genres: ReadonlySet<string>): Promise<Prepared> => {
  const parsed = readMeta(files, genres);
  if ("problems" in parsed) return { problem: `${files.metaPath}: ${parsed.problems.join("; ")}` };
  const available = await textOf(files, parsed.value);
  return "text" in available ? { meta: parsed.value, text: available.text } : { id: parsed.value.id, notRun: available.unavailable };
};

/** Runs `task` over `items`, `limit` at a time, keeping the items' order. */
const pooled = async <T, R>(items: readonly T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> => {
  const results: R[] = [];
  const next = { index: 0 };
  const worker = async (): Promise<void> => {
    const index = next.index++;
    const item = items[index];
    if (item === undefined) return;
    results[index] = await task(item);
    return worker();
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
};

const runOne = async (chaff: ChaffPackage, workDir: string, prepared: { meta: Meta; text: string }): Promise<Ran> => {
  try {
    return { meta: prepared.meta, findings: await runChaff(chaff, workDir, prepared.meta, prepared.text) };
  } catch (error) {
    return { problem: error instanceof Error ? error.message : String(error) };
  }
};

const expectedOf = (id: string, problems: string[]): Expected | undefined => {
  const read = readExpected(id);
  if (read === undefined) return undefined;
  if ("problems" in read) {
    problems.push(`expected/${id}.yaml: ${read.problems.join("; ")}`);
    return undefined;
  }
  return read.value;
};

const resultOf = (meta: Meta, findings: readonly Finding[], expected: Expected | undefined): DocumentResult => ({
  id: meta.id,
  genre: meta.genre,
  language: meta.language,
  fullyJudged: isFullyJudged(expected),
  outcomes: matchDocument(expected?.findings ?? [], findings).map((outcome) => (meta.redistribute ? outcome : withoutText(outcome))),
});

const writeExpected = (id: string, expected: Expected): void => {
  mkdirSync(EXPECTED, { recursive: true });
  writeFileSync(expectedPath(id), expectedYaml(expected));
};

const writeUpdate = (meta: Meta, findings: readonly Finding[], expected: Expected | undefined, chaffVersion: string): void =>
  writeExpected(meta.id, updatedExpected(expected, meta.id, chaffVersion, findings, meta.redistribute));

/** Writes the resolved expected file and returns what it settled. */
const writeResolve = (meta: Meta, findings: readonly Finding[], expected: Expected | undefined, chaffVersion: string): readonly ResolveChange[] => {
  const resolved = resolvedExpected(expected, meta.id, chaffVersion, findings, meta.redistribute);
  writeExpected(meta.id, resolved.expected);
  return resolved.changes;
};

const resolveChanges: { id: string; changes: readonly ResolveChange[] }[] = [];

const writeRun = (meta: Meta, findings: readonly Finding[], expected: Expected | undefined, chaffVersion: string): void => {
  if (options.resolve) resolveChanges.push({ id: meta.id, changes: writeResolve(meta, findings, expected, chaffVersion) });
  else if (options.update) writeUpdate(meta, findings, expected, chaffVersion);
};

const reportResolve = (chaffVersion: string): void => {
  if (!options.resolve) return;
  const summary = renderResolveSummary(chaffVersion, resolveChanges);
  report(summary);
  const out = options["resolve-out"];
  if (out !== undefined) writeFileSync(out, `${summary}\n`);
};

const main = async (): Promise<void> => {
  const chaff = chaffPackage(options.chaff);
  const genres = knownGenres(chaff);
  const files = inShard(documentFiles().filter((file) => only === undefined || only.has(file.place.id)));
  const prepared = await pooled(files, jobs, (file) => prepare(file, genres));
  const workDir = mkdtempSync(join(tmpdir(), "chaff-corpus-"));
  prepareWorkDir(workDir, LANGUAGES);
  const runnable = prepared.flatMap((item) => ("meta" in item ? [item] : []));
  const ran = await pooled(runnable, jobs, (item) => runOne(chaff, workDir, item));
  rmSync(workDir, { recursive: true, force: true });
  const problems = [...prepared.flatMap((item) => ("problem" in item ? [item.problem] : [])), ...ran.flatMap((item) => ("problem" in item ? [item.problem] : []))];
  const results = ran.flatMap((item) => {
    if (!("meta" in item)) return [];
    const expected = expectedOf(item.meta.id, problems);
    writeRun(item.meta, item.findings, expected, chaff.version);
    return [resultOf(item.meta, item.findings, expected)];
  });
  const context: RunContext = { chaffVersion: chaff.version, notRun: prepared.flatMap((item) => ("notRun" in item ? [{ id: item.id, reason: item.notRun }] : [])), problems };
  if (options.json !== undefined) return writeShard(options.json, { ...context, results }, renderReport(results, context));
  report(renderReport(results, context));
  reportResolve(chaff.version);
  const writing = options.update || options.resolve;
  if (problems.length > 0 || (!writing && failuresOf(results).length > 0)) process.exitCode = 1;
};

const writeShard = (path: string, result: ShardResult, markdown: string): void => {
  console.log(markdown);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, shardJson(result));
};

const report = (markdown: string): void => {
  console.log(markdown);
  const summary = process.env["GITHUB_STEP_SUMMARY"];
  if (summary !== undefined && summary !== "") appendFileSync(summary, `${markdown}\n`);
};

await main();
