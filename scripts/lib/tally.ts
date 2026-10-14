// Counting outcomes per rule and per genre, and deciding whether the run fails. Pure.
import type { Outcome, OutcomeKind } from "./match.ts";

/** One document's run: its outcomes, and whether every finding on it had a verdict before the run. */
export type DocumentResult = {
  readonly id: string;
  readonly genre: string;
  readonly language: string;
  readonly fullyJudged: boolean;
  readonly outcomes: readonly Outcome[];
};

export type Counts = Readonly<Record<OutcomeKind, number>>;

const countsFrom = (valueOf: (kind: OutcomeKind) => number): Counts => ({
  "correct-kept": valueOf("correct-kept"),
  "correct-lost": valueOf("correct-lost"),
  "false-positive-present": valueOf("false-positive-present"),
  "false-positive-gone": valueOf("false-positive-gone"),
  "unjudged-present": valueOf("unjudged-present"),
  "unjudged-gone": valueOf("unjudged-gone"),
  "missed-still": valueOf("missed-still"),
  "missed-found": valueOf("missed-found"),
  new: valueOf("new"),
});

export const emptyCounts = (): Counts => countsFrom(() => 0);

const plus = (counts: Counts, added: OutcomeKind): Counts => countsFrom((kind) => counts[kind] + (kind === added ? 1 : 0));

const tallyBy = (results: readonly DocumentResult[], keyOf: (result: DocumentResult, outcome: Outcome) => string): Map<string, Counts> =>
  results.reduce(
    (table, result) =>
      result.outcomes.reduce((acc, outcome) => {
        const key = keyOf(result, outcome);
        return acc.set(key, plus(acc.get(key) ?? emptyCounts(), outcome.kind));
      }, table),
    new Map<string, Counts>(),
  );

export const tallyByRule = (results: readonly DocumentResult[]): Map<string, Counts> => tallyBy(results, (_, outcome) => outcome.rule);

export const tallyByGenre = (results: readonly DocumentResult[]): Map<string, Counts> => tallyBy(results, (result) => result.genre);

export const total = (table: ReadonlyMap<string, Counts>): Counts =>
  [...table.values()].reduce((sum, counts) => countsFrom((kind) => sum[kind] + counts[kind]), emptyCounts());

/** correct / (correct + false positive) among the judged findings chaff still gives, or undefined when none is judged. */
export const precisionOf = (counts: Counts): number | undefined => {
  const judged = counts["correct-kept"] + counts["false-positive-present"];
  return judged === 0 ? undefined : counts["correct-kept"] / judged;
};

export type Failure = { readonly id: string; readonly reason: "correct-lost" | "new-on-judged"; readonly outcome: Outcome };

/** Why the run fails: a correct finding chaff no longer gives, or a new finding on a document where every finding was judged. */
export const failuresOf = (results: readonly DocumentResult[]): Failure[] =>
  results.flatMap((result) =>
    result.outcomes.flatMap((outcome): Failure[] => {
      if (outcome.kind === "correct-lost") return [{ id: result.id, reason: "correct-lost", outcome }];
      if (outcome.kind === "new" && result.fullyJudged) return [{ id: result.id, reason: "new-on-judged", outcome }];
      return [];
    }),
  );
