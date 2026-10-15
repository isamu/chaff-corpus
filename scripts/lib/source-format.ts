// What a source at source.url is when it is not the text itself, and how it becomes the text that was judged. The
// names and the conversions are isamu/lab's (text/scripts/corpus-docs.ts), where these documents were fetched. Pure.
import { googlePatentsToMarkdown } from "./google-patents-markdown.ts";
import { htmlToMarkdown } from "./html/html-markdown.ts";
import { kokkaiToMarkdown } from "./kokkai-markdown.ts";
import { wikitextToMarkdown } from "./wikitext-markdown.ts";

const CONVERTERS = {
  wikitext: wikitextToMarkdown,
  html: htmlToMarkdown,
  "google-patents": googlePatentsToMarkdown,
  kokkai: kokkaiToMarkdown,
} as const;

export type SourceFormat = keyof typeof CONVERTERS;

export const SOURCE_FORMATS: readonly SourceFormat[] = ["wikitext", "html", "google-patents", "kokkai"];

export const isSourceFormat = (value: unknown): value is SourceFormat => SOURCE_FORMATS.some((format) => format === value);

/** The text a fetched source stands for: as fetched when it has no format, else converted as lab converted it. */
export const convertedText = (format: SourceFormat | undefined, fetched: string): string => (format === undefined ? fetched : CONVERTERS[format](fetched));
