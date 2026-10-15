// Expected entries known by the sha256 of their text, for documents that may not be redistributed.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parse } from "yaml";
import { parseExpected, quotingProblems, type Expected, type ExpectedEntry } from "../scripts/lib/expected.ts";
import { expectedYaml } from "../scripts/lib/expected-write.ts";
import type { Finding } from "../scripts/lib/finding.ts";
import { matchDocument, withoutText, type OutcomeKind } from "../scripts/lib/match.ts";
import { sha256Of } from "../scripts/lib/meta.ts";
import { place } from "../scripts/lib/report.ts";
import { renderResolveSummary, resolvedExpected } from "../scripts/lib/resolve.ts";
import { parseShardResult, shardJson, type ShardResult } from "../scripts/lib/shard-result.ts";
import { updatedExpected } from "../scripts/lib/update.ts";

const finding = (rule: string, line: number, text: string): Finding => ({ rule, line, column: 1, text, message: `${rule} on ${text}` });

const hashOfX = sha256Of("x");

const parsedEntries = (findings: readonly unknown[]): ReturnType<typeof parseExpected> => parseExpected({ id: "doc", chaff: "0.34.0", findings }, "doc");

const kinds = (entries: readonly ExpectedEntry[], findings: readonly Finding[]): OutcomeKind[] => matchDocument(entries, findings).map((outcome) => outcome.kind);

/** Every string anywhere in a value: what a file or a report would show. */
const stringsIn = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringsIn);
  return typeof value === "object" && value !== null ? Object.values(value).flatMap(stringsIn) : [];
};

describe("hashed entries: parsing", () => {
  it("reads an entry with sha256 and no text, and round-trips it through the writer", () => {
    const parsed = parsedEntries([{ rule: "a", line: 1, sha256: hashOfX, verdict: "correct", note: "right" }]);
    assert.ok("value" in parsed);
    assert.deepEqual(parsed.value.findings, [{ verdict: "correct", rule: "a", line: 1, sha256: hashOfX, note: "right" }]);
    assert.deepEqual(parseExpected(parse(expectedYaml(parsed.value)), "doc"), parsed);
  });

  it("rejects an entry with both text and sha256, and one with neither", () => {
    const both = parsedEntries([{ rule: "a", line: 1, text: "x", sha256: hashOfX, verdict: "correct" }]);
    const neither = parsedEntries([{ rule: "a", line: 1, verdict: "correct" }]);
    assert.ok("problems" in both && "problems" in neither);
    assert.match(both.problems.join(), /exactly one of `text` and `sha256`/);
    assert.match(neither.problems.join(), /exactly one of `text` and `sha256`/);
  });

  it("rejects a hashed entry with a message, or a sha256 that is not 64 lowercase hex digits", () => {
    assert.ok("problems" in parsedEntries([{ rule: "a", line: 1, sha256: hashOfX, message: "m", verdict: "correct" }]));
    assert.ok("problems" in parsedEntries([{ rule: "a", line: 1, sha256: hashOfX.toUpperCase(), verdict: "correct" }]));
    assert.ok("problems" in parsedEntries([{ rule: "a", line: 1, sha256: "abc", verdict: "correct" }]));
  });
});

describe("hashed entries: matching", () => {
  it("matches a finding whose text has the entry's sha256", () => {
    assert.deepEqual(kinds([{ verdict: "correct", rule: "a", line: 1, sha256: hashOfX }], [finding("a", 1, "x")]), ["correct-kept"]);
  });

  it("does not match a finding whose text has another sha256, nor another rule or line", () => {
    const entries: ExpectedEntry[] = [{ verdict: "correct", rule: "a", line: 1, sha256: hashOfX }];
    assert.deepEqual(kinds(entries, [finding("a", 1, "x ")]), ["correct-lost", "new"]);
    assert.deepEqual(kinds(entries, [finding("b", 1, "x")]), ["correct-lost", "new"]);
    assert.deepEqual(kinds(entries, [finding("a", 2, "x")]), ["correct-lost", "new"]);
  });

  it("carries the sha256, not the text, on the outcome of a hashed entry", () => {
    const [outcome] = matchDocument([{ verdict: "false-positive", rule: "a", line: 1, sha256: hashOfX }], []);
    assert.deepEqual(outcome, { kind: "false-positive-gone", rule: "a", line: 1, sha256: hashOfX });
  });

  it("drops the text and the finding from an outcome a report of such a document shows", () => {
    const outcomes = matchDocument([], [finding("a", 1, "secret words")]).map(withoutText);
    assert.deepEqual(outcomes, [{ kind: "new", rule: "a", line: 1, sha256: sha256Of("secret words") }]);
    assert.deepEqual(withoutText({ kind: "missed-still", rule: "a", line: 2, text: "a gap" }), { kind: "missed-still", rule: "a", line: 2 });
  });
});

describe("hashed entries: validate", () => {
  it("lists every entry that quotes the text of a document that may not be redistributed", () => {
    const expected: Expected = {
      id: "doc",
      chaff: "0.34.0",
      findings: [
        { verdict: "correct", rule: "a", line: 1, sha256: hashOfX },
        { verdict: "unjudged", rule: "b", line: 2, text: "y", message: "m" },
        { verdict: "missed", rule: "c", line: 3, what: "a gap" },
      ],
    };
    const problems = quotingProblems(expected);
    assert.equal(problems.length, 1);
    assert.match(problems[0] ?? "", /^findings\[1\] \(b, line 2\)/);
  });

  it("finds nothing in a file of hashed and missed entries only", () => {
    assert.deepEqual(quotingProblems({ id: "doc", chaff: "0.34.0", findings: [{ verdict: "unjudged", rule: "a", line: 1, sha256: hashOfX }] }), []);
  });
});

describe("hashed entries: update and resolve", () => {
  it("writes new findings as hashed unjudged entries with no text or message when the document may not be redistributed", () => {
    const written = updatedExpected(undefined, "doc", "0.34.0", [finding("a", 1, "secret words")], false);
    assert.deepEqual(written.findings, [{ verdict: "unjudged", rule: "a", line: 1, sha256: sha256Of("secret words") }]);
    assert.equal(stringsIn(parse(expectedYaml(written))).some((value) => value.includes("secret")), false);
  });

  it("still writes text and message when the document may be redistributed", () => {
    const written = updatedExpected(undefined, "doc", "0.34.0", [finding("a", 1, "x")], true);
    assert.deepEqual(written.findings, [{ verdict: "unjudged", rule: "a", line: 1, text: "x", message: "a on x" }]);
  });

  it("keeps a hashed unjudged entry chaff still gives, drops it once gone, and is stable on a second run", () => {
    const findings = [finding("a", 1, "x"), finding("a", 1, "x")];
    const once = updatedExpected(undefined, "doc", "0.34.0", findings, false);
    assert.equal(once.findings.length, 2);
    assert.deepEqual(updatedExpected(once, "doc", "0.34.0", findings, false), once);
    assert.equal(updatedExpected(once, "doc", "0.34.0", [finding("a", 1, "x")], false).findings.length, 1);
  });

  it("marks a found miss correct by sha256, and reports changes without text", () => {
    const previous: Expected = {
      id: "doc",
      chaff: "0.34.0",
      findings: [
        { verdict: "false-positive", rule: "b", line: 2, sha256: sha256Of("y") },
        { verdict: "missed", rule: "d", line: 4, what: "a gap" },
      ],
    };
    const resolved = resolvedExpected(previous, "doc", "0.35.0", [finding("d", 4, "secret words")], false);
    assert.deepEqual(resolved.expected.findings, [{ verdict: "correct", rule: "d", line: 4, sha256: sha256Of("secret words"), note: "a gap; found by chaffjs 0.35.0" }]);
    assert.equal(stringsIn(resolved.changes).some((value) => value.includes("secret")), false);
    assert.match(renderResolveSummary("0.35.0", [{ id: "doc", changes: resolved.changes }]), /- `doc:2` b\n/);
  });
});

describe("hashed entries: reports", () => {
  it("places an outcome without text as id:line and rule only", () => {
    assert.equal(place("doc", { kind: "new", rule: "a", line: 3, sha256: hashOfX }), "`doc:3` a");
    assert.equal(place("doc", { kind: "new", rule: "a", line: 3, text: "x" }), "`doc:3` a — x");
  });

  it("keeps the sha256 and no text through a shard's JSON", () => {
    const shard: ShardResult = {
      chaffVersion: "0.34.0",
      notRun: [],
      problems: [],
      results: [{ id: "doc", genre: "g", language: "en", fullyJudged: false, outcomes: [{ kind: "new", rule: "a", line: 1, sha256: hashOfX }] }],
    };
    assert.deepEqual(parseShardResult(JSON.parse(shardJson(shard))), shard);
  });
});
