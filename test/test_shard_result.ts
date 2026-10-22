import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderAgainstReport } from "../scripts/lib/against-report.ts";
import type { Outcome, OutcomeKind } from "../scripts/lib/match.ts";
import { mergeShards, parseShardResult, shardJson, type ShardResult } from "../scripts/lib/shard-result.ts";
import type { DocumentResult } from "../scripts/lib/tally.ts";

const outcome = (kind: OutcomeKind, rule: string, line = 1): Outcome => ({ kind, rule, line, text: "t" });

const doc = (id: string, fullyJudged: boolean, outcomes: readonly Outcome[]): DocumentResult => ({ id, genre: "business/report", language: "en", origin: "human", fullyJudged, outcomes });

const shardA: ShardResult = {
  chaffVersion: "0.34.0",
  results: [doc("b", false, [outcome("correct-kept", "a"), outcome("false-positive-gone", "b", 2)])],
  notRun: [{ id: "z", reason: "offline" }],
  problems: [],
};

const shardB: ShardResult = {
  chaffVersion: "0.34.0",
  results: [doc("a", true, [outcome("new", "c", 3)]), doc("c", false, [outcome("correct-lost", "a", 4), outcome("missed-found", "d", 5)])],
  notRun: [],
  problems: ["docs/x.yaml: bad"],
};

const roundTrip = (shard: ShardResult): unknown => JSON.parse(shardJson(shard));

describe("shard results as JSON", () => {
  it("reads back what it wrote, without a finding's details", () => {
    const withFinding: ShardResult = {
      ...shardA,
      results: [doc("b", false, [{ ...outcome("new", "a"), finding: { rule: "a", line: 1, column: 1, text: "t", message: "m" } }])],
    };
    assert.deepEqual(parseShardResult(roundTrip(shardA)), shardA);
    assert.deepEqual(parseShardResult(roundTrip(withFinding)), { ...withFinding, results: [doc("b", false, [outcome("new", "a")])] });
  });

  it("keeps a document's origin, and reads a result without one as human", () => {
    const aiShard: ShardResult = { ...shardA, results: [{ ...doc("b", false, []), origin: "ai" }] };
    assert.deepEqual(parseShardResult(roundTrip(aiShard)), aiShard);
    const { origin: _origin, ...withoutOrigin } = doc("b", false, []);
    assert.deepEqual(parseShardResult({ ...shardA, results: [withoutOrigin] })?.results, [doc("b", false, [])]);
  });

  it("rejects what is not a shard result", () => {
    const valid = roundTrip(shardB);
    assert.ok(typeof valid === "object" && valid !== null);
    [
      undefined,
      null,
      [],
      "text",
      {},
      { ...valid, chaffVersion: "" },
      { ...valid, results: "x" },
      { ...valid, notRun: [{ id: "z" }] },
      { ...valid, problems: [1] },
      { ...valid, results: [{ ...shardB.results[0], fullyJudged: "yes" }] },
      { ...valid, results: [{ ...shardB.results[0], origin: "" }] },
      { ...valid, results: [{ ...shardB.results[0], origin: "robot" }] },
      { ...valid, results: [{ ...shardB.results[0], origin: null }] },
      { ...valid, results: [{ ...shardB.results[0], outcomes: [{ kind: "lost", rule: "a", line: 1, text: "t" }] }] },
      { ...valid, results: [{ ...shardB.results[0], outcomes: [{ kind: "new", rule: "a", line: 0, text: "t" }] }] },
    ].forEach((value, index) => assert.equal(parseShardResult(value), undefined, String(index)));
  });
});

describe("mergeShards", () => {
  it("joins the shards, sorted by document", () => {
    const merged = mergeShards(
      [
        { path: "1.json", content: roundTrip(shardA) },
        { path: "2.json", content: roundTrip(shardB) },
      ],
      2,
    );
    assert.equal(merged.chaffVersion, "0.34.0");
    assert.deepEqual(
      merged.results.map((result) => result.id),
      ["a", "b", "c"],
    );
    assert.deepEqual(merged.notRun, shardA.notRun);
    assert.deepEqual(merged.problems, ["docs/x.yaml: bad"]);
  });

  it("makes a missing, unreadable or malformed shard a problem", () => {
    const merged = mergeShards(
      [
        { path: "1.json", content: roundTrip(shardA) },
        { path: "2.json", unreadable: "Unexpected end of JSON input" },
        { path: "3.json", content: { chaffVersion: "0.34.0" } },
      ],
      4,
    );
    assert.deepEqual(merged.problems, ["1 of 4 shards gave no result", "2.json: Unexpected end of JSON input", "3.json: not a shard result"]);
    assert.deepEqual(
      merged.results.map((result) => result.id),
      ["b"],
    );
  });

  it("has a problem and no version when nothing came", () => {
    const merged = mergeShards([], 3);
    assert.equal(merged.chaffVersion, "unknown");
    assert.deepEqual(merged.problems, ["3 of 3 shards gave no result"]);
  });
});

describe("renderAgainstReport", () => {
  const merged = mergeShards(
    [
      { path: "1.json", content: roundTrip(shardA) },
      { path: "2.json", content: roundTrip(shardB) },
    ],
    2,
  );
  const markdown = renderAgainstReport("lab main abc1234", merged.results, merged);

  it("counts what main fixes and what it breaks", () => {
    assert.match(markdown, /^# chaff-corpus against lab main abc1234: chaffjs 0\.34\.0, 3 documents/);
    assert.match(markdown, /\| fixed, not yet released: false positive gone \| 1 \|/);
    assert.match(markdown, /\| fixed, not yet released: missed found \| 1 \|/);
    assert.match(markdown, /\| regression: correct lost \| 1 \|/);
    assert.match(markdown, /\| regression: new on a fully judged document \| 1 \|/);
    assert.match(markdown, /\| could not run or problem \| 2 \|/);
  });

  it("lists each case under its heading, and folds the full report", () => {
    assert.match(markdown, /## Fixed on lab main abc1234, not yet released\n\n- false-positive-gone: `b:2` b — t\n- missed-found: `c:5` d — t/);
    assert.match(markdown, /## Regressions on lab main abc1234\n\n- new: `a:3` c — t\n- correct-lost: `c:4` a — t/);
    assert.match(markdown, /<details><summary>Full report<\/summary>\n\n# chaff-corpus: chaffjs 0\.34\.0, 3 documents/);
  });

  it("leaves out the lists when there is nothing in them", () => {
    const quiet = renderAgainstReport("lab main", [doc("a", false, [outcome("correct-kept", "a")])], { chaffVersion: "0.35.0", notRun: [], problems: [] });
    assert.doesNotMatch(quiet, /## Fixed on|## Regressions on/);
    assert.match(quiet, /\| regression: correct lost \| 0 \|/);
  });
});
