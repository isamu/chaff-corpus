// Running chaff on one document, as a user would: the command line, with the document's genre and language.
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { parse } from "yaml";
import { ROOT } from "./corpus.ts";
import { findingsFromSarif, type Finding } from "./finding.ts";
import { isNonEmptyString, isRecord } from "./guards.ts";
import { EXTENSION, type Meta } from "./meta.ts";

const run = promisify(execFile);

const CHAFF_TIMEOUT_MS = 10 * 60 * 1000;
const OUTPUT_LIMIT_BYTES = 64 * 1024 * 1024;

/** The chaffjs package a run uses: its folder and version. */
export type ChaffPackage = { readonly dir: string; readonly version: string; readonly bin: string };

/** A lab checkout (text/ or the repository root) or a chaffjs package folder, resolved to the package folder. */
const packageDirOf = (given: string): string => {
  const candidates = [given, join(given, "packages", "chaff"), join(given, "text", "packages", "chaff")].map((path) => resolve(path));
  const found = candidates.find((dir) => existsSync(join(dir, "bin", "chaff.js")) && existsSync(join(dir, "genres.yaml")));
  if (found === undefined) throw new Error(`no chaffjs package (bin/chaff.js and genres.yaml) under ${given}`);
  return found;
};

/** The pinned chaffjs from node_modules, or the package at `given` (a lab checkout built with `yarn build`). */
export const chaffPackage = (given: string | undefined): ChaffPackage => {
  const dir = given === undefined ? join(ROOT, "node_modules", "chaffjs") : packageDirOf(given);
  const manifest: unknown = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const version = isRecord(manifest) && isNonEmptyString(manifest["version"]) ? manifest["version"] : "unknown";
  return { dir, version, bin: join(dir, "bin", "chaff.js") };
};

/** The genre ids chaff knows, from its genres.yaml. */
export const knownGenres = (chaff: ChaffPackage): Set<string> => {
  const file: unknown = parse(readFileSync(join(chaff.dir, "genres.yaml"), "utf8"));
  const genres = isRecord(file) && Array.isArray(file["genres"]) ? file["genres"] : [];
  return new Set(genres.flatMap((genre: unknown) => (isRecord(genre) && isNonEmptyString(genre["id"]) ? [genre["id"]] : [])));
};

/** A folder per language whose chaff.yaml says only the language, so chaff reads each document in the language its meta names. */
export const prepareWorkDir = (workDir: string, languages: readonly string[]): void =>
  languages.forEach((language) => {
    const dir = join(workDir, language);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "chaff.yaml"), `language: ${language}\n`);
  });

/** chaff's findings on one document, every rule of its genre on, experimental ones included. workDir is prepareWorkDir's. */
export const runChaff = async (chaff: ChaffPackage, workDir: string, meta: Meta, text: string): Promise<Finding[]> => {
  const dir = join(workDir, meta.language);
  const file = `${meta.id}${EXTENSION[meta.format]}`;
  const sarifPath = join(dir, `${meta.id}.sarif`);
  writeFileSync(join(dir, file), text);
  const args = [chaff.bin, "--genre", meta.genre, "--experimental", "--no-guide", "--sarif", sarifPath, file];
  try {
    await run(process.execPath, args, { cwd: dir, timeout: CHAFF_TIMEOUT_MS, maxBuffer: OUTPUT_LIMIT_BYTES, env: { ...process.env, NO_COLOR: "1" } });
  } catch (error) {
    if (!existsSync(sarifPath)) throw new Error(`chaff failed on ${meta.id}: ${error instanceof Error ? error.message : String(error)}`);
  }
  return findingsFromSarif(JSON.parse(readFileSync(sarifPath, "utf8")), text);
};
