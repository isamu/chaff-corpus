// The run's report as Markdown: for the terminal and for the GitHub job summary. Pure.
import type { Outcome } from "./match.ts";
import { failuresOf, otherOrigins, precisionOf, tallyByGenre, tallyByOrigin, tallyByRule, total, type Counts, type DocumentResult, type Failure } from "./tally.ts";

/** What the report says besides the results: the chaff it ran, and the documents it could not run and why. */
export type RunContext = {
  readonly chaffVersion: string;
  readonly notRun: readonly { readonly id: string; readonly reason: string }[];
  readonly problems: readonly string[];
};

const COLUMNS: readonly { readonly title: string; readonly value: (counts: Counts) => string }[] = [
  { title: "correct kept", value: (counts) => String(counts["correct-kept"]) },
  { title: "correct lost", value: (counts) => String(counts["correct-lost"]) },
  { title: "false positive still", value: (counts) => String(counts["false-positive-present"]) },
  { title: "false positive gone", value: (counts) => String(counts["false-positive-gone"]) },
  { title: "missed still", value: (counts) => String(counts["missed-still"]) },
  { title: "missed found", value: (counts) => String(counts["missed-found"]) },
  { title: "to judge", value: (counts) => String(counts["unjudged-present"] + counts["new"]) },
  { title: "new", value: (counts) => String(counts["new"]) },
  { title: "precision", value: (counts) => percent(precisionOf(counts)) },
];

const PERCENT = 100;

const percent = (ratio: number | undefined): string => (ratio === undefined ? "–" : `${(ratio * PERCENT).toFixed(1)}%`);

const row = (cells: readonly string[]): string => `| ${cells.join(" | ")} |`;

const table = (heading: string, tally: ReadonlyMap<string, Counts>): string[] => [
  row([heading, ...COLUMNS.map((column) => column.title)]),
  row([":--", ...COLUMNS.map(() => "--:")]),
  ...[...tally.entries()].toSorted(([left], [right]) => left.localeCompare(right)).map(([key, counts]) => row([key, ...COLUMNS.map((column) => column.value(counts))])),
  row(["**all**", ...COLUMNS.map((column) => column.value(total(tally)))]),
];

/** Where an outcome is, for a reader: id:line and rule, and the text when the report may show it. */
export const place = (id: string, outcome: Outcome): string =>
  `\`${id}:${String(outcome.line)}\` ${outcome.rule}${outcome.text === undefined ? "" : ` — ${outcome.text}`}`;

const FAILURE_TITLE: Readonly<Record<Failure["reason"], string>> = {
  "correct-lost": "a correct finding chaff no longer gives",
  "new-on-judged": "a new finding on a fully judged document",
};

const failureLines = (failures: readonly Failure[]): string[] =>
  failures.length === 0 ? [] : ["## Failures", "", ...failures.map((failure) => `- ${FAILURE_TITLE[failure.reason]}: ${place(failure.id, failure.outcome)}`), ""];

const notRunLines = (context: RunContext): string[] =>
  context.notRun.length === 0 ? [] : ["## Not run", "", ...context.notRun.map((entry) => `- \`${entry.id}\`: ${entry.reason}`), ""];

const problemLines = (context: RunContext): string[] =>
  context.problems.length === 0 ? [] : ["## Problems", "", ...context.problems.map((problem) => `- ${problem}`), ""];

const changeLines = (results: readonly DocumentResult[]): string[] => {
  const changes = results.flatMap((result) =>
    result.outcomes.filter((outcome) => outcome.kind === "false-positive-gone" || outcome.kind === "missed-found").map((outcome) => `- ${outcome.kind}: ${place(result.id, outcome)}`),
  );
  return changes.length === 0 ? [] : ["## Improvements", "", ...changes, ""];
};

/** When the run holds documents not written by people: the table by origin, and one by rule for each such origin. */
const originLines = (results: readonly DocumentResult[]): string[] => {
  const origins = otherOrigins(results);
  if (origins.length === 0) return [];
  const byRule = origins.flatMap((origin) => [`## By rule, origin ${origin}`, "", ...table("rule", tallyByRule(results.filter((result) => result.origin === origin))), ""]);
  return ["## By origin", "", ...table("origin", tallyByOrigin(results)), "", ...byRule];
};

/** The whole report: what failed, what improved, and the tables per rule and per genre (and per origin, when it varies). */
export const renderReport = (results: readonly DocumentResult[], context: RunContext): string =>
  [
    `# chaff-corpus: chaffjs ${context.chaffVersion}, ${String(results.length)} documents`,
    "",
    ...problemLines(context),
    ...failureLines(failuresOf(results)),
    ...changeLines(results),
    ...notRunLines(context),
    "## By rule",
    "",
    ...table("rule", tallyByRule(results)),
    "",
    "## By genre",
    "",
    ...table("genre", tallyByGenre(results)),
    "",
    ...originLines(results),
  ].join("\n");
