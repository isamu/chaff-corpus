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
export const releasePullRequestBody = (pinned: string, version: string, checks: readonly Check[], resolveSummary: string): string =>
  [
    "## Summary",
    "",
    `Bumps the pinned chaffjs from ${pinned} to ${version} (\`yarn add chaffjs@${version} --exact\`) and records what moved with \`yarn run-corpus --resolve\`: false positives that are gone are removed, misses that are now found become correct, new findings are added as unjudged.`,
    "",
    "## Items to Confirm / Review",
    "",
    "- **Regressed** entries below are correct findings this release lost: report them in isamu/lab before merging.",
    "- Judge the new `unjudged` entries in the diff of `expected/`.",
    "- This PR was opened with the workflow's token, so `check` did not start on it. The checks below ran in the release-follow job on this exact commit. To get the `check` status on the PR, run `check` from the Actions tab (workflow_dispatch on this branch) or push an empty commit (`git commit --allow-empty -m \"chore: run check\"`).",
    "",
    "### Checks run in the release-follow job",
    "",
    "| check | result |",
    "| :-- | :-- |",
    ...checks.map(checkRow),
    "",
    resolveSummary.trimEnd(),
    "",
  ].join("\n");
