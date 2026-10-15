import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Expected } from "../scripts/lib/expected.ts";
import type { Finding } from "../scripts/lib/finding.ts";
import { updatedExpected } from "../scripts/lib/update.ts";

const finding = (rule: string, line: number, text: string): Finding => ({ rule, line, column: 1, text, message: `${rule}!` });

const previous: Expected = {
  id: "doc",
  chaff: "0.30.0",
  findings: [
    { verdict: "correct", rule: "a", line: 1, text: "x", note: "right" },
    { verdict: "false-positive", rule: "b", line: 2, text: "y", note: "a heading" },
    { verdict: "unjudged", rule: "c", line: 3, text: "z" },
    { verdict: "missed", rule: "d", line: 4, what: "a gap" },
  ],
};

describe("updatedExpected", () => {
  it("writes every finding of a new document as unjudged, with the version it ran", () => {
    const written = updatedExpected(undefined, "doc", "0.33.0", [finding("b", 2, "y"), finding("a", 1, "x")], true);
    assert.equal(written.chaff, "0.33.0");
    assert.deepEqual(
      written.findings.map((entry) => [entry.verdict, entry.rule, entry.line]),
      [
        ["unjudged", "a", 1],
        ["unjudged", "b", 2],
      ],
    );
  });

  it("keeps every verdict a person gave, even when chaff no longer gives the finding", () => {
    const written = updatedExpected(previous, "doc", "0.33.0", [], true);
    assert.equal(written.chaff, "0.30.0");
    assert.deepEqual(
      written.findings.map((entry) => entry.verdict),
      ["correct", "false-positive", "missed"],
    );
    assert.deepEqual(written.findings[0], previous.findings[0]);
  });

  it("adds a new finding as unjudged and keeps an unjudged one chaff still gives", () => {
    const written = updatedExpected(previous, "doc", "0.33.0", [finding("a", 1, "x"), finding("c", 3, "z"), finding("e", 9, "w")], true);
    assert.deepEqual(
      written.findings.map((entry) => [entry.verdict, entry.rule]),
      [
        ["correct", "a"],
        ["false-positive", "b"],
        ["unjudged", "c"],
        ["missed", "d"],
        ["unjudged", "e"],
      ],
    );
  });

  it("drops one copy of an unjudged entry per copy gone", () => {
    const twice: Expected = {
      id: "doc",
      chaff: "0.30.0",
      findings: [
        { verdict: "unjudged", rule: "c", line: 3, text: "z" },
        { verdict: "unjudged", rule: "c", line: 3, text: "z" },
      ],
    };
    assert.equal(updatedExpected(twice, "doc", "0.33.0", [finding("c", 3, "z")], true).findings.length, 1);
    assert.equal(updatedExpected(twice, "doc", "0.33.0", [], true).findings.length, 0);
  });

  it("is stable: updating twice with the same findings changes nothing", () => {
    const findings = [finding("a", 1, "x"), finding("e", 9, "w")];
    const once = updatedExpected(previous, "doc", "0.33.0", findings, true);
    assert.deepEqual(updatedExpected(once, "doc", "0.34.0", findings, true), once);
  });
});
