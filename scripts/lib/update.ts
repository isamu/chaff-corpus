// What `--update` writes: new findings added as unjudged, every verdict a person gave kept as it is. Pure.
import { sortedEntries, type Expected, type ExpectedEntry, type JudgedEntry } from "./expected.ts";
import type { Finding } from "./finding.ts";
import { matchDocument, type Outcome } from "./match.ts";
import { sha256Of } from "./meta.ts";

/** A finding as an expected entry: with its text and message, or, on a document that may not be redistributed, its text's sha256 only. */
export const judgedEntryOf = (verdict: JudgedEntry["verdict"], finding: Finding, redistribute: boolean): JudgedEntry =>
  redistribute
    ? { verdict, rule: finding.rule, line: finding.line, text: finding.text, message: finding.message }
    : { verdict, rule: finding.rule, line: finding.line, sha256: sha256Of(finding.text) };

const keyOf = (rule: string, line: number, identity: string): string => `${rule}\n${String(line)}\n${identity}`;

const entryKey = (entry: JudgedEntry): string => keyOf(entry.rule, entry.line, "sha256" in entry ? `sha256:${entry.sha256}` : `text:${entry.text}`);

const outcomeKey = (outcome: Outcome): string =>
  keyOf(outcome.rule, outcome.line, outcome.sha256 === undefined ? `text:${outcome.text ?? ""}` : `sha256:${outcome.sha256}`);

/** The entries without one unjudged entry per gone key: identical entries are interchangeable, so which copy goes does not matter. */
const withoutGone = (entries: readonly ExpectedEntry[], goneKeys: readonly string[]): ExpectedEntry[] => {
  const remaining = goneKeys.reduce((counts, key) => counts.set(key, (counts.get(key) ?? 0) + 1), new Map<string, number>());
  return entries.filter((entry) => {
    if (entry.verdict !== "unjudged") return true;
    const key = entryKey(entry);
    const count = remaining.get(key) ?? 0;
    if (count === 0) return true;
    remaining.set(key, count - 1);
    return false;
  });
};

/**
 * The expected file after a run: correct, false-positive and missed entries stay untouched; an unjudged entry chaff
 * no longer gives is dropped (nobody judged it); each finding no entry accounts for is added as unjudged, known by its
 * text's sha256 alone when the document may not be redistributed.
 */
export const updatedExpected = (previous: Expected | undefined, id: string, chaffVersion: string, findings: readonly Finding[], redistribute: boolean): Expected => {
  const entries = previous?.findings ?? [];
  const outcomes = matchDocument(entries, findings);
  const gone = outcomes.filter((outcome) => outcome.kind === "unjudged-gone").map(outcomeKey);
  const added = outcomes.flatMap((outcome) => (outcome.kind === "new" && outcome.finding !== undefined ? [judgedEntryOf("unjudged", outcome.finding, redistribute)] : []));
  return { id, chaff: previous?.chaff ?? chaffVersion, findings: sortedEntries([...withoutGone(entries, gone), ...added]) };
};
