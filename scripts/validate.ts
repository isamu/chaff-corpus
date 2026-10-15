// Checks what the repository holds: each document's meta (licence, genre chaff knows, language, sha256 of the text),
// no email address or phone number in a committed text unless allowlist.yaml names it with a reason, the size cap,
// and expected files that belong to a document and, for one that may not be redistributed, quote none of its text.
// Exits 1 on any problem.
import { existsSync, statSync } from "node:fs";
import { relative } from "node:path";
import { parseArgs } from "node:util";
import { chaffPackage, knownGenres } from "./lib/chaff.ts";
import { ALLOWLIST, committedText, documentFiles, expectedIds, readExpected, readMeta, readYaml, ROOT, strayFiles, type DocumentFiles } from "./lib/corpus.ts";
import { quotingProblems } from "./lib/expected.ts";
import { MAX_TEXT_BYTES, UNKNOWN_LICENSE } from "./lib/meta.ts";
import { parseAllowList, personalDataHits, unallowedHits, type Allowed } from "./lib/scan.ts";

const { values: options } = parseArgs({ options: { chaff: { type: "string" } } });

const shown = (path: string): string => relative(ROOT, path);

const allowList = (): { allowed: readonly Allowed[]; problems: string[] } => {
  if (!existsSync(ALLOWLIST)) return { allowed: [], problems: [] };
  const parsed = parseAllowList(readYaml(ALLOWLIST));
  return "value" in parsed ? { allowed: parsed.value, problems: [] } : { allowed: [], problems: parsed.problems.map((problem) => `allowlist.yaml: ${problem}`) };
};

const sizeProblems = (files: DocumentFiles): string[] =>
  files.textPaths.filter((path) => statSync(path).size > MAX_TEXT_BYTES).map((path) => `${shown(path)}: larger than ${String(MAX_TEXT_BYTES)} bytes`);

const personalDataProblems = (files: DocumentFiles, allowed: readonly Allowed[]): string[] => {
  const text = committedText(files);
  if (text === undefined) return [];
  return unallowedHits(files.place.id, personalDataHits(text), allowed).map(
    (hit) => `${shown(files.textPaths[0] ?? files.metaPath)}:${String(hit.line)}: ${hit.kind} "${hit.match}" (remove it, or add it to allowlist.yaml with a reason)`,
  );
};

/** One document checked: its problems, notes, and whether its meta says it may not be redistributed. */
type Checked = { readonly id: string; readonly problems: string[]; readonly notes: string[]; readonly sealed: boolean };

const documentProblems = (files: DocumentFiles, genres: ReadonlySet<string>, allowed: readonly Allowed[]): Checked => {
  const id = files.place.id;
  const tooLarge = sizeProblems(files);
  if (tooLarge.length > 0) return { id, problems: tooLarge, notes: [], sealed: false };
  const meta = readMeta(files, genres);
  if ("problems" in meta) return { id, problems: meta.problems.map((problem) => `${shown(files.metaPath)}: ${problem}`), notes: [], sealed: false };
  const notes = meta.value.license.name === UNKNOWN_LICENSE ? [`${shown(files.metaPath)}: license is unknown, to be established`] : [];
  return { id, problems: personalDataProblems(files, allowed), notes, sealed: !meta.value.redistribute };
};

const duplicateIds = (documents: readonly DocumentFiles[]): string[] => {
  const ids = documents.map((files) => files.place.id);
  return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))].map((id) => `id ${id} is used by more than one document`);
};

const expectedProblems = (documents: readonly DocumentFiles[], sealed: ReadonlySet<string>): string[] => {
  const ids = new Set(documents.map((files) => files.place.id));
  return expectedIds().flatMap((id) => {
    if (!ids.has(id)) return [`expected/${id}.yaml: no document ${id} under docs/`];
    const read = readExpected(id);
    if (read === undefined) return [];
    const problems = "value" in read ? (sealed.has(id) ? quotingProblems(read.value) : []) : read.problems;
    return problems.map((problem) => `expected/${id}.yaml: ${problem}`);
  });
};

const staleAllowed = (documents: readonly DocumentFiles[], allowed: readonly Allowed[]): string[] =>
  allowed
    .filter((entry) => {
      const files = documents.find((document) => document.place.id === entry.id);
      const text = files === undefined ? undefined : committedText(files);
      return text === undefined || !personalDataHits(text).some((hit) => hit.match === entry.match);
    })
    .map((entry) => `allowlist.yaml: ${entry.id} / ${entry.match} matches nothing (remove the entry)`);

const main = (): void => {
  const genres = knownGenres(chaffPackage(options.chaff));
  const documents = documentFiles();
  const { allowed, problems: listProblems } = allowList();
  const checked = documents.map((files) => documentProblems(files, genres, allowed));
  const problems = [
    ...listProblems,
    ...checked.flatMap((result) => result.problems),
    ...duplicateIds(documents),
    ...strayFiles(documents).map((path) => `${shown(path)}: not a document's .yaml, .md or .txt`),
    ...expectedProblems(documents, new Set(checked.filter((result) => result.sealed).map((result) => result.id))),
    ...staleAllowed(documents, allowed),
  ];
  checked.flatMap((result) => result.notes).forEach((note) => console.log(`note: ${note}`));
  problems.forEach((problem) => console.error(`error: ${problem}`));
  console.log(`${String(documents.length)} documents, ${String(problems.length)} problems`);
  if (problems.length > 0) process.exitCode = 1;
};

main();
