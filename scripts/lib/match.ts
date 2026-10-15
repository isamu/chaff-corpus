// Matching one document's findings with its expected entries. Pure.
import type { ExpectedEntry, JudgedEntry, MissedEntry } from "./expected.ts";
import type { Finding } from "./finding.ts";
import { sha256Of } from "./meta.ts";

export const OUTCOMES = [
  "correct-kept",
  "correct-lost",
  "false-positive-present",
  "false-positive-gone",
  "unjudged-present",
  "unjudged-gone",
  "missed-still",
  "missed-found",
  "new",
] as const;
export type OutcomeKind = (typeof OUTCOMES)[number];

/**
 * One expected entry or one unexpected finding, and what became of it in this run. `text` is the finding's text (or what
 * a missed entry expects); an entry known by its sha256 carries that instead, and a report of a document that may not be
 * redistributed carries neither.
 */
export type Outcome = {
  readonly kind: OutcomeKind;
  readonly rule: string;
  readonly line: number;
  readonly text?: string;
  readonly sha256?: string;
  readonly finding?: Finding;
};

/** A finding answers a judged entry when rule, line and the text at its position (or that text's sha256) are the same. */
export const sameFinding = (entry: JudgedEntry, finding: Finding): boolean =>
  entry.rule === finding.rule && entry.line === finding.line && ("sha256" in entry ? entry.sha256 === sha256Of(finding.text) : entry.text === finding.text);

/** A finding answers a missed entry when it is the missed rule on the missed line. */
export const answersMiss = (entry: MissedEntry, finding: Finding): boolean => entry.rule === finding.rule && entry.line === finding.line;

const JUDGED_OUTCOME: Readonly<Record<JudgedEntry["verdict"], readonly [present: OutcomeKind, absent: OutcomeKind]>> = {
  correct: ["correct-kept", "correct-lost"],
  "false-positive": ["false-positive-present", "false-positive-gone"],
  unjudged: ["unjudged-present", "unjudged-gone"],
};

/** Takes the first finding not used yet that `answers` accepts, marking it used. */
const claim = (findings: readonly Finding[], used: boolean[], answers: (finding: Finding) => boolean): Finding | undefined => {
  const index = findings.findIndex((finding, at) => used[at] !== true && answers(finding));
  if (index < 0) return undefined;
  used[index] = true;
  return findings[index];
};

const judgedOutcome = (entry: JudgedEntry, found: Finding | undefined): Outcome => {
  const [present, absent] = JUDGED_OUTCOME[entry.verdict];
  const base = "sha256" in entry ? { rule: entry.rule, line: entry.line, sha256: entry.sha256 } : { rule: entry.rule, line: entry.line, text: entry.text };
  return found === undefined ? { kind: absent, ...base } : { kind: present, ...base, finding: found };
};

const missedOutcome = (entry: MissedEntry, found: Finding | undefined): Outcome => {
  const base = { rule: entry.rule, line: entry.line, text: entry.what };
  return found === undefined ? { kind: "missed-still", ...base } : { kind: "missed-found", ...base, finding: found };
};

const isJudged = (entry: ExpectedEntry): entry is JudgedEntry => entry.verdict !== "missed";
const isMissed = (entry: ExpectedEntry): entry is MissedEntry => entry.verdict === "missed";

/**
 * What became of each expected entry, and the findings no entry accounts for. Each finding answers at most one entry:
 * judged entries are matched first (exactly), then missed entries take what is left on their rule and line.
 */
export const matchDocument = (entries: readonly ExpectedEntry[], findings: readonly Finding[]): Outcome[] => {
  const used = findings.map(() => false);
  const judged = entries.filter(isJudged).map((entry) => judgedOutcome(entry, claim(findings, used, (finding) => sameFinding(entry, finding))));
  const missed = entries.filter(isMissed).map((entry) => missedOutcome(entry, claim(findings, used, (finding) => answersMiss(entry, finding))));
  const unexpected = findings.flatMap((finding, index): Outcome[] =>
    used[index] === true ? [] : [{ kind: "new", rule: finding.rule, line: finding.line, text: finding.text, finding }],
  );
  return [...judged, ...missed, ...unexpected];
};

/** The outcome as a report of a document that may not be redistributed shows it: rule, line and sha256, no text. */
export const withoutText = (outcome: Outcome): Outcome => {
  const sha256 = outcome.sha256 ?? (outcome.finding === undefined ? undefined : sha256Of(outcome.finding.text));
  return sha256 === undefined ? { kind: outcome.kind, rule: outcome.rule, line: outcome.line } : { kind: outcome.kind, rule: outcome.rule, line: outcome.line, sha256 };
};
