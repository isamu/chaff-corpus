// The release-follow workflow's decisions, so the workflow file holds no logic of its own.
//   decide <yarn-info-json>                  given `yarn info chaffjs version --json`, prints follow=, version=, branch=, pinned= and reason= lines for $GITHUB_OUTPUT
//   body <pinned> <version> <summary> <name=pass|fail>...   prints the bump PR's body (summary: the --resolve-out file)
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/corpus.ts";
import { isRecord } from "./lib/guards.ts";
import { followDecision, latestFromYarnInfo, parseCheck, releasePullRequestBody, type Check } from "./lib/release.ts";

const pinnedChaff = (): unknown => {
  const path = join(ROOT, "package.json");
  try {
    const manifest: unknown = JSON.parse(readFileSync(path, "utf8"));
    const dependencies = isRecord(manifest) ? manifest["dependencies"] : undefined;
    return isRecord(dependencies) ? dependencies["chaffjs"] : undefined;
  } catch (error) {
    throw new Error(`cannot read ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const decide = (yarnInfo: string): void => {
  const pinned = pinnedChaff();
  const decision = followDecision(pinned, latestFromYarnInfo(yarnInfo));
  const lines = decision.follow
    ? [`follow=true`, `version=${decision.version}`, `branch=${decision.branch}`, `pinned=${String(pinned)}`]
    : [`follow=false`, `reason=${decision.reason}`];
  console.log(lines.join("\n"));
};

const checksOf = (texts: readonly string[]): Check[] =>
  texts.map((text) => {
    const check = parseCheck(text);
    if (check === undefined) throw new Error(`a check must be name=pass or name=fail, got "${text}"`);
    return check;
  });

const body = (pinned: string, version: string, summaryPath: string, checkTexts: readonly string[]): void => {
  const summary = readFileSync(summaryPath, "utf8");
  console.log(releasePullRequestBody(pinned, version, checksOf(checkTexts), summary));
};

const [command, ...args] = process.argv.slice(2);
if (command === "decide" && args[0] !== undefined) decide(args[0]);
else if (command === "body" && args[0] !== undefined && args[1] !== undefined && args[2] !== undefined) body(args[0], args[1], args[2], args.slice(3));
else {
  console.error("usage: follow-release.ts decide <yarn-info-json> | body <pinned> <version> <summary-file> <name=pass|fail>...");
  process.exitCode = 2;
}
