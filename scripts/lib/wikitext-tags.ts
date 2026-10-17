// Which `<…>` in wikitext is markup: MediaWiki renders any other angle-bracket text as written (an IRC nick such as
// `<jinxer-wm>`, an address such as `<user@host>`), so only real tags may be stripped. Pure.

/** The HTML elements MediaWiki accepts in wikitext, and the tags its extensions add. */
const MARKUP_TAGS = new Set([
  ...["a", "abbr", "b", "bdi", "bdo", "big", "blockquote", "br", "caption", "center", "cite", "code", "col", "colgroup"],
  ...["data", "dd", "del", "dfn", "div", "dl", "dt", "em", "font", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img"],
  ...["ins", "kbd", "li", "link", "mark", "meta", "ol", "p", "pre", "q", "rb", "rp", "rt", "rtc", "ruby", "s", "samp"],
  ...["small", "span", "strike", "strong", "sub", "sup", "table", "tbody", "td", "tfoot", "th", "thead", "time", "tr"],
  ...["tt", "u", "ul", "var", "wbr"],
  ...["nowiki", "syntaxhighlight", "source", "math", "chem", "ce", "score", "poem", "gallery", "ref", "references"],
  ...["includeonly", "noinclude", "onlyinclude", "templatestyles", "templatedata", "timeline", "graph", "chart"],
  ...["mapframe", "maplink", "section", "categorytree", "hiero", "inputbox", "imagemap", "indicator", "charinsert"],
  ...["translate", "tvar", "languages", "langconvert", "phonos", "quiz", "rss", "dynamicpagelist"],
]);

const TAG_PARTS = /^<\/?([a-z][a-z0-9]*)((?:\s[^>]*)?)\/?>$/iu;

/** One `name=` attribute at least, as a tag written for a page's markup carries. */
const ATTRIBUTE = /^\s+[a-z][\w:.-]*\s*=/iu;

/** Whether the given `<…>` is a tag: a known tag name, a name followed by an attribute, or a closing tag of a name in `opened`. */
export const isMarkupTag = (tag: string, opened: ReadonlySet<string> = new Set()): boolean => {
  const parts = TAG_PARTS.exec(tag);
  if (parts === null) return false;
  const name = (parts[1] ?? "").toLowerCase();
  return MARKUP_TAGS.has(name) || ATTRIBUTE.test(parts[2] ?? "") || (tag.startsWith("</") && opened.has(name));
};

const ANGLED = /<\/?[a-z][^>]*>/giu;

/** The names of the tags in the text that are tags only by their attributes, so that their closing tags go with them. */
const attributedNames = (text: string): Set<string> =>
  new Set([...text.matchAll(ANGLED)].flatMap((match) => (isMarkupTag(match[0]) ? [(TAG_PARTS.exec(match[0])?.[1] ?? "").toLowerCase()] : [])));

/** The text with its tags removed and any other angle-bracket text left as written. */
export const withoutMarkupTags = (text: string): string => {
  const opened = attributedNames(text);
  return text.replace(ANGLED, (tag: string) => (isMarkupTag(tag, opened) ? "" : tag));
};
