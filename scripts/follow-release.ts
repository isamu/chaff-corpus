// The release-follow workflow's decisions, so the workflow file holds no logic of its own.
//   decide <yarn-info-json>                  given `yarn info chaffjs version --json`, prints follow=, version=, branch=, pinned= and reason= lines for $GITHUB_OUTPUT
//   body <pinned> <version> <summary> <name=pass|fail>...      prints the bump PR's full body (summary: the --resolve-out file)
//   pr-body <pinned> <version> <summary> <name=pass|fail>...   the same, fitted under GitHub's body limit; the run is read from GITHUB_SERVER_URL, GITHUB_REPOSITORY and GITHUB_RUN_ID
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/corpus.ts";
import { isRecord } from "./lib/guards.ts";
import { fittedReleasePullRequestBody, followDecision, latestFromYarnInfo, parseCheck, releasePullRequestBody, type Check } from "./lib/release.ts";

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

const runUrl = (): string | undefined => {
  const { GITHUB_SERVER_URL: server, GITHUB_REPOSITORY: repository, GITHUB_RUN_ID: runId } = process.env;
  if (server === undefined || repository === undefined || runId === undefined) return undefined;
  return `${server}/${repository}/actions/runs/${runId}`;
};

const body = (fitted: boolean, [pinned, version, summaryPath, ...checkTexts]: readonly string[]): void => {
  if (pinned === undefined || version === undefined || summaryPath === undefined) throw new Error("body needs <pinned> <version> <summary-file>");
  const summary = readFileSync(summaryPath, "utf8");
  const checks = checksOf(checkTexts);
  console.log(fitted ? fittedReleasePullRequestBody(pinned, version, checks, summary, runUrl()) : releasePullRequestBody(pinned, version, checks, summary));
};

const [command, ...args] = process.argv.slice(2);
if (command === "decide" && args[0] !== undefined) decide(args[0]);
else if ((command === "body" || command === "pr-body") && args.length >= 3) body(command === "pr-body", args);
else {
  console.error("usage: follow-release.ts decide <yarn-info-json> | body|pr-body <pinned> <version> <summary-file> <name=pass|fail>...");
  process.exitCode = 2;
}
