// What `yarn judge <id>` prints: each expected entry of one document, with a hashed entry's text recovered from the local
// copy of the document. Pure: reading the files and printing are the caller's.
import { parseArgs } from "node:util";
import type { Expected, ExpectedEntry, HashedEntry } from "./expected.ts";
import { excerptAt } from "./finding.ts";
import { sha256Of } from "./meta.ts";

/** The only options `yarn judge` takes. It has no output path: it prints, and never writes a file. */
export const JUDGE_OPTIONS = { offline: { type: "boolean", default: false } } as const;

export type JudgeArgs = { readonly id: string; readonly offline: boolean } | { readonly problem: string };

const USAGE = "usage: yarn judge <id> [--offline]";

/** The document id and --offline, or what is wrong with the command line. */
export const parseJudgeArgs = (argv: readonly string[]): JudgeArgs => {
  try {
    const { values, positionals } = parseArgs({ args: [...argv], options: JUDGE_OPTIONS, allowPositionals: true, strict: true });
    const [id, ...rest] = positionals;
    if (id === undefined || rest.length > 0) return { problem: USAGE };
    return { id, offline: values.offline };
  } catch (error) {
    return { problem: `${error instanceof Error ? error.message : String(error)}\n${USAGE}` };
  }
};

/** Where on its line a hashed entry's text is: the column and the text the runner hashed. */
export type Recovered = { readonly column: number; readonly text: string };

/**
 * The span on `line` whose sha256 is the entry's, extracted as the runner extracts a finding's text (from a column to
 * the end of the line, capped), or undefined when no column gives it.
 */
export const recoverText = (sourceLines: readonly string[], line: number, sha256: string): Recovered | undefined => {
  const lineText = sourceLines[line - 1];
  if (lineText === undefined) return undefined;
  const columns = Array.from({ length: lineText.length + 1 }, (_, index) => index + 1);
  const column = columns.find((candidate) => sha256Of(excerptAt(sourceLines, line, candidate)) === sha256);
  return column === undefined ? undefined : { column, text: excerptAt(sourceLines, line, column) };
};

const NOT_FOUND = "no span on this line has this sha256: the document changed, or the line moved";

const hashedLines = (entry: HashedEntry, sourceLines: readonly string[] | undefined): string[] => {
  if (sourceLines === undefined) return [`  sha256: ${entry.sha256}`];
  const recovered = recoverText(sourceLines, entry.line, entry.sha256);
  return recovered === undefined ? [`  sha256: ${entry.sha256}`, `  ${NOT_FOUND}`] : [`  column ${String(recovered.column)}: ${recovered.text}`];
};

const bodyLines = (entry: ExpectedEntry, sourceLines: readonly string[] | undefined): string[] => {
  if (entry.verdict === "missed") return [`  what: ${entry.what}`];
  if ("sha256" in entry) return hashedLines(entry, sourceLines);
  return [`  text: ${entry.text}`, ...(entry.message === undefined ? [] : [`  message: ${entry.message}`])];
};

const entryLines = (entry: ExpectedEntry, sourceLines: readonly string[] | undefined): string[] => [
  `${entry.verdict}  ${entry.rule}  line ${String(entry.line)}`,
  ...bodyLines(entry, sourceLines),
  ...(entry.note === undefined ? [] : [`  note: ${entry.note}`]),
];

/** The document's text, or why there is none (then hashed entries show only their sha256). */
export type JudgeSource = { readonly text: string } | { readonly unavailable: string };

/** The lines `yarn judge` prints for one document. */
export const judgeReport = (expected: Expected, source: JudgeSource): string[] => {
  const sourceLines = "text" in source ? source.text.split(/\r?\n/) : undefined;
  const header = [`${expected.id} (judged against chaffjs ${expected.chaff}): ${String(expected.findings.length)} entries`];
  const unavailable = "unavailable" in source ? [`the document's text is not available (${source.unavailable}); hashed entries show only their sha256`] : [];
  return [...header, ...unavailable, ...expected.findings.flatMap((entry) => ["", ...entryLines(entry, sourceLines)])];
};
