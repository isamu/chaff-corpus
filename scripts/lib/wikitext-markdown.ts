// Based on isamu/lab text/scripts/wikitext-markdown.ts (9013b5fb), extended here to keep what lab's version dropped:
// a table's cells, and the text of an unknown inline template.
// MediaWiki wikitext (a Wikivoyage or Wikisource page, as action=raw returns it) as plain Markdown: headings,
// paragraphs, lists, tables and the text of links. A template the converter knows shows the words it carries (a map
// marker's name, a listing's name and description, a converted quantity, a price, a phone number, the text a layout
// template or a quotation wraps); any other template written inside a line of text shows its one value ({{phab|T123}}
// is "T123"), and is dropped when it stands on a line of its own (an infobox, a navigation box, a banner), has named
// or several values, or is a reference. Files, references and comments are dropped. Pure.
import { decodeEntities, tidyLines } from "./html/markup-text.ts";
import { splitOutside } from "./wikitext-split.ts";
import { tableMarkdown, tableRanges } from "./wikitext-table.ts";
import { withoutMarkupTags } from "./wikitext-tags.ts";

type Params = { readonly named: ReadonlyMap<string, string>; readonly positional: readonly string[] };

/** The index just past the `close` that balances an `open` already read, or -1 when it never closes. */
const closingOf = (text: string, open: string, close: string, from: number, depth: number): number => {
  if (depth === 0) return from;
  const nextClose = text.indexOf(close, from);
  if (nextClose === -1) return -1;
  const nextOpen = text.indexOf(open, from);
  if (nextOpen !== -1 && nextOpen < nextClose) return closingOf(text, open, close, nextOpen + open.length, depth + 1);
  return closingOf(text, open, close, nextClose + close.length, depth - 1);
};

/** Whether text[start, end) has nothing but spaces beside it on its line. */
const standsAlone = (text: string, start: number, end: number): boolean => {
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const newline = text.indexOf("\n", end);
  return /^[ \t]*$/u.test(text.slice(lineStart, start)) && /^[ \t]*$/u.test(text.slice(end, newline === -1 ? text.length : newline));
};

type Render = (inside: string, alone: boolean) => string;

const replaceBalancedFrom = (text: string, open: string, close: string, render: Render, from: number, out: string[]): string[] => {
  const start = text.indexOf(open, from);
  if (start === -1) {
    out.push(text.slice(from));
    return out;
  }
  const end = closingOf(text, open, close, start + open.length, 1);
  if (end === -1) {
    out.push(text.slice(from, start + open.length));
    return replaceBalancedFrom(text, open, close, render, start + open.length, out);
  }
  out.push(text.slice(from, start), render(text.slice(start + open.length, end - close.length), standsAlone(text, start, end)));
  return replaceBalancedFrom(text, open, close, render, end, out);
};

/**
 * Every outermost `open … close` replaced by render(inside, alone), alone when nothing else is on its line. An unclosed
 * opener is left as written, and what follows it is still read.
 */
const replaceBalanced = (text: string, open: string, close: string, render: Render): string => replaceBalancedFrom(text, open, close, render, 0, []).join("");

/** Split at the `|`s that are not inside a nested template or link. */
const splitTopLevel = (inside: string): string[] => splitOutside(inside, "|");

const paramsOf = (args: readonly string[], valueOf: (raw: string) => string): Params => {
  const named = new Map<string, string>();
  const positional: string[] = [];
  args.forEach((arg) => {
    const equals = arg.indexOf("=");
    const key = equals === -1 ? "" : arg.slice(0, equals).trim();
    if (/^[\w -]+$/u.test(key)) named.set(key, valueOf(arg.slice(equals + 1)));
    else positional.push(valueOf(arg));
  });
  return { named, positional };
};

/** vCard documents `content` as another name for `description`. */
const descriptionOf = (params: Params): string => ["content", "description"].map((key) => params.named.get(key) ?? "").find((value) => value !== "") ?? "";

const listing = (params: Params): string => [params.named.get("name") ?? "", descriptionOf(params)].filter((part) => part !== "").join(": ");

const priced =
  (symbol: string) =>
  (params: Params): string =>
    `${symbol}${params.positional[0] ?? ""}`;

/** A template that shows its first value in a unit, as {{convert}} does without the conversion: {{km|10}} is "10 km". */
const measured =
  (unit: string) =>
  (params: Params): string =>
    `${params.positional[0] ?? ""} ${unit}`;

/**
 * A link whose text is its first value: a web search ({{google|query}}), and a link to a template, shown with its braces
 * ({{tlx|name}}). With no value it shows nothing, like a dropped template.
 */
const linkText =
  (shown: (text: string) => string) =>
  (params: Params): string => {
    const text = valueAt(params, 1) ?? "";
    return text === "" ? DROPPED : shown(text);
  };

const LISTINGS = ["see", "do", "buy", "eat", "drink", "sleep", "go", "listing", "vcard"];

/** Templates that are {{convert}} with a fixed unit, and the unit they show. */
const UNITS: Readonly<Record<string, string>> = { km: "km", kilometer: "km", ha: "ha", hectare: "ha" };

/** The templates whose words are part of the sentence around them. Every other template is dropped. */
const RENDERERS: Readonly<Record<string, (params: Params) => string>> = {
  ...Object.fromEntries(LISTINGS.map((name) => [name, listing])),
  marker: (params) => params.named.get("name") ?? "",
  station: (params) => params.positional[0] ?? "",
  ...Object.fromEntries(Object.entries(UNITS).map(([name, unit]) => [name, measured(unit)])),
  convert: (params) => params.positional.slice(0, 2).join(" "),
  eur: priced("€"),
  usd: priced("$"),
  gbp: priced("£"),
  jpy: priced("¥"),
  phone: (params) => params.positional[0] ?? "",
  google: linkText((text) => text),
  tl: linkText((name) => `{{${name}}}`),
  tlx: linkText((name) => `{{${name}}}`),
};

/**
 * What the converter drops leaves this mark, so only its gap is closed: "Knokke {{rint|be|rail}}, then" becomes
 * "Knokke, then", and "a {{x}} b" becomes "a b". Spaces the writer typed ("Wait ... then") are left as they are.
 */
const DROPPED = "\uE000";
/** Drops next to each other, with or without spaces between, are one drop. */
const DROPPED_SPACED = /\uE000[ \t]+(?=\uE000)/gu;
const DROPPED_RUN = /\uE000{2,}/gu;
const DROPPED_GAP = /[ \t]?\uE000(?:([,.;:!?)])|[ \t])/gu;

/** The nth value, whether written in its place or by number (`1=` lets the text hold an `=`). */
const valueAt = (params: Params, n: number): string | undefined => params.named.get(String(n)) ?? params.positional[n - 1];

const firstValue = (params: Params): string => valueAt(params, 1) ?? "";

/** {{center}} and {{quote}} also take their text by name. */
const textValue = (params: Params): string => params.named.get("text") ?? firstValue(params);

/** {{resize|size|text}}, or {{resize|text}} in a default smaller size. */
const resizedText = (params: Params): string => valueAt(params, 2) ?? firstValue(params);

// The mark on each side of the text of a template drawn as a block of its own (a <div> on the page), where the text is
// set apart from what surrounds it.
const BLOCK_EDGE = "\uE001";

const block =
  (textOf: (params: Params) => string) =>
  (params: Params): string =>
    `${BLOCK_EDGE}${textOf(params)}${BLOCK_EDGE}`;

/**
 * Templates that only lay out or size the text they wrap (Wikisource's centred 主文 and 理由, a signature set to the
 * right), and a quotation: they show as their text, with its lines as written. A second value is an offset or a size,
 * never text, except in {{resize}}; a quotation's author and source are left out, since the wikis number them differently.
 */
const WRAPPERS: Readonly<Record<string, (params: Params) => string>> = {
  center: block(textValue),
  c: block(textValue),
  "block center": block(firstValue),
  bc: block(firstValue),
  right: block(firstValue),
  left: block(firstValue),
  quote: block(textValue),
  larger: firstValue,
  smaller: firstValue,
  resize: resizedText,
};

/** Each value with its own templates expanded and its spaces made one, so a dropped icon leaves no gap. */
const inlineValue = (raw: string): string => expandTemplates(raw, true).replace(/\s+/gu, " ").trim();

/** Each value with its own templates expanded and its lines kept. */
const textBlockValue = (raw: string): string => expandTemplates(raw, true).trim();

/** A template inside a value is part of the text around it, even when it fills the value. */
const expandTemplates = (text: string, nested = false): string => replaceBalanced(text, "{{", "}}", (inside, alone) => renderTemplate(inside, alone && !nested));

/**
 * Templates that never carry the sentence's words, whatever they are given: a reference or a footnote, and the boxes and
 * links that a page shows apart from its text (navigation, an infobox, a hatnote, a banner, a map, a sort key).
 */
const NOT_TEXT = /^(?:r|ref\b.*|refn|efn|sfn.*|harv.*|cite\b.*|citation\b.*|note\b.*|infobox\b.*|navbox\b.*|sidebar\b.*|toc\b.*|main|see ?also|further|related|about|for|distinguish|redirect|is ?part ?of|part ?of.*|page ?banner|geo|mapframe|mapsources|defaultsort.*|デフォルトソート.*)$/u;

/**
 * A template the converter does not know shows its value only where that is the text the page shows in its place: it is
 * written inside a line of text, on one line, with exactly one value and no named one ({{phab|T123}}, {{code|x}}). With
 * several values the last is as often an icon or a date part ({{rint|be|rail}}, {{start date|2004|03|09}}) as text.
 */
const unknownTemplateText = (name: string, args: readonly string[], alone: boolean): string => {
  if (alone || NOT_TEXT.test(name) || args.length !== 1 || args.some((arg) => arg.includes("\n"))) return DROPPED;
  const params = paramsOf(args, inlineValue);
  const value = params.named.size === 0 ? (params.positional[0] ?? "") : "";
  return value === "" ? DROPPED : value;
};

function renderTemplate(inside: string, alone: boolean): string {
  const [head = "", ...args] = splitTopLevel(inside);
  const name = head.trim().toLowerCase().replace(/_/gu, " ");
  const wrapper = Object.hasOwn(WRAPPERS, name) ? WRAPPERS[name] : undefined;
  if (wrapper !== undefined) return wrapper(paramsOf(args, textBlockValue));
  const render = Object.hasOwn(RENDERERS, name) ? RENDERERS[name] : undefined;
  return render === undefined ? unknownTemplateText(name, args, alone) : render(paramsOf(args, inlineValue));
}

/** A heading, a list item, an indented line or a definition: one line that a paragraph break would cut in two. */
const MARKED_LINE = /^[ \t]*[=*#:;]/u;

/**
 * A block template's text is a paragraph of its own, as the page shows a <div> apart from the text beside it; on a
 * heading or list line it stays inline, so that the line is not broken.
 */
const withBlocksApart = (text: string): string =>
  text
    .split("\n")
    .map((line) => line.replaceAll(BLOCK_EDGE, MARKED_LINE.test(line) ? "" : "\n\n"))
    .join("\n");

// 日本語版のウィキ（Wikivoyage・Wikisource）は、同じ名前空間を日本語の名前でも書く。
const DROPPED_NAMESPACES = new Set(["file", "image", "media", "category", "ファイル", "画像", "メディア", "カテゴリ"]);

const renderLink = (inside: string): string => {
  const parts = splitTopLevel(inside);
  const target = (parts[0] ?? "").trim().replace(/^:/u, "");
  const colon = target.indexOf(":");
  if (colon !== -1 && DROPPED_NAMESPACES.has(target.slice(0, colon).trim().toLowerCase())) return DROPPED;
  return (parts.length > 1 ? parts.slice(1).join("|") : target).trim();
};

/** Where a table stood while the text around it is converted: its index between two marks, on a line of its own. */
const TABLE_MARK = /\uE002(\d+)\uE003/gu;

/** Each top-level table replaced by its mark, and the table's own lines kept aside. */
const tablesSetAside = (lines: readonly string[]): { readonly lines: string[]; readonly tables: string[][] } => {
  const ranges = tableRanges(lines);
  const tables = ranges.map((range) => lines.slice(range.start, range.end + 1));
  const kept = lines.flatMap((line, index) => {
    const table = ranges.findIndex((range) => index >= range.start && index <= range.end);
    if (table === -1) return [line];
    return ranges[table]?.start === index ? [`\uE002${table}\uE003`] : [];
  });
  return { lines: kept, tables };
};

/**
 * The text of the given wikitext, with templates written in it read as text rather than as lines of their own
 * (a table cell's text), or not (a page's text).
 */
const inlineText = (text: string, inCell = false): string =>
  decodeEntities(
    withoutMarkupTags(replaceBalanced(expandTemplates(text, inCell), "[[", "]]", renderLink)
      .replace(/\[(?:https?:)?\/\/[^\s\]]+(?: ([^\]]*))?\]/giu, (_whole: string, label: string | undefined) => (label === undefined ? DROPPED : label.trim()))
      .replace(/<br\s*\/?>/giu, " "))
      .replace(/'{2,5}/gu, ""),
  )
    .replace(DROPPED_SPACED, "")
    .replace(DROPPED_RUN, DROPPED)
    .replace(DROPPED_GAP, (_gap: string, after: string | undefined) => after ?? " ")
    .replace(/\uE000/gu, "");

/** A cell's text on one line, with a `|` in it escaped so that it does not end the cell. */
const cellText = (wikitext: string): string => inlineText(wikitext, true).replaceAll(BLOCK_EDGE, " ").replace(/\s+/gu, " ").trim().replaceAll("|", "\\|");

/** Each table's mark replaced by the table, as a block apart from the text around it. */
const withTables = (text: string, tables: readonly (readonly string[])[]): string =>
  text.replace(TABLE_MARK, (_mark: string, index: string) => ["", "", ...tableMarkdown(tables[Number(index)] ?? [], cellText), "", ""].join("\n"));

const LIST_MARK: Readonly<Record<string, string>> = { "*": "- ", "#": "1. " };

const leading = (text: string, char: string): number => {
  const other = Array.from(text).findIndex((each) => each !== char);
  return other === -1 ? text.length : other;
};

/** `== Heading ==` at levels 1 to 6: the level is the shorter of the two runs of `=`. */
const headingOf = (line: string): string | undefined => {
  const level = Math.min(leading(line, "="), leading(Array.from(line).toReversed().join(""), "="), 6);
  if (level === 0 || line.length <= level * 2) return undefined;
  return `${"#".repeat(level)} ${line.slice(level, line.length - level).trim()}`;
};

const markdownLine = (line: string): string => {
  const heading = headingOf(line);
  if (heading !== undefined) return heading;
  const marks = /^[*#:;]+/u.exec(line)?.[0] ?? "";
  if (marks === "") return line;
  const body = line.slice(marks.length).trim();
  const mark = LIST_MARK[marks.slice(-1)];
  if (body === "" || mark === undefined) return body;
  return `${"  ".repeat(marks.length - 1)}${mark}${body}`;
};

/**
 * A line indented with `:` (a reply on a talk page) or a `;` term: the page shows each as a block of its own (<dd>,
 * <dt>), so each is a paragraph of its own rather than one run-on paragraph with its neighbours. A `*:` or `#:` line
 * continues a list item and is left as it was.
 */
const OWN_BLOCK = /^[:;]+(?=[^:;*#]|$)/u;

const markdownLines = (line: string): string[] => (OWN_BLOCK.test(line) ? ["", markdownLine(line), ""] : [markdownLine(line)]);

export const wikitextToMarkdown = (source: string): string => {
  const cleaned = source
    .replace(/<!--[\s\S]*?-->/gu, "")
    .replace(/<ref\b[^>]*\/>/giu, "")
    .replace(/<(ref|gallery)\b[^>]*>[\s\S]*?<\/\1\s*>/giu, "")
    .replace(/__[A-Z]+__/gu, "");
  const { lines, tables } = tablesSetAside(cleaned.split("\n"));
  const text = withTables(withBlocksApart(inlineText(lines.join("\n"))), tables);
  return tidyLines(text.split("\n").flatMap((line) => markdownLines(line.trim())));
};
