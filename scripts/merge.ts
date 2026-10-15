// Joins the JSON results of a sharded run (run.ts --shard i/n --json <path>) into one report and one exit decision.
//   node scripts/merge.ts --shards <n> [--against <label>] <shard.json>...
//   --shards <n>        how many shards the run had; fewer files than that is a problem
//   --against <label>   the run used an unreleased chaff (lab's main): report what it fixes and breaks, and never fail
import { appendFileSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { renderAgainstReport } from "./lib/against-report.ts";
import { renderReport } from "./lib/report.ts";
import { mergeShards, type ShardFile } from "./lib/shard-result.ts";
import { failuresOf } from "./lib/tally.ts";

const { values: options, positionals: paths } = parseArgs({
  options: { shards: { type: "string" }, against: { type: "string" } },
  allowPositionals: true,
});

const readShardFile = (path: string): ShardFile => {
  try {
    const content: unknown = JSON.parse(readFileSync(path, "utf8"));
    return { path, content };
  } catch (error) {
    return { path, unreadable: error instanceof Error ? error.message : String(error) };
  }
};

const report = (markdown: string): void => {
  console.log(markdown);
  const summary = process.env["GITHUB_STEP_SUMMARY"];
  if (summary !== undefined && summary !== "") appendFileSync(summary, `${markdown}\n`);
};

const expectedShards = Number(options.shards ?? paths.length);
if (!Number.isInteger(expectedShards) || expectedShards < 1) throw new Error(`--shards ${String(options.shards)}: expected a positive integer`);
const { results, ...context } = mergeShards(paths.map(readShardFile), expectedShards);
if (options.against === undefined) {
  report(renderReport(results, context));
  if (context.problems.length > 0 || failuresOf(results).length > 0) process.exitCode = 1;
} else {
  report(renderAgainstReport(options.against, results, context));
}
