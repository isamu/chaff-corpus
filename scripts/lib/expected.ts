// expected/<id>.yaml: what chaff gives on one document, each finding judged. Pure: reading and writing the file is the caller's.
import { isNonEmptyString, isPositiveInteger, isRecord, optionalString, type UnknownRecord } from "./guards.ts";

export const JUDGED_VERDICTS = ["correct", "false-positive", "unjudged"] as const;
export type JudgedVerdict = (typeof JUDGED_VERDICTS)[number];

type JudgedFields = { readonly verdict: JudgedVerdict; readonly rule: string; readonly line: number; readonly note?: string };

/** A finding chaff gives, identified by rule, line and the text at its position. */
export type TextEntry = JudgedFields & { readonly text: string; readonly message?: string };

/** The same on a document that may not be redistributed: the text is known only by its sha256, and no message is kept. */
export type HashedEntry = JudgedFields & { readonly sha256: string };

export type JudgedEntry = TextEntry | HashedEntry;

/** A finding chaff should give and does not: what a reader expects on that line. */
export type MissedEntry = {
  readonly verdict: "missed";
  readonly rule: string;
  readonly line: number;
  readonly what: string;
  readonly note?: string;
};

export type ExpectedEntry = JudgedEntry | MissedEntry;

export type Expected = {
  readonly id: string;
  /** The chaffjs version the file was first written against. */
  readonly chaff: string;
  readonly findings: readonly ExpectedEntry[];
};

export type Parsed<T> = { readonly value: T } | { readonly problems: readonly string[] };

const isJudgedVerdict = (value: unknown): value is JudgedVerdict => JUDGED_VERDICTS.some((verdict) => verdict === value);

const withNote = <T extends object>(entry: T, raw: UnknownRecord): T => {
  const note = optionalString(raw["note"]);
  return note === undefined ? entry : { ...entry, note };
};

const missedEntryOf = (raw: UnknownRecord, rule: string, line: number): MissedEntry | string => {
  if (!isNonEmptyString(raw["what"])) return "a missed entry needs `what`";
  const entry: MissedEntry = { verdict: "missed", rule, line, what: raw["what"] };
  return withNote(entry, raw);
};

const SHA256_PATTERN = /^[0-9a-f]{64}$/;

const hashedEntryOf = (raw: UnknownRecord, fields: JudgedFields): HashedEntry | string => {
  if (typeof raw["sha256"] !== "string" || !SHA256_PATTERN.test(raw["sha256"])) return "sha256 must be 64 lowercase hex digits";
  if (raw["message"] !== undefined) return "a finding known by `sha256` keeps no `message`";
  return withNote({ ...fields, sha256: raw["sha256"] }, raw);
};

const judgedEntryOf = (raw: UnknownRecord, rule: string, line: number): JudgedEntry | string => {
  const verdict = raw["verdict"];
  if (!isJudgedVerdict(verdict)) return `verdict must be one of ${[...JUDGED_VERDICTS, "missed"].join(", ")}`;
  const hasText = raw["text"] !== undefined;
  if (hasText === (raw["sha256"] !== undefined)) return "a finding needs exactly one of `text` and `sha256`";
  if (!hasText) return hashedEntryOf(raw, { verdict, rule, line });
  if (typeof raw["text"] !== "string") return "`text` must be a string";
  const message = optionalString(raw["message"]);
  const entry = { verdict, rule, line, text: raw["text"] };
  return withNote(message === undefined ? entry : { ...entry, message }, raw);
};

const entryOf = (raw: unknown): ExpectedEntry | string => {
  if (!isRecord(raw)) return "an entry must be a mapping";
  const rule = raw["rule"];
  const line = raw["line"];
  if (!isNonEmptyString(rule)) return "an entry needs `rule`";
  if (!isPositiveInteger(line)) return "an entry needs a positive integer `line`";
  return raw["verdict"] === "missed" ? missedEntryOf(raw, rule, line) : judgedEntryOf(raw, rule, line);
};

const entriesOf = (raw: unknown): { entries: ExpectedEntry[]; problems: string[] } => {
  const list: readonly unknown[] = Array.isArray(raw) ? raw : [];
  const results = list.map((item, index) => ({ index, result: entryOf(item) }));
  return {
    entries: results.flatMap(({ result }) => (typeof result === "string" ? [] : [result])),
    problems: results.flatMap(({ index, result }) => (typeof result === "string" ? [`findings[${String(index)}]: ${result}`] : [])),
  };
};

const headerProblems = (raw: UnknownRecord, id: string): string[] => [
  ...(raw["id"] === id ? [] : [`id must be "${id}" (the file name)`]),
  ...(isNonEmptyString(raw["chaff"]) ? [] : ["`chaff` (the version judged against) is required"]),
  ...(raw["findings"] === undefined || Array.isArray(raw["findings"]) ? [] : ["`findings` must be a list"]),
];

/** The expected file of document `id`, or what is wrong with it. */
export const parseExpected = (raw: unknown, id: string): Parsed<Expected> => {
  if (!isRecord(raw)) return { problems: ["the file must be a mapping"] };
  const { entries, problems } = entriesOf(raw["findings"]);
  const all = [...headerProblems(raw, id), ...problems];
  if (all.length > 0) return { problems: all };
  return { value: { id, chaff: String(raw["chaff"]), findings: entries } };
};

/** True when every finding on the document has a verdict: a new finding there is then a change someone must look at. */
export const isFullyJudged = (expected: Expected | undefined): boolean =>
  expected !== undefined && expected.findings.every((entry) => entry.verdict !== "unjudged");

const entryOrder = (left: ExpectedEntry, right: ExpectedEntry): number =>
  left.line - right.line || left.rule.localeCompare(right.rule) || keyText(left).localeCompare(keyText(right));

const keyText = (entry: ExpectedEntry): string => {
  if (entry.verdict === "missed") return entry.what;
  return "sha256" in entry ? entry.sha256 : entry.text;
};

/** What is wrong with the file of a document that may not be redistributed: every entry that quotes its text. */
export const quotingProblems = (expected: Expected): string[] =>
  expected.findings.flatMap((entry, index) =>
    "text" in entry ? [`findings[${String(index)}] (${entry.rule}, line ${String(entry.line)}): the document may not be redistributed, so keep \`sha256\`, not \`text\` or \`message\``] : [],
  );

/** The entries in the order the file keeps them: by line, then rule, then text (or its sha256). */
export const sortedEntries = (entries: readonly ExpectedEntry[]): ExpectedEntry[] => entries.toSorted(entryOrder);
