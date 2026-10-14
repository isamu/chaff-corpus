import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ExpectedEntry } from "../scripts/lib/expected.ts";
import type { Finding } from "../scripts/lib/finding.ts";
import { matchDocument, type OutcomeKind } from "../scripts/lib/match.ts";

const finding = (rule: string, line: number, text: string): Finding => ({ rule, line, column: 1, text, message: `${rule} on ${text}` });

const kinds = (entries: readonly ExpectedEntry[], findings: readonly Finding[]): OutcomeKind[] => matchDocument(entries, findings).map((outcome) => outcome.kind);

describe("matchDocument", () => {
  it("keeps a correct finding chaff still gives, and loses one it no longer gives", () => {
    const entries: ExpectedEntry[] = [
      { verdict: "correct", rule: "a", line: 1, text: "x" },
      { verdict: "correct", rule: "a", line: 2, text: "y" },
    ];
    assert.deepEqual(kinds(entries, [finding("a", 1, "x")]), ["correct-kept", "correct-lost"]);
  });

  it("tells a false positive still there from one that has gone", () => {
    const entries: ExpectedEntry[] = [
      { verdict: "false-positive", rule: "a", line: 1, text: "x" },
      { verdict: "false-positive", rule: "b", line: 3, text: "z" },
    ];
    assert.deepEqual(kinds(entries, [finding("a", 1, "x")]), ["false-positive-present", "false-positive-gone"]);
  });

  it("needs rule, line and text all equal", () => {
    const entries: ExpectedEntry[] = [{ verdict: "correct", rule: "a", line: 1, text: "x" }];
    assert.deepEqual(kinds(entries, [finding("b", 1, "x")]), ["correct-lost", "new"]);
    assert.deepEqual(kinds(entries, [finding("a", 2, "x")]), ["correct-lost", "new"]);
    assert.deepEqual(kinds(entries, [finding("a", 1, "x ")]), ["correct-lost", "new"]);
  });

  it("matches each finding to one entry only, so two identical entries need two findings", () => {
    const entries: ExpectedEntry[] = [
      { verdict: "correct", rule: "a", line: 1, text: "x" },
      { verdict: "correct", rule: "a", line: 1, text: "x" },
    ];
    assert.deepEqual(kinds(entries, [finding("a", 1, "x")]), ["correct-kept", "correct-lost"]);
    assert.deepEqual(kinds(entries, [finding("a", 1, "x"), finding("a", 1, "x"), finding("a", 1, "x")]), ["correct-kept", "correct-kept", "new"]);
  });

  it("finds a miss when the missed rule appears on the missed line, whatever its text", () => {
    const entries: ExpectedEntry[] = [{ verdict: "missed", rule: "numbering-gap", line: 5, what: "article 3 is skipped" }];
    assert.deepEqual(kinds(entries, [finding("numbering-gap", 5, "第4条")]), ["missed-found"]);
    assert.deepEqual(kinds(entries, [finding("numbering-gap", 6, "第4条")]), ["missed-still", "new"]);
  });

  it("lets a judged entry take its exact finding before a miss on the same line can", () => {
    const entries: ExpectedEntry[] = [
      { verdict: "missed", rule: "a", line: 1, what: "something" },
      { verdict: "correct", rule: "a", line: 1, text: "x" },
    ];
    assert.deepEqual(kinds(entries, [finding("a", 1, "x")]), ["correct-kept", "missed-still"]);
  });

  it("reports every finding as new on a document with no entries, and nothing on an empty run", () => {
    assert.deepEqual(kinds([], [finding("a", 1, "x"), finding("b", 2, "y")]), ["new", "new"]);
    assert.deepEqual(kinds([], []), []);
    assert.deepEqual(kinds([{ verdict: "unjudged", rule: "a", line: 1, text: "x" }], []), ["unjudged-gone"]);
  });
});
