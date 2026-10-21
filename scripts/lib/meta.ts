// docs/<lang>/<genre>/<id>.yaml: what a document is, where it came from and under which licence. Pure.
import { createHash } from "node:crypto";
import { isHttpUrl, isNonEmptyString, isRecord, optionalString, type UnknownRecord } from "./guards.ts";
import type { Parsed } from "./expected.ts";
import { parseHfRow, type HfRow } from "./hf-row.ts";
import { isSourceFormat, SOURCE_FORMATS, type SourceFormat } from "./source-format.ts";

export const LANGUAGES = ["ja", "en"] as const;
export type Language = (typeof LANGUAGES)[number];

/** markdown is read as Markdown (<id>.md), text as plain text (<id>.txt), as chaff reads a file by its extension. */
export const FORMATS = ["markdown", "text"] as const;
export type Format = (typeof FORMATS)[number];

export const EXTENSION: Readonly<Record<Format, string>> = { markdown: ".md", text: ".txt" };

/** The largest text the corpus keeps: a size a reviewer can still read through, and that chaff runs on in seconds. */
export const MAX_TEXT_BYTES = 2 * 1024 * 1024;

/** The licence a document is under when nobody has established it yet. validate accepts it but lists it. */
export const UNKNOWN_LICENSE = "unknown";

/** Who wrote the text: people (the default), or a model asked for it, whose text is under this repository's licence. */
export const ORIGINS = ["human", "ai"] as const;
export type Origin = (typeof ORIGINS)[number];

/** The licence of this repository (LICENSE), which a text written for it by a model is under. */
export const REPOSITORY_LICENSE = "MIT";

/** Where a published text came from. */
export type Source = { readonly url: string; readonly fetched: string; readonly format?: SourceFormat; readonly hf?: HfRow };

/** How a text of origin ai was made: the model, the request it answered, and the day. */
export type Generated = { readonly model: string; readonly prompt: string; readonly date: string };

export type Meta = {
  readonly id: string;
  readonly title: string;
  readonly language: Language;
  readonly genre: string;
  readonly format: Format;
  readonly origin: Origin;
  /** format: what source.url serves when it is not the text itself (the text is that, converted). hf: the text is one
   * record of a Hugging Face dataset, fetched from there (source.url is then where a reader sees it). A text of origin
   * ai has no source; it has generated instead. */
  readonly source?: Source;
  readonly generated?: Generated;
  readonly license: { readonly name: string; readonly url?: string; readonly note?: string };
  readonly redistribute: boolean;
  readonly sha256: string;
  readonly notes?: string;
};

/** Where the meta file sits: docs/<language>/<genre>/<id>.yaml. */
export type MetaPlace = { readonly language: string; readonly genre: string; readonly id: string };

const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

export const sha256Of = (text: string): string => createHash("sha256").update(text, "utf8").digest("hex");

const isLanguage = (value: unknown): value is Language => LANGUAGES.some((language) => language === value);
const isFormat = (value: unknown): value is Format => FORMATS.some((format) => format === value);
const isOrigin = (value: unknown): value is Origin => ORIGINS.some((origin) => origin === value);

const identityProblems = (raw: UnknownRecord, place: MetaPlace, genres: ReadonlySet<string>): string[] => [
  ...(raw["id"] === place.id ? [] : [`id must be "${place.id}" (the file name)`]),
  ...(ID_PATTERN.test(place.id) ? [] : ["the id must be lowercase letters, digits and hyphens"]),
  ...(isNonEmptyString(raw["title"]) ? [] : ["title is required"]),
  ...(isLanguage(raw["language"]) ? [] : [`language must be one of ${LANGUAGES.join(", ")}`]),
  ...(raw["language"] === place.language ? [] : [`language must match the folder (docs/${place.language}/)`]),
  ...(typeof raw["genre"] === "string" && genres.has(raw["genre"]) ? [] : [`genre ${String(raw["genre"])} is not a genre chaff knows`]),
  ...(raw["genre"] === place.genre ? [] : [`genre must match the folder (${place.genre})`]),
  ...(raw["format"] === undefined || isFormat(raw["format"]) ? [] : [`format must be one of ${FORMATS.join(", ")}`]),
];

const sourceProblems = (source: unknown): string[] => {
  if (!isRecord(source)) return ["source (url, fetched) is required"];
  return [
    ...(isHttpUrl(source["url"]) ? [] : ["source.url must be an http(s) URL"]),
    ...(typeof source["fetched"] === "string" && DATE_PATTERN.test(source["fetched"]) ? [] : ["source.fetched must be a date (YYYY-MM-DD)"]),
    ...(source["format"] === undefined || isSourceFormat(source["format"]) ? [] : [`source.format must be one of ${SOURCE_FORMATS.join(", ")}`]),
    ...hfProblems(source),
  ];
};

const generatedProblems = (generated: unknown): string[] => {
  if (!isRecord(generated)) return ["generated (model, prompt, date) is required for origin: ai"];
  return [
    ...(isNonEmptyString(generated["model"]) ? [] : ["generated.model (the exact model name) is required"]),
    ...(isNonEmptyString(generated["prompt"]) ? [] : ["generated.prompt (the request the text answers) is required"]),
    ...(typeof generated["date"] === "string" && DATE_PATTERN.test(generated["date"]) ? [] : ["generated.date must be a date (YYYY-MM-DD)"]),
  ];
};

/** A human text has a source; a text of origin ai has generated instead, is under this repository's licence and is committed. */
const originProblems = (raw: UnknownRecord): string[] => {
  const origin = raw["origin"] ?? "human";
  if (!isOrigin(origin)) return [`origin must be one of ${ORIGINS.join(", ")}`];
  if (origin === "human") return [...(raw["generated"] === undefined ? [] : ["generated is only for origin: ai"]), ...sourceProblems(raw["source"])];
  const license = isRecord(raw["license"]) ? raw["license"]["name"] : undefined;
  return [
    ...(raw["source"] === undefined ? [] : ["a document of origin ai has no source (generated says where it came from)"]),
    ...generatedProblems(raw["generated"]),
    ...(license === undefined || license === REPOSITORY_LICENSE ? [] : [`a document of origin ai is under the repository's licence (license.name: ${REPOSITORY_LICENSE})`]),
    ...(raw["redistribute"] === false ? ["a document of origin ai is committed (redistribute: true)"] : []),
  ];
};

const hfProblems = (source: UnknownRecord): string[] => {
  if (source["hf"] === undefined) return [];
  if (source["format"] !== undefined) return ["source.format and source.hf cannot both be set (source.hf.render renders a record)"];
  const parsed = parseHfRow(source["hf"]);
  return "problems" in parsed ? [...parsed.problems] : [];
};

const hfOf = (source: UnknownRecord): { hf?: HfRow } => {
  const parsed = source["hf"] === undefined ? undefined : parseHfRow(source["hf"]);
  return parsed !== undefined && "value" in parsed ? { hf: parsed.value } : {};
};

const licenseProblems = (license: unknown): string[] => {
  if (!isRecord(license) || !isNonEmptyString(license["name"])) return ["license.name is required"];
  if (license["name"] === UNKNOWN_LICENSE) return [];
  return isHttpUrl(license["url"]) ? [] : ["license.url (where the licence is stated) is required"];
};

const textProblems = (raw: UnknownRecord, text: string | undefined): string[] => {
  if (typeof raw["redistribute"] !== "boolean") return ["redistribute must be true or false"];
  if (typeof raw["sha256"] !== "string" || !SHA256_PATTERN.test(raw["sha256"])) return ["sha256 must be 64 lowercase hex digits"];
  if (!raw["redistribute"]) return text === undefined ? [] : ["a document with redistribute: false must not commit its text"];
  if (text === undefined) return ["the text file is missing (redistribute: true)"];
  return sha256Of(text) === raw["sha256"] ? [] : ["sha256 does not match the text"];
};

const sourceOf = (source: UnknownRecord): Source => ({
  url: String(source["url"]),
  fetched: String(source["fetched"]),
  ...(isSourceFormat(source["format"]) ? { format: source["format"] } : {}),
  ...hfOf(source),
});

const generatedOf = (generated: UnknownRecord): Generated => ({ model: String(generated["model"]), prompt: String(generated["prompt"]), date: String(generated["date"]) });

const metaOf = (raw: UnknownRecord): Meta => {
  const license = isRecord(raw["license"]) ? raw["license"] : {};
  const url = optionalString(license["url"]);
  const note = optionalString(license["note"]);
  const notes = optionalString(raw["notes"]);
  return {
    id: String(raw["id"]),
    title: String(raw["title"]),
    language: isLanguage(raw["language"]) ? raw["language"] : "en",
    genre: String(raw["genre"]),
    format: isFormat(raw["format"]) ? raw["format"] : "markdown",
    origin: isOrigin(raw["origin"]) ? raw["origin"] : "human",
    ...(isRecord(raw["source"]) ? { source: sourceOf(raw["source"]) } : {}),
    ...(isRecord(raw["generated"]) ? { generated: generatedOf(raw["generated"]) } : {}),
    license: { name: String(license["name"]), ...(url === undefined ? {} : { url }), ...(note === undefined ? {} : { note }) },
    redistribute: raw["redistribute"] === true,
    sha256: String(raw["sha256"]),
    ...(notes === undefined ? {} : { notes }),
  };
};

/** The meta of the document at `place`, given the committed text (undefined when there is none), or what is wrong with it. */
export const parseMeta = (raw: unknown, place: MetaPlace, genres: ReadonlySet<string>, text: string | undefined): Parsed<Meta> => {
  if (!isRecord(raw)) return { problems: ["the file must be a mapping"] };
  const problems = [...identityProblems(raw, place, genres), ...originProblems(raw), ...licenseProblems(raw["license"]), ...textProblems(raw, text)];
  return problems.length > 0 ? { problems } : { value: metaOf(raw) };
};
