// What `--resolve` writes: `--update`, plus the verdicts a run settles by itself. A false positive chaff no longer gives
// is removed, a missed finding chaff now gives becomes correct, and a lost correct finding stays (a regression). Pure.
import type { Expected, ExpectedEntry, JudgedEntry, MissedEntry } from "./expected.ts";
import type { Finding } from "./finding.ts";
import { matchDocument, type Outcome } from "./match.ts";
import { judgedEntryOf, updatedExpected } from "./update.ts";

export const RESOLVE_CHANGES = ["resolved", "found", "regressed"] as const;
export type ResolveChangeKind = (typeof RESOLVE_CHANGES)[number];

/** One verdict the run settled (resolved, found) or one it must not settle (regressed). */
export type ResolveChange = {
  readonly kind: ResolveChangeKind;
  readonly rule: string;
  readonly line: number;
  /** The finding's text, or for a found miss what the reader expected; absent on a document that may not be redistributed. */
  readonly text?: string;
  readonly note?: string;
};

export type Resolved = { readonly expected: Expected; readonly changes: readonly ResolveChange[] };

/** The entries in the order matchDocument reports them: judged ones first, then missed ones. */
const inOutcomeOrder = (entries: readonly ExpectedEntry[]): ExpectedEntry[] => [
  ...entries.filter((entry) => entry.verdict !== "missed"),
  ...entries.filter((entry) => entry.verdict === "missed"),
];

/** A missed entry once chaff gives it: correct, at the finding's text (or its sha256), keeping the person's words as the note. */
const foundEntry = (entry: MissedEntry, finding: Finding, chaffVersion: string, redistribute: boolean): JudgedEntry => ({
  ...judgedEntryOf("correct", finding, redistribute),
  note: `${entry.note ?? entry.what}; found by chaffjs ${chaffVersion}`,
});

const changeOf = (kind: ResolveChangeKind, outcome: Outcome, note: string | undefined, redistribute: boolean): ResolveChange => {
  const base = { kind, rule: outcome.rule, line: outcome.line, ...(note === undefined ? {} : { note }) };
  return redistribute && outcome.text !== undefined ? { ...base, text: outcome.text } : base;
};

type Settled = { entries: ExpectedEntry[]; changes: ResolveChange[] };

/** What becomes of one expected entry: kept, replaced, or dropped, and the change to report. */
const settle = (entry: ExpectedEntry, outcome: Outcome, chaffVersion: string, redistribute: boolean): Settled => {
  const change = (kind: ResolveChangeKind): ResolveChange[] => [changeOf(kind, outcome, entry.note, redistribute)];
  if (outcome.kind === "false-positive-gone") return { entries: [], changes: change("resolved") };
  if (outcome.kind === "correct-lost") return { entries: [entry], changes: change("regressed") };
  if (outcome.kind === "missed-found" && entry.verdict === "missed" && outcome.finding !== undefined) {
    return { entries: [foundEntry(entry, outcome.finding, chaffVersion, redistribute)], changes: change("found") };
  }
  return { entries: [entry], changes: [] };
};

/**
 * The expected file after a run with `--resolve`: false positives chaff no longer gives are removed, misses it now gives
 * become correct, a correct finding it lost is kept and reported as a regression; then `--update` adds new findings as
 * unjudged and drops unjudged ones that are gone. On a document that may not be redistributed (`redistribute` false), every
 * entry written is known by its text's sha256 and no change carries text.
 */
export const resolvedExpected = (previous: Expected | undefined, id: string, chaffVersion: string, findings: readonly Finding[], redistribute: boolean): Resolved => {
  const entries = inOutcomeOrder(previous?.findings ?? []);
  const outcomes = matchDocument(entries, findings).filter((outcome) => outcome.kind !== "new");
  const settled = entries.map((entry, index) => {
    const outcome = outcomes[index];
    return outcome === undefined ? { entries: [entry], changes: [] } : settle(entry, outcome, chaffVersion, redistribute);
  });
  const kept: Expected | undefined = previous === undefined ? undefined : { ...previous, findings: settled.flatMap((item) => item.entries) };
  return { expected: updatedExpected(kept, id, chaffVersion, findings, redistribute), changes: settled.flatMap((item) => item.changes) };
};

const SECTION_TITLE: Readonly<Record<ResolveChangeKind, string>> = {
  resolved: "Resolved (false positives chaff no longer gives, removed)",
  found: "Found (misses chaff now gives, marked correct)",
  regressed: "Regressed (correct findings chaff no longer gives, kept)",
};

const changeLine = (id: string, change: ResolveChange): string => {
  const note = change.note === undefined ? "" : ` (${change.note})`;
  const text = change.text === undefined ? "" : ` — ${change.text}`;
  return `- \`${id}:${String(change.line)}\` ${change.rule}${text}${note}`;
};

const sectionLines = (kind: ResolveChangeKind, documents: readonly { readonly id: string; readonly changes: readonly ResolveChange[] }[]): string[] => {
  const lines = documents.flatMap((document) => document.changes.filter((change) => change.kind === kind).map((change) => changeLine(document.id, change)));
  return [`### ${SECTION_TITLE[kind]}`, "", ...(lines.length === 0 ? ["None."] : lines), ""];
};

/** The resolved, found and regressed lists of a run, as Markdown fit for a pull request body. */
export const renderResolveSummary = (chaffVersion: string, documents: readonly { readonly id: string; readonly changes: readonly ResolveChange[] }[]): string =>
  [`## What chaffjs ${chaffVersion} settled`, "", ...RESOLVE_CHANGES.flatMap((kind) => sectionLines(kind, documents))].join("\n");
