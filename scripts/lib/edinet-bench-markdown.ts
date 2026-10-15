// A record of SakanaAI/EDINET-Bench as Markdown: the report's sections (a JSON field of section -> period -> text), then
// the summary and the balance sheet, income statement and cash-flow statement (JSON fields of item -> period -> value)
// as tables, so that their figures can be read as tables. Pure.
import type { Parsed } from "./expected.ts";
import { isRecord, type UnknownRecord } from "./guards.ts";

/** The periods a record uses, oldest first, and the column heading each gets. */
const PERIODS: readonly (readonly [string, string])[] = [
  ["Prior4Year", "4期前"],
  ["Prior3Year", "3期前"],
  ["Prior2Year", "前々期"],
  ["Prior1Year", "前期"],
  ["CurrentYear", "当期"],
  ["FilingDate", "提出日"],
];

const TABLES: readonly (readonly [string, string])[] = [
  ["summary", "主要な経営指標等の推移"],
  ["bs", "貸借対照表"],
  ["pl", "損益計算書"],
  ["cf", "キャッシュ・フロー計算書"],
];

type Nested = Readonly<Record<string, Readonly<Record<string, string>>>>;

const isStringRecord = (value: unknown): value is Readonly<Record<string, string>> => isRecord(value) && Object.values(value).every((item) => typeof item === "string");

const isNested = (value: unknown): value is Nested => isRecord(value) && Object.values(value).every(isStringRecord);

const nestedField = (record: UnknownRecord, field: string): Parsed<Nested> => {
  const raw = record[field];
  if (typeof raw !== "string") return { problems: [`the record has no field "${field}"`] };
  try {
    const value: unknown = JSON.parse(raw);
    return isNested(value) ? { value } : { problems: [`"${field}" is not a mapping of name -> period -> text`] };
  } catch {
    return { problems: [`"${field}" is not JSON`] };
  }
};

const periodRank = (period: string): number => {
  const rank = PERIODS.findIndex(([known]) => known === period);
  return rank === -1 ? PERIODS.length : rank;
};

const byPeriod = (values: Readonly<Record<string, string>>): string[] =>
  Object.entries(values)
    .toSorted(([left], [right]) => periodRank(left) - periodRank(right))
    .map(([, text]) => text.trim())
    .filter((text) => text !== "");

const sectionsMarkdown = (sections: Nested, omit: readonly string[]): string[] =>
  Object.entries(sections)
    .filter(([name]) => !omit.includes(name))
    .flatMap(([name, values]) => {
      const texts = byPeriod(values);
      return texts.length === 0 ? [] : [`## ${name}`, ...texts];
    });

const cell = (value: string): string => value.replaceAll("|", "\\|");

const tableMarkdown = (heading: string, items: Nested): string[] => {
  const periods = PERIODS.filter(([period]) => Object.values(items).some((values) => values[period] !== undefined));
  if (periods.length === 0) return [];
  const rows = Object.entries(items).map(([item, values]) => `| ${[item, ...periods.map(([period]) => values[period] ?? "")].map(cell).join(" | ")} |`);
  const head = `| 科目 | ${periods.map(([, label]) => label).join(" | ")} |`;
  const rule = `| --- | ${periods.map(() => "---:").join(" | ")} |`;
  return [`## ${heading}（単位：円）`, [head, rule, ...rows].join("\n")];
};

const titleOf = (record: UnknownRecord): string => {
  const raw = record["meta"];
  try {
    const meta: unknown = typeof raw === "string" ? JSON.parse(raw) : undefined;
    if (!isStringRecord(meta)) return "# 有価証券報告書";
    const period = meta["当事業年度開始日"] === undefined ? "" : `（${meta["当事業年度開始日"]}〜${meta["当事業年度終了日"] ?? ""}）`;
    return `# ${meta["会社名"] ?? ""} ${meta["提出書類"] ?? "有価証券報告書"}${period}`;
  } catch {
    return "# 有価証券報告書";
  }
};

const tablesMarkdown = (record: UnknownRecord): Parsed<string[]> => {
  const parsed = TABLES.filter(([field]) => typeof record[field] === "string" && record[field] !== "").map(([field, heading]) => ({ heading, items: nestedField(record, field) }));
  const problems = parsed.flatMap(({ items }) => ("problems" in items ? items.problems : []));
  if (problems.length > 0) return { problems };
  return { value: parsed.flatMap(({ heading, items }) => ("value" in items ? tableMarkdown(heading, items.value) : [])) };
};

/** The record as one Markdown document: title, the sections in `field` (less `omit`), then the tables. */
export const edinetBenchMarkdown = (record: UnknownRecord, field: string, omit: readonly string[]): Parsed<string> => {
  const sections = nestedField(record, field);
  if ("problems" in sections) return sections;
  const tables = tablesMarkdown(record);
  if ("problems" in tables) return tables;
  return { value: `${[titleOf(record), ...sectionsMarkdown(sections.value, omit), ...tables.value].join("\n\n")}\n` };
};
