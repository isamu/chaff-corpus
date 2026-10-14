// What `--resolve` writes: `--update`, plus the verdicts a run settles by itself. A false positive chaff no longer gives
// is removed, a missed finding chaff now gives becomes correct, and a lost correct finding stays (a regression). Pure.
import type { Expected, ExpectedEntry, JudgedEntry, MissedEntry } from "./expected.ts";
import type { Finding } from "./finding.ts";
import { matchDocument, type Outcome } from "./match.ts";
import { updatedExpected } from "./update.ts";

export const RESOLVE_CHANGES = ["resolved", "found", "regressed"] as const;
export type ResolveChangeKind = (typeof RESOLVE_CHANGES)[number];

/** One verdict the run settled (resolved, found) or one it must not settle (regressed). */
export type ResolveChange = {
  readonly kind: ResolveChangeKind;
  readonly rule: string;
  readonly line: number;
  /** The finding's text, or for a found miss what the reader expected. */
  readonly text: string;
  readonly note?: string;
};

export type Resolved = { readonly expected: Expected; readonly changes: readonly ResolveChange[] };

/** The entries in the order matchDocument reports them: judged ones first, then missed ones. */
const inOutcomeOrder = (entries: readonly ExpectedEntry[]): ExpectedEntry[] => [
  ...entries.filter((entry) => entry.verdict !== "missed"),
  ...entries.filter((entry) => entry.verdict === "missed"),
];

/** A missed entry once chaff gives it: correct, at the finding's text, keeping the person's words as the note. */
const foundEntry = (entry: MissedEntry, finding: Finding, chaffVersion: string): JudgedEntry => ({
  verdict: "correct",
  rule: finding.rule,
  line: finding.line,
  text: finding.text,
  message: finding.message,
  note: `${entry.note ?? entry.what}; found by chaffjs ${chaffVersion}`,
});

const changeOf = (kind: ResolveChangeKind, outcome: Outcome, note: string | undefined): ResolveChange =>
  note === undefined ? { kind, rule: outcome.rule, line: outcome.line, text: outcome.text } : { kind, rule: outcome.rule, line: outcome.line, text: outcome.text, note };

/** What becomes of one expected entry: kept, replaced, or dropped, and the change to report. */
const settle = (entry: ExpectedEntry, outcome: Outcome, chaffVersion: string): { entries: ExpectedEntry[]; changes: ResolveChange[] } => {
  if (outcome.kind === "false-positive-gone") return { entries: [], changes: [changeOf("resolved", outcome, entry.note)] };
  if (outcome.kind === "correct-lost") return { entries: [entry], changes: [changeOf("regressed", outcome, entry.note)] };
  if (outcome.kind === "missed-found" && entry.verdict === "missed" && outcome.finding !== undefined) {
    return { entries: [foundEntry(entry, outcome.finding, chaffVersion)], changes: [changeOf("found", outcome, entry.note)] };
  }
  return { entries: [entry], changes: [] };
};

/**
 * The expected file after a run with `--resolve`: false positives chaff no longer gives are removed, misses it now gives
 * become correct, a correct finding it lost is kept and reported as a regression; then `--update` adds new findings as
 * unjudged and drops unjudged ones that are gone.
 */
export const resolvedExpected = (previous: Expected | undefined, id: string, chaffVersion: string, findings: readonly Finding[]): Resolved => {
  const entries = inOutcomeOrder(previous?.findings ?? []);
  const outcomes = matchDocument(entries, findings).filter((outcome) => outcome.kind !== "new");
  const settled = entries.map((entry, index) => {
    const outcome = outcomes[index];
    return outcome === undefined ? { entries: [entry], changes: [] } : settle(entry, outcome, chaffVersion);
  });
  const kept: Expected | undefined = previous === undefined ? undefined : { ...previous, findings: settled.flatMap((item) => item.entries) };
  return { expected: updatedExpected(kept, id, chaffVersion, findings), changes: settled.flatMap((item) => item.changes) };
};

const SECTION_TITLE: Readonly<Record<ResolveChangeKind, string>> = {
  resolved: "Resolved (false positives chaff no longer gives, removed)",
  found: "Found (misses chaff now gives, marked correct)",
  regressed: "Regressed (correct findings chaff no longer gives, kept)",
};

const changeLine = (id: string, change: ResolveChange): string => {
  const note = change.note === undefined ? "" : ` (${change.note})`;
  return `- \`${id}:${String(change.line)}\` ${change.rule} — ${change.text}${note}`;
};

const sectionLines = (kind: ResolveChangeKind, documents: readonly { readonly id: string; readonly changes: readonly ResolveChange[] }[]): string[] => {
  const lines = documents.flatMap((document) => document.changes.filter((change) => change.kind === kind).map((change) => changeLine(document.id, change)));
  return [`### ${SECTION_TITLE[kind]}`, "", ...(lines.length === 0 ? ["None."] : lines), ""];
};

/** The resolved, found and regressed lists of a run, as Markdown fit for a pull request body. */
export const renderResolveSummary = (chaffVersion: string, documents: readonly { readonly id: string; readonly changes: readonly ResolveChange[] }[]): string =>
  [`## What chaffjs ${chaffVersion} settled`, "", ...RESOLVE_CHANGES.flatMap((kind) => sectionLines(kind, documents))].join("\n");
