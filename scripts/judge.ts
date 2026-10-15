// yarn judge <id> [--offline]: prints each entry of expected/<id>.yaml for a judge, with the text of a hashed entry (a
// document that may not be redistributed) recovered from the local copy of the document. Runs no chaff. Prints only:
// it writes no file, except that fetching a document fills the git-ignored .cache/ as the runner does.
import { chaffPackage, knownGenres } from "./lib/chaff.ts";
import { committedText, documentFiles, readExpected, readMeta, type DocumentFiles } from "./lib/corpus.ts";
import { uncommittedText } from "./lib/fetch.ts";
import { judgeReport, parseJudgeArgs, type JudgeSource } from "./lib/judge.ts";

const sourceOf = async (files: DocumentFiles, offline: boolean): Promise<JudgeSource> => {
  const committed = committedText(files);
  if (committed !== undefined) return { text: committed };
  const parsed = readMeta(files, knownGenres(chaffPackage(undefined)));
  if ("problems" in parsed) return { unavailable: `${files.metaPath}: ${parsed.problems.join("; ")}` };
  return uncommittedText(parsed.value, offline);
};

const fail = (message: string): void => {
  console.error(message);
  process.exitCode = 1;
};

const main = async (): Promise<void> => {
  const args = parseJudgeArgs(process.argv.slice(2));
  if ("problem" in args) return fail(args.problem);
  const files = documentFiles().find((file) => file.place.id === args.id);
  if (files === undefined) return fail(`no document ${args.id} under docs/`);
  const expected = readExpected(args.id);
  if (expected === undefined) return fail(`no expected/${args.id}.yaml: run \`yarn run-corpus --update --only ${args.id}\` first`);
  if ("problems" in expected) return fail(`expected/${args.id}.yaml: ${expected.problems.join("; ")}`);
  const source = await sourceOf(files, args.offline);
  console.log(judgeReport(expected.value, source).join("\n"));
  if ("unavailable" in source) process.exitCode = 1;
};

await main();
