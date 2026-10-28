// Following a chaffjs release: whether npm's latest is newer than the pin, the branch it goes on, and the PR body. Pure.
import { isNonEmptyString, isRecord } from "./guards.ts";

export type Version = readonly [major: number, minor: number, patch: number];

const PLAIN_VERSION = /^(\d+)\.(\d+)\.(\d+)$/;

/** A plain release version (`1.2.3`), or undefined for anything else: a range, a pre-release, a tag. */
export const parseVersion = (text: string): Version | undefined => {
  const match = PLAIN_VERSION.exec(text.trim());
  if (match === null) return undefined;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
};

/** Negative when left is older, positive when newer, zero when equal. */
export const compareVersions = (left: Version, right: Version): number => left[0] - right[0] || left[1] - right[1] || left[2] - right[2];

const parsedLine = (line: string): unknown => {
  try {
    return JSON.parse(line);
  } catch {
    return undefined;
  }
};

/** The version in `yarn info chaffjs version --json` output (its `inspect` line), or "" when there is none. */
export const latestFromYarnInfo = (output: string): string => {
  const inspect = output
    .split("\n")
    .map(parsedLine)
    .find((line) => isRecord(line) && line["type"] === "inspect" && typeof line["data"] === "string");
  return isRecord(inspect) && typeof inspect["data"] === "string" ? inspect["data"] : "";
};

export const RELEASE_BRANCH_PREFIX = "chore/chaffjs-";

export const releaseBranch = (version: string): string => `${RELEASE_BRANCH_PREFIX}${version}`;

export type FollowDecision = { readonly follow: true; readonly version: string; readonly branch: string } | { readonly follow: false; readonly reason: string };

/** Whether to open a bump PR for npm's `latest` against the pinned version (both as written). */
export const followDecision = (pinned: unknown, latest: string): FollowDecision => {
  const latestVersion = parseVersion(latest);
  if (latestVersion === undefined) return { follow: false, reason: `npm's latest chaffjs ${JSON.stringify(latest)} is not a plain version` };
  if (!isNonEmptyString(pinned)) return { follow: false, reason: "package.json does not pin chaffjs" };
  const pinnedVersion = parseVersion(pinned);
  if (pinnedVersion === undefined) return { follow: false, reason: `chaffjs is pinned as ${JSON.stringify(pinned)}, not an exact version` };
  if (compareVersions(latestVersion, pinnedVersion) <= 0) return { follow: false, reason: `chaffjs ${pinned} is pinned; npm's latest is ${latest.trim()}` };
  const version = latestVersion.join(".");
  return { follow: true, version, branch: releaseBranch(version) };
};

export const CHECK_RESULTS = ["pass", "fail"] as const;
export type CheckResult = (typeof CHECK_RESULTS)[number];
export type Check = { readonly name: string; readonly result: CheckResult };

const isCheckResult = (value: string): value is CheckResult => CHECK_RESULTS.some((result) => result === value);

/** `name=pass` or `name=fail`, as the workflow records each check; undefined for anything else. */
export const parseCheck = (text: string): Check | undefined => {
  const [name, result, ...rest] = text.split("=");
  if (!isNonEmptyString(name) || result === undefined || !isCheckResult(result) || rest.length > 0) return undefined;
  return { name, result };
};

const checkRow = (check: Check): string => `| ${check.name} | ${check.result === "pass" ? "pass" : "**fail**"} |`;

/** The bump PR's body: what it does, the checks run in the workflow (a PR opened by it starts no other workflow), and the resolve list. */
export const releasePullRequestBody = (pinned: string, version: string, checks: readonly Check[], resolveSection: string): string =>
  [
    "## Summary",
    "",
    `Bumps the pinned chaffjs from ${pinned} to ${version} (\`yarn add chaffjs@${version} --exact\`) and records what moved with \`yarn run-corpus --resolve\`: false positives that are gone are removed, misses that are now found become correct, new findings are added as unjudged.`,
    "",
    "## Items to Confirm / Review",
    "",
    "- **Regressed** entries in the resolve list are correct findings this release lost: report them in isamu/lab before merging.",
    "- Judge the new `unjudged` entries in the diff of `expected/`.",
    "- This PR was opened with the workflow's token, so `check` did not start on it. The checks below ran in the release-follow job on this exact commit. To get the `check` status on the PR, run `check` from the Actions tab (workflow_dispatch on this branch) or push an empty commit (`git commit --allow-empty -m \"chore: run check\"`).",
    "",
    "### Checks run in the release-follow job",
    "",
    "| check | result |",
    "| :-- | :-- |",
    ...checks.map(checkRow),
    "",
    resolveSection.trimEnd(),
    "",
  ].join("\n");

/** GitHub refuses a pull request body longer than this many characters. */
export const PULL_REQUEST_BODY_LIMIT_CHARACTERS = 65536;

/** Characters as GitHub counts them: code points, so a kanji or an emoji is one. */
export const characterCount = (text: string): number => [...text].length;

const countLine = (heading: string, items: number): string =>
  heading.startsWith("## ") ? `${heading}\n` : `- ${heading.replace(/^#+\s*/, "")}: ${String(items)}`;

const itemCountLines = (resolveSummary: string): string[] => {
  const lines = resolveSummary.split("\n");
  const headingIndexes = lines.flatMap((line, index) => (line.startsWith("#") ? [index] : []));
  return headingIndexes.map((start, position) => {
    const end = headingIndexes[position + 1] ?? lines.length;
    const items = lines.slice(start + 1, end).filter((line) => line.startsWith("- ")).length;
    return countLine(lines[start] ?? "", items);
  });
};

const pointerLines = (runUrl: string | undefined): string[] => {
  const run = runUrl === undefined ? "the release-follow run" : `[the release-follow run](${runUrl})`;
  return [
    "",
    `The full list is too long for a pull request body. It is in the step summary of ${run}, and every change it records is in this PR's diff of \`expected/\`.`,
  ];
};

/**
 * The bump PR's body, fitted under GitHub's limit: unchanged when it fits; otherwise the resolve list becomes the count of
 * each of its sections and a pointer to the run's step summary and to the diff of `expected/`, keeping the summary and the checks.
 */
export const fittedReleasePullRequestBody = (pinned: string, version: string, checks: readonly Check[], resolveSummary: string, runUrl: string | undefined): string => {
  const full = releasePullRequestBody(pinned, version, checks, resolveSummary);
  if (characterCount(full) <= PULL_REQUEST_BODY_LIMIT_CHARACTERS) return full;
  const counted = releasePullRequestBody(pinned, version, checks, [...itemCountLines(resolveSummary), ...pointerLines(runUrl)].join("\n"));
  if (characterCount(counted) <= PULL_REQUEST_BODY_LIMIT_CHARACTERS) return counted;
  return releasePullRequestBody(pinned, version, checks, pointerLines(runUrl).join("\n"));
};
