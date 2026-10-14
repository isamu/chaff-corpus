import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parse } from "yaml";
import { isFullyJudged, parseExpected } from "../scripts/lib/expected.ts";
import { expectedYaml } from "../scripts/lib/expected-write.ts";
import { findingsFromSarif } from "../scripts/lib/finding.ts";

describe("parseExpected", () => {
  it("reads judged and missed entries, and round-trips through the writer", () => {
    const raw = {
      id: "doc",
      chaff: "0.33.0",
      findings: [
        { rule: "a", line: 1, text: "x", message: "m", verdict: "correct" },
        { rule: "b", line: 2, text: "y", verdict: "false-positive", note: "a heading read as a sentence" },
        { rule: "c", line: 3, what: "article 3 is skipped", verdict: "missed" },
      ],
    };
    const parsed = parseExpected(raw, "doc");
    assert.ok("value" in parsed);
    assert.equal(parsed.value.findings.length, 3);
    assert.deepEqual(parseExpected(parse(expectedYaml(parsed.value)), "doc"), parsed);
  });

  it("reads an empty findings list as a clean, fully judged document", () => {
    const parsed = parseExpected({ id: "doc", chaff: "0.33.0", findings: [] }, "doc");
    assert.ok("value" in parsed);
    assert.equal(isFullyJudged(parsed.value), true);
    assert.equal(isFullyJudged(undefined), false);
  });

  it("is not fully judged while one entry is unjudged", () => {
    const parsed = parseExpected({ id: "doc", chaff: "0.33.0", findings: [{ rule: "a", line: 1, text: "x", verdict: "unjudged" }] }, "doc");
    assert.ok("value" in parsed);
    assert.equal(isFullyJudged(parsed.value), false);
  });

  it("names each broken entry", () => {
    const parsed = parseExpected(
      {
        id: "doc",
        chaff: "0.33.0",
        findings: [{ rule: "a", line: 0, text: "x", verdict: "correct" }, { rule: "a", line: 1, text: "x", verdict: "maybe" }, { rule: "a", line: 1, verdict: "missed" }, "x"],
      },
      "doc",
    );
    assert.deepEqual(parsed, {
      problems: [
        "findings[0]: an entry needs a positive integer `line`",
        "findings[1]: verdict must be one of correct, false-positive, unjudged, missed",
        "findings[2]: a missed entry needs `what`",
        "findings[3]: an entry must be a mapping",
      ],
    });
  });

  it("checks the header", () => {
    assert.deepEqual(parseExpected({ id: "other", findings: {} }, "doc"), {
      problems: ['id must be "doc" (the file name)', "`chaff` (the version judged against) is required", "`findings` must be a list"],
    });
    assert.deepEqual(parseExpected("text", "doc"), { problems: ["the file must be a mapping"] });
  });
});

describe("findingsFromSarif", () => {
  const sarif = (results: unknown[]): unknown => ({ runs: [{ results }] });
  const result = (ruleId: string, startLine: number, startColumn: number): unknown => ({
    ruleId,
    message: { text: "msg" },
    locations: [{ physicalLocation: { region: { startLine, startColumn } } }],
  });

  it("reads rule, line, column, message and the text at the position", () => {
    const findings = findingsFromSarif(sarif([result("chaff/cliche", 2, 5)]), "first\nthe quick fox\n");
    assert.deepEqual(findings, [{ rule: "cliche", line: 2, column: 5, text: "quick fox", message: "msg" }]);
  });

  it("cuts the text at the excerpt length, by characters", () => {
    const [finding] = findingsFromSarif(sarif([result("chaff/a", 1, 1)]), "あ".repeat(60));
    assert.equal(finding?.text, "あ".repeat(40));
  });

  it("puts a finding without a place on line 1, and skips what is not a result", () => {
    const findings = findingsFromSarif(sarif([{ ruleId: "chaff/a", message: { text: "m" } }, { message: {} }, null]), "top line");
    assert.deepEqual(findings, [{ rule: "a", line: 1, column: 1, text: "top line", message: "m" }]);
  });

  it("reads no findings from what is not a SARIF log", () => {
    assert.deepEqual(findingsFromSarif(null, "x"), []);
    assert.deepEqual(findingsFromSarif({ runs: [] }, "x"), []);
  });
});
