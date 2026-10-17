// A MediaWiki table ({| … |}) as a Markdown table: its caption as a line of its own, then one row per table row with
// each cell's text, a cell that spans rows repeated as an empty cell below it. Pure: the caller renders a cell's wikitext.
import { openDepth, splitOutside } from "./wikitext-split.ts";

type RawCell = { readonly attributes: string; readonly lines: string[] };

type Parsed = { readonly captions: string[]; readonly rows: RawCell[][]; nested: number };

/** A cell's leading `attributes |`, as in `rowspan=2 | text` or `style="…" | text`. */
const ATTRIBUTES = /^\s*(?:[\w-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'|]+)\s*)*$/u;

const rawCell = (written: string): RawCell => {
  const parts = splitOutside(written, "|");
  const [first = "", ...rest] = parts;
  if (rest.length > 0 && ATTRIBUTES.test(first)) return { attributes: first, lines: [rest.join("|")] };
  return { attributes: "", lines: [written] };
};

/** `! a !! b` and `| a || b`: a header row may separate its cells either way. */
const cellsOf = (line: string): RawCell[] => {
  const body = line.trim().slice(1);
  const written = line.trim().startsWith("!") ? splitOutside(body, "!!").flatMap((part) => splitOutside(part, "||")) : splitOutside(body, "||");
  return written.map(rawCell);
};

const lastCell = (parsed: Parsed): RawCell | undefined => parsed.rows.at(-1)?.at(-1);

const currentRow = (parsed: Parsed): RawCell[] => {
  const row = parsed.rows.at(-1);
  if (row !== undefined) return row;
  const started: RawCell[] = [];
  parsed.rows.push(started);
  return started;
};

/** A table inside a cell is flattened into the cell's text: its cells' words, without its marks. */
const nestedLine = (parsed: Parsed, trimmed: string): void => {
  if (trimmed.startsWith("{|")) parsed.nested += 1;
  else if (trimmed.startsWith("|}")) parsed.nested -= 1;
  else if (!trimmed.startsWith("|-") && !trimmed.startsWith("|+")) lastCell(parsed)?.lines.push(trimmed.replace(/^[|!]/u, "").replace(/\|\||!!/gu, " "));
};

const readLine = (parsed: Parsed, line: string): void => {
  const trimmed = line.trim();
  const cell = lastCell(parsed);
  if (cell !== undefined && openDepth(cell.lines.join("\n")) > 0) cell.lines.push(line);
  else if (parsed.nested > 0 || trimmed.startsWith("{|")) nestedLine(parsed, trimmed);
  else if (trimmed.startsWith("|+")) parsed.captions.push(trimmed.slice(2));
  else if (trimmed.startsWith("|-")) parsed.rows.push([]);
  else if (trimmed.startsWith("|") || trimmed.startsWith("!")) currentRow(parsed).push(...cellsOf(trimmed));
  else cell?.lines.push(line);
};

/** The lines between `{|` and `|}`, without either. */
const parse = (body: readonly string[]): Parsed => {
  const parsed: Parsed = { captions: [], rows: [], nested: 0 };
  body.forEach((line) => readLine(parsed, line));
  return parsed;
};

const spanOf = (attributes: string, name: string): number => {
  const written = new RegExp(`\\b${name}\\s*=\\s*["']?(\\d+)`, "iu").exec(attributes)?.[1];
  return Math.max(1, Number(written ?? "1"));
};

/** Each row's cells placed in their columns: a cell spanning rows leaves an empty cell in the rows below it. */
const placed = (rows: readonly (readonly { readonly text: string; readonly rowspan: number; readonly colspan: number }[])[]): string[][] => {
  const below = new Map<number, number>();
  return rows.map((row) => {
    const out: string[] = [];
    const fillSpanned = (): void => {
      while ((below.get(out.length) ?? 0) > 0) {
        below.set(out.length, (below.get(out.length) ?? 0) - 1);
        out.push("");
      }
    };
    row.forEach((cell) => {
      fillSpanned();
      Array.from({ length: cell.colspan }, (_unused, offset) => offset).forEach((offset) => {
        if (cell.rowspan > 1) below.set(out.length, cell.rowspan - 1);
        out.push(offset === 0 ? cell.text : "");
      });
    });
    fillSpanned();
    return out;
  });
};

const markdownRow = (cells: readonly string[], width: number): string =>
  `| ${Array.from({ length: width }, (_unused, index) => cells[index] ?? "").join(" | ")} |`;

/** A cell's lines as one: a list mark at the start of a line is dropped, as a Markdown cell holds no list. */
const cellSource = (cell: RawCell): string => cell.lines.map((line) => line.trim().replace(/^[*#:;]+\s*/u, "")).join("\n");

/**
 * The table whose lines (from `{|` to `|}`) are given, as Markdown lines: the caption, a blank line, and the table, its
 * first row read as the header. cellText turns a cell's wikitext into one line of text without `|`.
 */
export const tableMarkdown = (lines: readonly string[], cellText: (wikitext: string) => string): string[] => {
  const closed = lines.length > 1 && (lines.at(-1) ?? "").trim().startsWith("|}");
  const parsed = parse(lines.slice(1, closed ? -1 : undefined));
  const rows = placed(
    parsed.rows.map((row) => row.map((cell) => ({ text: cellText(cellSource(cell)), rowspan: spanOf(cell.attributes, "rowspan"), colspan: spanOf(cell.attributes, "colspan") }))),
  ).filter((row) => row.some((text) => text !== ""));
  const captions = parsed.captions.map((caption) => cellText(rawCell(caption).lines.join("\n"))).filter((caption) => caption !== "");
  const width = Math.max(0, ...rows.map((row) => row.length));
  const [header, ...body] = rows;
  const table = header === undefined ? [] : [markdownRow(header, width), markdownRow(Array.from({ length: width }, () => "---"), width), ...body.map((row) => markdownRow(row, width))];
  return [...captions.flatMap((caption) => [caption, ""]), ...table];
};

/** Where each top-level table starts and ends in the lines, `{|` to its own `|}` (or the last line when it never closes). */
export const tableRanges = (lines: readonly string[]): { readonly start: number; readonly end: number }[] => {
  const ranges: { start: number; end: number }[] = [];
  const state = { depth: 0, start: 0 };
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("{|")) {
      if (state.depth === 0) state.start = index;
      state.depth += 1;
    } else if (state.depth > 0 && trimmed.startsWith("|}")) {
      state.depth -= 1;
      if (state.depth === 0) ranges.push({ start: state.start, end: index });
    }
  });
  if (state.depth > 0) ranges.push({ start: state.start, end: lines.length - 1 });
  return ranges;
};
