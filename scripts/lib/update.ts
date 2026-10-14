// What `--update` writes: new findings added as unjudged, every verdict a person gave kept as it is. Pure.
import { sortedEntries, type Expected, type ExpectedEntry, type JudgedEntry } from "./expected.ts";
import type { Finding } from "./finding.ts";
import { matchDocument } from "./match.ts";

const unjudgedOf = (finding: Finding): JudgedEntry => ({
  verdict: "unjudged",
  rule: finding.rule,
  line: finding.line,
  text: finding.text,
  message: finding.message,
});

const keyOf = (rule: string, line: number, text: string): string => `${rule}\n${String(line)}\n${text}`;

/** The entries without one unjudged entry per gone key: identical entries are interchangeable, so which copy goes does not matter. */
const withoutGone = (entries: readonly ExpectedEntry[], goneKeys: readonly string[]): ExpectedEntry[] => {
  const remaining = goneKeys.reduce((counts, key) => counts.set(key, (counts.get(key) ?? 0) + 1), new Map<string, number>());
  return entries.filter((entry) => {
    if (entry.verdict !== "unjudged") return true;
    const key = keyOf(entry.rule, entry.line, entry.text);
    const count = remaining.get(key) ?? 0;
    if (count === 0) return true;
    remaining.set(key, count - 1);
    return false;
  });
};

/**
 * The expected file after a run: correct, false-positive and missed entries stay untouched; an unjudged entry chaff
 * no longer gives is dropped (nobody judged it); each finding no entry accounts for is added as unjudged.
 */
export const updatedExpected = (previous: Expected | undefined, id: string, chaffVersion: string, findings: readonly Finding[]): Expected => {
  const entries = previous?.findings ?? [];
  const outcomes = matchDocument(entries, findings);
  const gone = outcomes.filter((outcome) => outcome.kind === "unjudged-gone").map((outcome) => keyOf(outcome.rule, outcome.line, outcome.text));
  const added = outcomes.flatMap((outcome) => (outcome.kind === "new" && outcome.finding !== undefined ? [unjudgedOf(outcome.finding)] : []));
  return { id, chaff: previous?.chaff ?? chaffVersion, findings: sortedEntries([...withoutGone(entries, gone), ...added]) };
};
