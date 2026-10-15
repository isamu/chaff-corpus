import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Expected } from "../scripts/lib/expected.ts";
import type { Finding } from "../scripts/lib/finding.ts";
import { renderResolveSummary, resolvedExpected } from "../scripts/lib/resolve.ts";
import { updatedExpected } from "../scripts/lib/update.ts";

const finding = (rule: string, line: number, text: string): Finding => ({ rule, line, column: 1, text, message: `${rule}!` });

const previous: Expected = {
  id: "doc",
  chaff: "0.30.0",
  findings: [
    { verdict: "correct", rule: "a", line: 1, text: "x", note: "right" },
    { verdict: "false-positive", rule: "b", line: 2, text: "y", note: "a heading" },
    { verdict: "unjudged", rule: "c", line: 3, text: "z" },
    { verdict: "missed", rule: "d", line: 4, what: "a gap", note: "section 4 then 6" },
  ],
};

const summary = (expected: Expected): string[][] => expected.findings.map((entry) => [entry.verdict, entry.rule, String(entry.line)]);

describe("resolvedExpected", () => {
  it("removes a false positive chaff no longer gives, and reports it resolved", () => {
    const resolved = resolvedExpected(previous, "doc", "0.34.0", [finding("a", 1, "x"), finding("c", 3, "z")], true);
    assert.ok(!resolved.expected.findings.some((entry) => entry.verdict === "false-positive"));
    assert.deepEqual(resolved.changes, [{ kind: "resolved", rule: "b", line: 2, text: "y", note: "a heading" }]);
  });

  it("keeps a false positive chaff still gives", () => {
    const resolved = resolvedExpected(previous, "doc", "0.34.0", [finding("a", 1, "x"), finding("b", 2, "y"), finding("c", 3, "z")], true);
    assert.deepEqual(resolved.expected.findings[1], previous.findings[1]);
    assert.deepEqual(resolved.changes, []);
  });

  it("turns a miss chaff now gives into correct, at the finding's text, keeping the note", () => {
    const resolved = resolvedExpected(previous, "doc", "0.34.0", [finding("a", 1, "x"), finding("b", 2, "y"), finding("c", 3, "z"), finding("d", 4, "w")], true);
    assert.deepEqual(resolved.expected.findings[3], {
      verdict: "correct",
      rule: "d",
      line: 4,
      text: "w",
      message: "d!",
      note: "section 4 then 6; found by chaffjs 0.34.0",
    });
    assert.deepEqual(resolved.changes, [{ kind: "found", rule: "d", line: 4, text: "a gap", note: "section 4 then 6" }]);
  });

  it("keeps the miss's `what` as the note when it had none", () => {
    const bare: Expected = { id: "doc", chaff: "0.30.0", findings: [{ verdict: "missed", rule: "d", line: 4, what: "a gap" }] };
    const resolved = resolvedExpected(bare, "doc", "0.34.0", [finding("d", 4, "w")], true);
    assert.equal(resolved.expected.findings[0]?.note, "a gap; found by chaffjs 0.34.0");
  });

  it("keeps a miss chaff still does not give, even when the rule fires on another line", () => {
    const resolved = resolvedExpected(previous, "doc", "0.34.0", [finding("a", 1, "x"), finding("b", 2, "y"), finding("d", 5, "w")], true);
    assert.deepEqual(resolved.expected.findings[2], previous.findings[3]);
    assert.ok(!resolved.changes.some((change) => change.kind === "found"));
  });

  it("never removes a correct finding chaff lost, and reports it regressed", () => {
    const resolved = resolvedExpected(previous, "doc", "0.34.0", [finding("b", 2, "y")], true);
    assert.deepEqual(resolved.expected.findings[0], previous.findings[0]);
    assert.deepEqual(resolved.changes, [{ kind: "regressed", rule: "a", line: 1, text: "x", note: "right" }]);
  });

  it("does what --update does to unjudged and new findings", () => {
    const findings = [finding("a", 1, "x"), finding("b", 2, "y"), finding("e", 9, "v")];
    assert.deepEqual(summary(resolvedExpected(previous, "doc", "0.34.0", findings, true).expected), summary(updatedExpected(previous, "doc", "0.34.0", findings, true)));
  });

  it("writes a new document as --update does and settles nothing", () => {
    const findings = [finding("a", 1, "x")];
    const resolved = resolvedExpected(undefined, "doc", "0.34.0", findings, true);
    assert.deepEqual(resolved.expected, updatedExpected(undefined, "doc", "0.34.0", findings, true));
    assert.deepEqual(resolved.changes, []);
  });

  it("removes one copy of a false positive per copy gone", () => {
    const twice: Expected = {
      id: "doc",
      chaff: "0.30.0",
      findings: [
        { verdict: "false-positive", rule: "b", line: 2, text: "y" },
        { verdict: "false-positive", rule: "b", line: 2, text: "y" },
      ],
    };
    assert.equal(resolvedExpected(twice, "doc", "0.34.0", [finding("b", 2, "y")], true).expected.findings.length, 1);
    assert.equal(resolvedExpected(twice, "doc", "0.34.0", [], true).expected.findings.length, 0);
  });

  it("is stable: resolving twice with the same findings settles nothing the second time", () => {
    const findings = [finding("a", 1, "x"), finding("d", 4, "w"), finding("e", 9, "v")];
    const once = resolvedExpected(previous, "doc", "0.34.0", findings, true);
    const twice = resolvedExpected(once.expected, "doc", "0.34.0", findings, true);
    assert.deepEqual(twice.expected, once.expected);
    assert.deepEqual(twice.changes, []);
  });
});

describe("renderResolveSummary", () => {
  it("lists every change under its section, with the document and line", () => {
    const markdown = renderResolveSummary("0.34.0", [
      { id: "doc", changes: [{ kind: "resolved", rule: "b", line: 2, text: "y", note: "a heading" }] },
      { id: "other", changes: [{ kind: "regressed", rule: "a", line: 1, text: "x" }] },
    ]);
    assert.match(markdown, /## What chaffjs 0\.34\.0 settled/);
    assert.match(markdown, /### Resolved[^\n]*\n\n- `doc:2` b — y \(a heading\)\n/);
    assert.match(markdown, /### Found[^\n]*\n\nNone\.\n/);
    assert.match(markdown, /### Regressed[^\n]*\n\n- `other:1` a — x\n/);
  });

  it("says None. under each section when nothing changed", () => {
    assert.equal(renderResolveSummary("0.34.0", []).match(/None\./g)?.length, 3);
  });
});
