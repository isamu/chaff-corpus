// Runs chaff over every document and compares its findings with expected/. Fails only when a correct finding is lost,
// a fully judged document gets a new finding, a document's meta is invalid, or chaff cannot run.
//   --update          write new findings into expected/ as unjudged (verdicts are never touched)
//   --chaff <path>    run a local chaffjs (a lab checkout after `yarn build`, or the package folder) instead of the pinned one
//   --only <id,...>   run these documents only
//   --jobs <n>        how many documents run at once
//   --offline         use .cache/ only for the documents that may not be redistributed
import { appendFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { availableParallelism, tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { chaffPackage, knownGenres, prepareWorkDir, runChaff, type ChaffPackage } from "./lib/chaff.ts";
import { committedText, documentFiles, EXPECTED, expectedPath, readExpected, readMeta, type DocumentFiles } from "./lib/corpus.ts";
import { isFullyJudged, type Expected } from "./lib/expected.ts";
import { expectedYaml } from "./lib/expected-write.ts";
import { uncommittedText, type Available } from "./lib/fetch.ts";
import type { Finding } from "./lib/finding.ts";
import { matchDocument } from "./lib/match.ts";
import { LANGUAGES, type Meta } from "./lib/meta.ts";
import { renderReport, type RunContext } from "./lib/report.ts";
import { failuresOf, type DocumentResult } from "./lib/tally.ts";
import { updatedExpected } from "./lib/update.ts";

const { values: options } = parseArgs({
  options: {
    update: { type: "boolean", default: false },
    chaff: { type: "string" },
    only: { type: "string" },
    jobs: { type: "string" },
    offline: { type: "boolean", default: false },
  },
});

/** One document ready to run, or why it is not. */
type Prepared = { readonly meta: Meta; readonly text: string } | { readonly id: string; readonly notRun: string } | { readonly problem: string };

/** One document run: its findings, or why chaff could not give them. */
type Ran = { readonly meta: Meta; readonly findings: readonly Finding[] } | { readonly problem: string };

const DEFAULT_JOBS = Math.max(1, Math.floor(availableParallelism() / 2));
const jobs = Math.max(1, Number(options.jobs ?? DEFAULT_JOBS) || DEFAULT_JOBS);
const only = options.only === undefined ? undefined : new Set(options.only.split(","));

const textOf = async (files: DocumentFiles, meta: Meta): Promise<Available> => {
  const committed = committedText(files);
  return committed === undefined ? uncommittedText(meta, options.offline) : { text: committed };
};

const prepare = async (files: DocumentFiles, genres: ReadonlySet<string>): Promise<Prepared> => {
  const parsed = readMeta(files, genres);
  if ("problems" in parsed) return { problem: `${files.metaPath}: ${parsed.problems.join("; ")}` };
  const available = await textOf(files, parsed.value);
  return "text" in available ? { meta: parsed.value, text: available.text } : { id: parsed.value.id, notRun: available.unavailable };
};

/** Runs `task` over `items`, `limit` at a time, keeping the items' order. */
const pooled = async <T, R>(items: readonly T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> => {
  const results: R[] = [];
  const next = { index: 0 };
  const worker = async (): Promise<void> => {
    const index = next.index++;
    const item = items[index];
    if (item === undefined) return;
    results[index] = await task(item);
    return worker();
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
};

const runOne = async (chaff: ChaffPackage, workDir: string, prepared: { meta: Meta; text: string }): Promise<Ran> => {
  try {
    return { meta: prepared.meta, findings: await runChaff(chaff, workDir, prepared.meta, prepared.text) };
  } catch (error) {
    return { problem: error instanceof Error ? error.message : String(error) };
  }
};

const expectedOf = (id: string, problems: string[]): Expected | undefined => {
  const read = readExpected(id);
  if (read === undefined) return undefined;
  if ("problems" in read) {
    problems.push(`expected/${id}.yaml: ${read.problems.join("; ")}`);
    return undefined;
  }
  return read.value;
};

const resultOf = (meta: Meta, findings: readonly Finding[], expected: Expected | undefined): DocumentResult => ({
  id: meta.id,
  genre: meta.genre,
  language: meta.language,
  fullyJudged: isFullyJudged(expected),
  outcomes: matchDocument(expected?.findings ?? [], findings),
});

const writeUpdate = (meta: Meta, findings: readonly Finding[], expected: Expected | undefined, chaffVersion: string): void => {
  mkdirSync(EXPECTED, { recursive: true });
  writeFileSync(expectedPath(meta.id), expectedYaml(updatedExpected(expected, meta.id, chaffVersion, findings)));
};

const main = async (): Promise<void> => {
  const chaff = chaffPackage(options.chaff);
  const genres = knownGenres(chaff);
  const files = documentFiles().filter((file) => only === undefined || only.has(file.place.id));
  const prepared = await pooled(files, jobs, (file) => prepare(file, genres));
  const workDir = mkdtempSync(join(tmpdir(), "chaff-corpus-"));
  prepareWorkDir(workDir, LANGUAGES);
  const runnable = prepared.flatMap((item) => ("meta" in item ? [item] : []));
  const ran = await pooled(runnable, jobs, (item) => runOne(chaff, workDir, item));
  rmSync(workDir, { recursive: true, force: true });
  const problems = [...prepared.flatMap((item) => ("problem" in item ? [item.problem] : [])), ...ran.flatMap((item) => ("problem" in item ? [item.problem] : []))];
  const results = ran.flatMap((item) => {
    if (!("meta" in item)) return [];
    const expected = expectedOf(item.meta.id, problems);
    if (options.update) writeUpdate(item.meta, item.findings, expected, chaff.version);
    return [resultOf(item.meta, item.findings, expected)];
  });
  const context: RunContext = { chaffVersion: chaff.version, notRun: prepared.flatMap((item) => ("notRun" in item ? [{ id: item.id, reason: item.notRun }] : [])), problems };
  report(renderReport(results, context));
  if (problems.length > 0 || (!options.update && failuresOf(results).length > 0)) process.exitCode = 1;
};

const report = (markdown: string): void => {
  console.log(markdown);
  const summary = process.env["GITHUB_STEP_SUMMARY"];
  if (summary !== undefined && summary !== "") appendFileSync(summary, `${markdown}\n`);
};

await main();
