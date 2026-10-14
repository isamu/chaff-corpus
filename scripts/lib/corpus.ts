// Reading the repository: the documents under docs/, their texts and their expected files.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { parseExpected, type Expected, type Parsed } from "./expected.ts";
import { EXTENSION, FORMATS, parseMeta, type Meta, type MetaPlace } from "./meta.ts";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DOCS = join(ROOT, "docs");
export const EXPECTED = join(ROOT, "expected");
export const CACHE = join(ROOT, ".cache");
export const ALLOWLIST = join(ROOT, "allowlist.yaml");

/** One document's files: its meta, and its committed text when there is one. */
export type DocumentFiles = { readonly metaPath: string; readonly place: MetaPlace; readonly textPaths: readonly string[] };

const walk = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? walk(path) : [path];
      })
    : [];

const placeOf = (metaPath: string): MetaPlace => {
  const parts = relative(DOCS, metaPath).split(sep);
  const file = parts.at(-1) ?? "";
  return { language: parts[0] ?? "", genre: parts.slice(1, -1).join("/"), id: file.replace(/\.yaml$/, "") };
};

const textPathsOf = (metaPath: string): string[] =>
  FORMATS.map((format) => metaPath.replace(/\.yaml$/, EXTENSION[format])).filter((path) => existsSync(path));

/** Every document under docs/, by its .yaml, sorted by path. */
export const documentFiles = (): DocumentFiles[] =>
  walk(DOCS)
    .filter((path) => path.endsWith(".yaml"))
    .toSorted()
    .map((metaPath) => ({ metaPath, place: placeOf(metaPath), textPaths: textPathsOf(metaPath) }));

/** Files under docs/ that are neither a meta file nor the text beside one. */
export const strayFiles = (documents: readonly DocumentFiles[]): string[] => {
  const known = new Set(documents.flatMap((document) => [document.metaPath, ...document.textPaths]));
  return walk(DOCS).filter((path) => !known.has(path) && !path.endsWith(".gitkeep"));
};

export const readYaml = (path: string): unknown => parse(readFileSync(path, "utf8"));

/** The committed text of a document: its one text file, or undefined when there is none. */
export const committedText = (files: DocumentFiles): string | undefined => {
  const [path] = files.textPaths;
  return path === undefined ? undefined : readFileSync(path, "utf8");
};

/** The meta of a document, read and checked against its folder, the genres chaff knows and its committed text. */
export const readMeta = (files: DocumentFiles, genres: ReadonlySet<string>): Parsed<Meta> => {
  if (files.textPaths.length > 1) return { problems: ["more than one text file (keep one of .md and .txt)"] };
  try {
    return parseMeta(readYaml(files.metaPath), files.place, genres, committedText(files));
  } catch (error) {
    return { problems: [`cannot read: ${error instanceof Error ? error.message : String(error)}`] };
  }
};

export const expectedPath = (id: string): string => join(EXPECTED, `${id}.yaml`);

/** expected/<id>.yaml, undefined when the document has none yet. */
export const readExpected = (id: string): Parsed<Expected> | undefined => {
  const path = expectedPath(id);
  if (!existsSync(path)) return undefined;
  try {
    return parseExpected(readYaml(path), id);
  } catch (error) {
    return { problems: [`cannot read ${path}: ${error instanceof Error ? error.message : String(error)}`] };
  }
};

/** The ids that have an expected file. */
export const expectedIds = (): string[] =>
  existsSync(EXPECTED)
    ? readdirSync(EXPECTED)
        .filter((name) => name.endsWith(".yaml"))
        .map((name) => name.replace(/\.yaml$/, ""))
    : [];
