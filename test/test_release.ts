import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  characterCount,
  compareVersions,
  fittedReleasePullRequestBody,
  followDecision,
  PULL_REQUEST_BODY_LIMIT_CHARACTERS,
  latestFromYarnInfo,
  parseCheck,
  parseVersion,
  releaseBranch,
  releasePullRequestBody,
} from "../scripts/lib/release.ts";

describe("parseVersion", () => {
  it("reads a plain release version, trimming what npm prints around it", () => {
    assert.deepEqual(parseVersion("0.34.0"), [0, 34, 0]);
    assert.deepEqual(parseVersion(" 1.2.10\n"), [1, 2, 10]);
  });

  it("refuses a range, a pre-release, a tag, a partial or an empty version", () => {
    ["^0.34.0", "0.34.0-beta.1", "latest", "0.34", "", "v0.34.0", "0.34.0.1"].forEach((text) => assert.equal(parseVersion(text), undefined, text));
  });
});

describe("latestFromYarnInfo", () => {
  it("reads the version from yarn's inspect line, past any other line", () => {
    assert.equal(latestFromYarnInfo('{"type":"inspect","data":"0.34.0"}\n'), "0.34.0");
    assert.equal(latestFromYarnInfo('{"type":"warning","data":"x"}\n\u001b[2K{"type":"inspect","data":"0.34.0"}'), "");
    assert.equal(latestFromYarnInfo('{"type":"warning","data":"x"}\n{"type":"inspect","data":"0.34.0"}'), "0.34.0");
  });

  it("gives an empty string when yarn printed nothing usable", () => {
    ["", "0.34.0", '{"type":"error","data":"not found"}', '{"type":"inspect","data":{"latest":"0.34.0"}}', "{"].forEach((output) => assert.equal(latestFromYarnInfo(output), "", output));
  });
});

describe("compareVersions", () => {
  it("compares numerically, field by field", () => {
    assert.ok(compareVersions([0, 34, 0], [0, 33, 9]) > 0);
    assert.ok(compareVersions([0, 10, 0], [0, 9, 0]) > 0);
    assert.ok(compareVersions([1, 0, 0], [0, 99, 99]) > 0);
    assert.ok(compareVersions([0, 33, 0], [0, 33, 1]) < 0);
    assert.equal(compareVersions([0, 33, 0], [0, 33, 0]), 0);
  });
});

describe("releaseBranch", () => {
  it("names the branch after the version", () => {
    assert.equal(releaseBranch("0.34.0"), "chore/chaffjs-0.34.0");
  });
});

describe("followDecision", () => {
  it("follows a newer release, on its branch", () => {
    assert.deepEqual(followDecision("0.33.0", "0.34.0\n"), { follow: true, version: "0.34.0", branch: "chore/chaffjs-0.34.0" });
    assert.deepEqual(followDecision("0.9.0", "0.10.0"), { follow: true, version: "0.10.0", branch: "chore/chaffjs-0.10.0" });
  });

  it("does not follow the same or an older version", () => {
    assert.equal(followDecision("0.34.0", "0.34.0").follow, false);
    assert.equal(followDecision("0.35.0", "0.34.0").follow, false);
  });

  it("does not follow when either side is not an exact version, and says why", () => {
    const cases: readonly [unknown, string, RegExp][] = [
      ["^0.33.0", "0.34.0", /not an exact version/],
      [undefined, "0.34.0", /does not pin/],
      [33, "0.34.0", /does not pin/],
      ["0.33.0", "0.34.0-rc.1", /not a plain version/],
      ["0.33.0", "", /not a plain version/],
    ];
    cases.forEach(([pinned, latest, reason]) => {
      const decision = followDecision(pinned, latest);
      assert.ok(!decision.follow && reason.test(decision.reason), `${String(pinned)} / ${latest}`);
    });
  });

  it("keeps a reason on one line, whatever npm printed", () => {
    const decision = followDecision("0.33.0", "0.34.0\nfollow=true");
    assert.ok(!decision.follow && !decision.reason.includes("\n"));
  });
});

describe("parseCheck", () => {
  it("reads name=pass and name=fail", () => {
    assert.deepEqual(parseCheck("validate=pass"), { name: "validate", result: "pass" });
    assert.deepEqual(parseCheck("corpus=fail"), { name: "corpus", result: "fail" });
  });

  it("refuses anything else", () => {
    ["validate", "validate=ok", "=pass", "a=pass=fail", ""].forEach((text) => assert.equal(parseCheck(text), undefined, text));
  });
});

describe("releasePullRequestBody", () => {
  const body = releasePullRequestBody("0.33.0", "0.34.0", [{ name: "validate", result: "pass" }, { name: "corpus", result: "fail" }], "## What chaffjs 0.34.0 settled\n\nNone.\n");

  it("opens with Summary and Items to Confirm / Review, and names both versions", () => {
    assert.ok(body.startsWith("## Summary\n"));
    assert.match(body, /## Items to Confirm \/ Review/);
    assert.match(body, /from 0\.33\.0 to 0\.34\.0/);
  });

  it("says how to start check on the PR", () => {
    assert.match(body, /workflow_dispatch/);
    assert.match(body, /empty commit/);
  });

  it("shows each check, a failure in bold, and ends with the resolve list", () => {
    assert.match(body, /\| validate \| pass \|/);
    assert.match(body, /\| corpus \| \*\*fail\*\* \|/);
    assert.ok(body.endsWith("## What chaffjs 0.34.0 settled\n\nNone.\n"));
  });
});

describe("characterCount", () => {
  it("counts code points, as GitHub counts a body's characters", () => {
    assert.equal(characterCount("abc"), 3);
    assert.equal(characterCount("条約"), 2);
    assert.equal(characterCount("𠮷😀"), 2);
    assert.equal(characterCount(""), 0);
  });
});

describe("fittedReleasePullRequestBody", () => {
  const checks = [
    { name: "validate", result: "pass" },
    { name: "corpus", result: "fail" },
  ] as const;
  const RUN_URL = "https://github.com/isamu/chaff-corpus/actions/runs/1";
  const resolveSummary = (item: string, items: number): string =>
    [
      "## What chaffjs 0.34.0 settled",
      "",
      "### Resolved (false positives chaff no longer gives, removed)",
      "",
      ...Array.from({ length: items }, (_, index) => `- \`doc:${String(index)}\` rule — ${item}`),
      "",
      "### Found (misses chaff now gives, marked correct)",
      "",
      "None.",
      "",
      "### Regressed (correct findings chaff no longer gives, kept)",
      "",
      "- `doc:7` rule — lost",
      "",
    ].join("\n");

  it("leaves a body that fits unchanged", () => {
    const summary = resolveSummary("short", 3);
    assert.equal(fittedReleasePullRequestBody("0.33.0", "0.34.0", checks, summary, RUN_URL), releasePullRequestBody("0.33.0", "0.34.0", checks, summary));
  });

  it("leaves a body exactly at the limit unchanged", () => {
    const base = releasePullRequestBody("0.33.0", "0.34.0", checks, "");
    const summary = "x".repeat(PULL_REQUEST_BODY_LIMIT_CHARACTERS - characterCount(base));
    const body = fittedReleasePullRequestBody("0.33.0", "0.34.0", checks, summary, RUN_URL);
    assert.equal(characterCount(body), PULL_REQUEST_BODY_LIMIT_CHARACTERS);
    assert.equal(body, releasePullRequestBody("0.33.0", "0.34.0", checks, summary));
  });

  it("cuts a long list to its counts and a pointer, keeping the summary and the checks", () => {
    const summary = resolveSummary("a long finding text", 4000);
    assert.ok(characterCount(releasePullRequestBody("0.33.0", "0.34.0", checks, summary)) > PULL_REQUEST_BODY_LIMIT_CHARACTERS);
    const body = fittedReleasePullRequestBody("0.33.0", "0.34.0", checks, summary, RUN_URL);
    assert.ok(characterCount(body) <= PULL_REQUEST_BODY_LIMIT_CHARACTERS);
    assert.ok(body.startsWith("## Summary\n"));
    assert.match(body, /## Items to Confirm \/ Review/);
    assert.match(body, /\| corpus \| \*\*fail\*\* \|/);
    assert.match(body, /## What chaffjs 0\.34\.0 settled/);
    assert.match(body, /- Resolved \(false positives chaff no longer gives, removed\): 4000\n/);
    assert.match(body, /- Found \(misses chaff now gives, marked correct\): 0\n/);
    assert.match(body, /- Regressed \(correct findings chaff no longer gives, kept\): 1\n/);
    assert.ok(body.includes(`step summary of [the release-follow run](${RUN_URL})`));
    assert.match(body, /diff of `expected\/`/);
    assert.ok(!body.includes("a long finding text"));
  });

  it("counts multi-byte text by characters, not bytes or UTF-16 units", () => {
    const base = releasePullRequestBody("0.33.0", "0.34.0", checks, "");
    const room = PULL_REQUEST_BODY_LIMIT_CHARACTERS - characterCount(base);
    const fitsAsCharacters = "😀".repeat(room);
    assert.ok(fitsAsCharacters.length > PULL_REQUEST_BODY_LIMIT_CHARACTERS - base.length);
    assert.ok(fittedReleasePullRequestBody("0.33.0", "0.34.0", checks, fitsAsCharacters, RUN_URL).includes(fitsAsCharacters));
    const overByOne = "条".repeat(room + 1);
    assert.ok(!fittedReleasePullRequestBody("0.33.0", "0.34.0", checks, overByOne, RUN_URL).includes(overByOne));
  });

  it("points at the run without a link when the run is unknown", () => {
    const body = fittedReleasePullRequestBody("0.33.0", "0.34.0", checks, resolveSummary("a long finding text", 4000), undefined);
    assert.match(body, /step summary of the release-follow run,/);
  });

  it("still fits when even the section counts are too long", () => {
    const headings = Array.from({ length: 5000 }, (_, index) => `### section ${String(index)} with a long heading`).join("\n");
    const body = fittedReleasePullRequestBody("0.33.0", "0.34.0", checks, headings, RUN_URL);
    assert.ok(characterCount(body) <= PULL_REQUEST_BODY_LIMIT_CHARACTERS);
    assert.match(body, /\| validate \| pass \|/);
    assert.ok(body.includes(RUN_URL));
  });
});
