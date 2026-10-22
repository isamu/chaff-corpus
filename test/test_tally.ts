import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Outcome, OutcomeKind } from "../scripts/lib/match.ts";
import { renderReport } from "../scripts/lib/report.ts";
import { failuresOf, otherOrigins, precisionOf, tallyByGenre, tallyByOrigin, tallyByRule, total, type DocumentResult } from "../scripts/lib/tally.ts";

const outcome = (kind: OutcomeKind, rule: string): Outcome => ({ kind, rule, line: 1, text: "t" });

const doc = (id: string, genre: string, fullyJudged: boolean, outcomes: readonly Outcome[]): DocumentResult => ({ id, genre, language: "en", origin: "human", fullyJudged, outcomes });

const results: DocumentResult[] = [
  doc("one", "business/report", false, [outcome("correct-kept", "a"), outcome("false-positive-present", "a"), outcome("new", "b")]),
  doc("two", "legal/statute", true, [outcome("correct-kept", "a"), outcome("false-positive-gone", "b"), outcome("missed-found", "c")]),
];

describe("tally", () => {
  it("counts by rule and by genre", () => {
    const byRule = tallyByRule(results);
    assert.equal(byRule.get("a")?.["correct-kept"], 2);
    assert.equal(byRule.get("a")?.["false-positive-present"], 1);
    assert.equal(byRule.get("b")?.["new"], 1);
    assert.equal(tallyByGenre(results).get("legal/statute")?.["missed-found"], 1);
    assert.equal(total(byRule)["correct-kept"], 2);
  });

  it("counts by origin, and names the origins other than human", () => {
    const mixed = [...results, { ...doc("three", "business/report", false, [outcome("correct-kept", "a"), outcome("missed-still", "d")]), origin: "ai" }];
    assert.equal(tallyByOrigin(mixed).get("ai")?.["missed-still"], 1);
    assert.equal(tallyByOrigin(mixed).get("human")?.["correct-kept"], 2);
    assert.deepEqual(otherOrigins(mixed), ["ai"]);
    assert.deepEqual(otherOrigins(results), []);
    assert.deepEqual(otherOrigins([]), []);
  });

  it("gives precision only where something is judged", () => {
    const byRule = tallyByRule(results);
    const ruleA = byRule.get("a");
    const ruleC = byRule.get("c");
    assert.ok(ruleA !== undefined && ruleC !== undefined);
    assert.equal(precisionOf(ruleA), 2 / 3);
    assert.equal(precisionOf(ruleC), undefined);
  });
});

describe("failuresOf", () => {
  it("passes when nothing correct is lost and judged documents get nothing new", () => {
    assert.deepEqual(failuresOf(results), []);
    assert.deepEqual(failuresOf([]), []);
  });

  it("fails on a correct finding lost, wherever it is", () => {
    const failures = failuresOf([doc("one", "g", false, [outcome("correct-lost", "a")])]);
    assert.deepEqual(
      failures.map((failure) => failure.reason),
      ["correct-lost"],
    );
  });

  it("fails on a new finding only when the document was fully judged", () => {
    assert.deepEqual(failuresOf([doc("one", "g", false, [outcome("new", "a")])]), []);
    assert.deepEqual(
      failuresOf([doc("one", "g", true, [outcome("new", "a")])]).map((failure) => failure.reason),
      ["new-on-judged"],
    );
  });

  it("does not fail on improvements: a false positive gone or a miss found", () => {
    assert.deepEqual(failuresOf([doc("one", "g", true, [outcome("false-positive-gone", "a"), outcome("missed-found", "b"), outcome("unjudged-gone", "c")])]), []);
  });
});

describe("renderReport", () => {
  it("lists failures, improvements and the documents not run", () => {
    const lost = [doc("one", "g", true, [outcome("correct-lost", "a"), outcome("false-positive-gone", "b")])];
    const report = renderReport(lost, { chaffVersion: "1.2.3", notRun: [{ id: "far", reason: "offline" }], problems: [] });
    assert.match(report, /chaffjs 1\.2\.3, 1 documents/);
    assert.match(report, /## Failures\n\n- a correct finding chaff no longer gives: `one:1` a/);
    assert.match(report, /## Improvements\n\n- false-positive-gone: `one:1` b/);
    assert.match(report, /- `far`: offline/);
  });

  it("splits by origin only when a document is not human-written", () => {
    assert.doesNotMatch(renderReport(results, { chaffVersion: "1.2.3", notRun: [], problems: [] }), /By origin|origin ai/);
    const aiDoc: DocumentResult = { ...doc("three", "business/report", false, [outcome("false-positive-present", "d")]), origin: "ai" };
    const report = renderReport([...results, aiDoc], { chaffVersion: "1.2.3", notRun: [], problems: [] });
    assert.match(report, /## By origin\n\n\| origin \|[^\n]*\n[^\n]*\n\| ai \| 0 \| 0 \| 1 \|/);
    assert.match(report, /## By rule, origin ai\n\n\| rule \|[^\n]*\n[^\n]*\n\| d \| 0 \| 0 \| 1 \|[^\n]*\| 0\.0% \|\n\| \*\*all\*\*/);
  });

  it("renders an empty run without failing sections", () => {
    const report = renderReport([], { chaffVersion: "1.2.3", notRun: [], problems: [] });
    assert.doesNotMatch(report, /Failures|Improvements|Not run|Problems/);
    assert.match(report, /\| \*\*all\*\* \| 0 \| 0 /);
  });
});
