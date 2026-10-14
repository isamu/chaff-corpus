// One finding chaff gave, as read from its SARIF output.
import { isNonEmptyString, isPositiveInteger, isRecord, type UnknownRecord } from "./guards.ts";

export type Finding = {
  readonly rule: string;
  readonly line: number;
  readonly column: number;
  /** The document's own text from the finding's column, so a reader can see what it points at. */
  readonly text: string;
  readonly message: string;
};

export const TEXT_EXCERPT_CHARS = 40;

const RULE_PREFIX = "chaff/";

/** The source at line:column (both 1-based), up to the end of that line. */
export const excerptAt = (sourceLines: readonly string[], line: number, column: number): string => {
  const lineText = sourceLines[line - 1] ?? "";
  return [...lineText.slice(Math.max(column - 1, 0))].slice(0, TEXT_EXCERPT_CHARS).join("").trimEnd();
};

const regionOf = (result: UnknownRecord): UnknownRecord => {
  const locations = result["locations"];
  const first: unknown = Array.isArray(locations) ? locations[0] : undefined;
  const physical = isRecord(first) ? first["physicalLocation"] : undefined;
  const region = isRecord(physical) ? physical["region"] : undefined;
  return isRecord(region) ? region : {};
};

const messageOf = (result: UnknownRecord): string => {
  const message = result["message"];
  return isRecord(message) && typeof message["text"] === "string" ? message["text"] : "";
};

const findingOf = (result: unknown, sourceLines: readonly string[]): Finding | undefined => {
  if (!isRecord(result) || !isNonEmptyString(result["ruleId"])) return undefined;
  const region = regionOf(result);
  const line = isPositiveInteger(region["startLine"]) ? region["startLine"] : 1;
  const column = isPositiveInteger(region["startColumn"]) ? region["startColumn"] : 1;
  const rule = result["ruleId"].startsWith(RULE_PREFIX) ? result["ruleId"].slice(RULE_PREFIX.length) : result["ruleId"];
  return { rule, line, column, text: excerptAt(sourceLines, line, column), message: messageOf(result) };
};

const resultsOf = (sarif: unknown): readonly unknown[] => {
  const runs = isRecord(sarif) ? sarif["runs"] : undefined;
  const run: unknown = Array.isArray(runs) ? runs[0] : undefined;
  const results = isRecord(run) ? run["results"] : undefined;
  return Array.isArray(results) ? results : [];
};

/** The findings of a SARIF log chaff wrote for one document, in the order chaff gave them. */
export const findingsFromSarif = (sarif: unknown, source: string): Finding[] => {
  const sourceLines = source.split(/\r?\n/);
  return resultsOf(sarif).flatMap((result) => findingOf(result, sourceLines) ?? []);
};
