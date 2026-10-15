// The report of a run against an unreleased chaff (lab's main): what it fixes that the release does not yet, and what
// it breaks. The expected files follow the pinned release, so a judged false positive that is gone, or a miss that is
// found, is fixed there and not yet released. Pure.
import type { Outcome } from "./match.ts";
import { renderReport, type RunContext } from "./report.ts";
import { failuresOf, type DocumentResult } from "./tally.ts";

const FIXED_KINDS: ReadonlySet<Outcome["kind"]> = new Set(["false-positive-gone", "missed-found"]);

type Placed = { readonly id: string; readonly outcome: Outcome };

const fixesOf = (results: readonly DocumentResult[]): Placed[] =>
  results.flatMap((result) => result.outcomes.filter((outcome) => FIXED_KINDS.has(outcome.kind)).map((outcome) => ({ id: result.id, outcome })));

const place = ({ id, outcome }: Placed): string => `\`${id}:${String(outcome.line)}\` ${outcome.rule} — ${outcome.text}`;

const countOf = (placed: readonly Placed[], kind: string): string => String(placed.filter((entry) => entry.outcome.kind === kind).length);

const listOf = (heading: string, lines: readonly string[]): string[] => (lines.length === 0 ? [] : [heading, "", ...lines, ""]);

/** The summary table and lists for a run against `label`, with the run's full report folded below them. */
export const renderAgainstReport = (label: string, results: readonly DocumentResult[], context: RunContext): string => {
  const fixes = fixesOf(results);
  const regressions = failuresOf(results);
  const regressionPlaces = regressions.map((failure) => ({ id: failure.id, outcome: failure.outcome }));
  return [
    `# chaff-corpus against ${label}: chaffjs ${context.chaffVersion}, ${String(results.length)} documents`,
    "",
    `| against ${label} | count |`,
    "| :-- | --: |",
    `| fixed, not yet released: false positive gone | ${countOf(fixes, "false-positive-gone")} |`,
    `| fixed, not yet released: missed found | ${countOf(fixes, "missed-found")} |`,
    `| regression: correct lost | ${String(regressions.filter((failure) => failure.reason === "correct-lost").length)} |`,
    `| regression: new on a fully judged document | ${String(regressions.filter((failure) => failure.reason === "new-on-judged").length)} |`,
    `| could not run or problem | ${String(context.notRun.length + context.problems.length)} |`,
    "",
    ...listOf(`## Fixed on ${label}, not yet released`, fixes.map((entry) => `- ${entry.outcome.kind}: ${place(entry)}`)),
    ...listOf(`## Regressions on ${label}`, regressionPlaces.map((entry) => `- ${entry.outcome.kind}: ${place(entry)}`)),
    "<details><summary>Full report</summary>",
    "",
    renderReport(results, context),
    "</details>",
    "",
  ].join("\n");
};
