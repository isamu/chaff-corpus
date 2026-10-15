// source.hf: a document that is one record of a Hugging Face dataset. The record is read from a JSONL data file at the
// dataset's commit (pinned), or from the datasets-server rows API (which serves the latest commit only); the text is one
// field of it, or the record rendered by a named renderer. Pure: fetching the URL is the caller's.
import { edinetBenchMarkdown } from "./edinet-bench-markdown.ts";
import type { Parsed } from "./expected.ts";
import { isNonEmptyString, isRecord, type UnknownRecord } from "./guards.ts";

const RENDERERS = { "edinet-bench": edinetBenchMarkdown } as const;

export type HfRenderer = keyof typeof RENDERERS;

export const HF_RENDERERS: readonly HfRenderer[] = ["edinet-bench"];

export type HfRow = {
  readonly dataset: string;
  readonly config: string;
  readonly split: string;
  /** The row in the split (rows API), or the line in `file` (both from 0). */
  readonly offset: number;
  /** The field that holds the text. */
  readonly field: string;
  /** The dataset's commit sha when the text was taken, so it cannot drift unnoticed. */
  readonly revision: string;
  /** A JSONL data file of the dataset at `revision`: read from it, pinned, instead of from the rows API. */
  readonly file?: string;
  /** Renders the whole record instead of taking `field` as it is. */
  readonly render?: HfRenderer;
  /** Parts the renderer leaves out (sections that name people, for example). */
  readonly omit?: readonly string[];
};

const DATASET_PATTERN = /^[A-Za-z0-9][\w.-]*\/[\w.-]+$/;
const REVISION_PATTERN = /^[0-9a-f]{40}$/;
const FILE_PATTERN = /^[\w.\-/]+\.jsonl$/;

const isHfRenderer = (value: unknown): value is HfRenderer => HF_RENDERERS.some((name) => name === value);

const isOffset = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;

const isStringList = (value: unknown): value is readonly string[] => Array.isArray(value) && value.every(isNonEmptyString);

const optionalProblems = (raw: UnknownRecord): string[] => [
  ...(raw["file"] === undefined || (typeof raw["file"] === "string" && FILE_PATTERN.test(raw["file"]) && !raw["file"].includes("..")) ? [] : ["source.hf.file must be a .jsonl path in the dataset"]),
  ...(raw["render"] === undefined || isHfRenderer(raw["render"]) ? [] : [`source.hf.render must be one of ${HF_RENDERERS.join(", ")}`]),
  ...(raw["omit"] === undefined || isStringList(raw["omit"]) ? [] : ["source.hf.omit must be a list of names"]),
  ...(raw["omit"] === undefined || raw["render"] !== undefined ? [] : ["source.hf.omit needs source.hf.render"]),
];

const hfProblems = (raw: UnknownRecord): string[] => [
  ...(typeof raw["dataset"] === "string" && DATASET_PATTERN.test(raw["dataset"]) ? [] : ["source.hf.dataset must be <owner>/<name>"]),
  ...(isNonEmptyString(raw["config"]) ? [] : ["source.hf.config is required"]),
  ...(isNonEmptyString(raw["split"]) ? [] : ["source.hf.split is required"]),
  ...(isOffset(raw["offset"]) ? [] : ["source.hf.offset must be a whole number from 0"]),
  ...(isNonEmptyString(raw["field"]) ? [] : ["source.hf.field is required"]),
  ...(typeof raw["revision"] === "string" && REVISION_PATTERN.test(raw["revision"]) ? [] : ["source.hf.revision must be the dataset's 40-digit commit sha"]),
  ...optionalProblems(raw),
];

const hfRowOf = (raw: UnknownRecord): HfRow => ({
  dataset: String(raw["dataset"]),
  config: String(raw["config"]),
  split: String(raw["split"]),
  offset: Number(raw["offset"]),
  field: String(raw["field"]),
  revision: String(raw["revision"]),
  ...(typeof raw["file"] === "string" ? { file: raw["file"] } : {}),
  ...(isHfRenderer(raw["render"]) ? { render: raw["render"] } : {}),
  ...(isStringList(raw["omit"]) ? { omit: raw["omit"] } : {}),
});

/** source.hf as the meta file has it, or what is wrong with it. */
export const parseHfRow = (raw: unknown): Parsed<HfRow> => {
  if (!isRecord(raw)) return { problems: ["source.hf must be a mapping (dataset, config, split, offset, field, revision)"] };
  const problems = hfProblems(raw);
  return problems.length > 0 ? { problems } : { value: hfRowOf(raw) };
};

/** Where the record is fetched from: the JSONL file at the pinned commit, else the rows API (latest commit). */
export const hfRowUrl = (row: HfRow): string => {
  if (row.file !== undefined) return `https://huggingface.co/datasets/${row.dataset}/resolve/${row.revision}/${row.file}`;
  const query = new URLSearchParams({ dataset: row.dataset, config: row.config, split: row.split, offset: String(row.offset), length: "1" });
  return `https://datasets-server.huggingface.co/rows?${query.toString()}`;
};

/** Whether hfRowUrl reads the dataset at `revision`; the rows API cannot be pinned. */
export const isPinned = (row: HfRow): boolean => row.file !== undefined;

const parsedJson = (text: string, what: string): Parsed<unknown> => {
  try {
    return { value: JSON.parse(text) };
  } catch (error) {
    return { problems: [`${what} is not JSON: ${error instanceof Error ? error.message : String(error)}`] };
  }
};

/** The record at `offset` in a rows API response. */
export const recordFromRows = (body: string, offset: number): Parsed<UnknownRecord> => {
  const parsed = parsedJson(body, "the rows API response");
  if ("problems" in parsed) return parsed;
  const rows = isRecord(parsed.value) ? parsed.value["rows"] : undefined;
  if (!Array.isArray(rows)) return { problems: ["the rows API response has no rows"] };
  const found: unknown = rows.find((entry: unknown) => isRecord(entry) && entry["row_idx"] === offset);
  if (!isRecord(found) || !isRecord(found["row"])) return { problems: [`no record at offset ${String(offset)}`] };
  return { value: found["row"] };
};

/** The record on line `offset` (from 0) of a JSONL file. */
export const recordFromJsonl = (body: string, offset: number): Parsed<UnknownRecord> => {
  const line = body.split("\n")[offset];
  if (line === undefined || line.trim() === "") return { problems: [`no record at line ${String(offset)}`] };
  const parsed = parsedJson(line, `line ${String(offset)}`);
  if ("problems" in parsed) return parsed;
  return isRecord(parsed.value) ? { value: parsed.value } : { problems: [`line ${String(offset)} is not a record`] };
};

/** The text of a record: its field as it is, or the record rendered. */
export const recordText = (row: HfRow, record: UnknownRecord): Parsed<string> => {
  if (row.render !== undefined) return RENDERERS[row.render](record, row.field, row.omit ?? []);
  const value = record[row.field];
  return typeof value === "string" ? { value } : { problems: [`the record has no text field "${row.field}"`] };
};

/** The document's text from what hfRowUrl served. */
export const hfText = (row: HfRow, body: string): Parsed<string> => {
  const record = row.file === undefined ? recordFromRows(body, row.offset) : recordFromJsonl(body, row.offset);
  return "problems" in record ? record : recordText(row, record.value);
};
