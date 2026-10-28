// yarn judge: recovering a hashed entry's text from the local document, and printing without writing.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { committedText, documentFiles, expectedIds, ROOT, type DocumentFiles } from "../scripts/lib/corpus.ts";
import type { Expected } from "../scripts/lib/expected.ts";
import { excerptAt } from "../scripts/lib/finding.ts";
import { JUDGE_OPTIONS, judgeReport, parseJudgeArgs, recoverText } from "../scripts/lib/judge.ts";
import { sha256Of } from "../scripts/lib/meta.ts";

const SOURCE = ["# Title", "The Supplier shall pay the fee within a reasonable time.", "Last line."].join("\n");
const SOURCE_LINES = SOURCE.split("\n");
const COLUMN_OF_PAY = SOURCE_LINES[1]?.indexOf("pay") ?? -1;
const PAY_EXCERPT = excerptAt(SOURCE_LINES, 2, COLUMN_OF_PAY + 1);

const expectedWith = (findings: Expected["findings"]): Expected => ({ id: "doc", chaff: "0.34.0", findings });

describe("recoverText", () => {
  it("finds the column whose excerpt has the entry's sha256, as the runner extracts it", () => {
    assert.deepEqual(recoverText(SOURCE_LINES, 2, sha256Of(PAY_EXCERPT)), { column: COLUMN_OF_PAY + 1, text: PAY_EXCERPT });
  });

  it("finds a span at the first and at the last column of a line", () => {
    assert.deepEqual(recoverText(SOURCE_LINES, 3, sha256Of("Last line.")), { column: 1, text: "Last line." });
    assert.deepEqual(recoverText(SOURCE_LINES, 3, sha256Of(".")), { column: 10, text: "." });
  });

  it("finds nothing when the hash is of another line's text, of text not on the line, or of a span cut differently", () => {
    assert.equal(recoverText(SOURCE_LINES, 2, sha256Of("Last line.")), undefined);
    assert.equal(recoverText(SOURCE_LINES, 2, sha256Of("absent")), undefined);
    assert.equal(recoverText(SOURCE_LINES, 2, sha256Of("pay the")), undefined);
  });

  it("finds nothing on a line the document does not have", () => {
    assert.equal(recoverText(SOURCE_LINES, 99, sha256Of("x")), undefined);
    assert.equal(recoverText(SOURCE_LINES, 0, sha256Of("x")), undefined);
    assert.equal(recoverText([], 1, sha256Of("")), undefined);
  });
});

describe("judgeReport", () => {
  it("prints a hashed entry's verdict, rule, line, note and recovered text", () => {
    const report = judgeReport(expectedWith([{ verdict: "false-positive", rule: "vague-deadline", line: 2, sha256: sha256Of(PAY_EXCERPT), note: "fixed by clause 9" }]), { text: SOURCE });
    assert.deepEqual(report.slice(1), ["", "false-positive  vague-deadline  line 2", `  column ${String(COLUMN_OF_PAY + 1)}: ${PAY_EXCERPT}`, "  note: fixed by clause 9"]);
  });

  it("says so when no span on the line has the entry's hash", () => {
    const hash = sha256Of("gone");
    const report = judgeReport(expectedWith([{ verdict: "unjudged", rule: "a", line: 2, sha256: hash }]), { text: SOURCE });
    assert.deepEqual(report.slice(2), ["unjudged  a  line 2", `  sha256: ${hash}`, "  no span on this line has this sha256: the document changed, or the line moved"]);
  });

  it("prints a text entry's text and message, and a missed entry's what", () => {
    const report = judgeReport(
      expectedWith([
        { verdict: "correct", rule: "a", line: 1, text: "Title", message: "m" },
        { verdict: "missed", rule: "b", line: 3, what: "a gap" },
      ]),
      { text: SOURCE },
    );
    assert.deepEqual(report.slice(1), ["", "correct  a  line 1", "  text: Title", "  message: m", "", "missed  b  line 3", "  what: a gap"]);
  });

  it("without the document's text (offline, not cached), says why and shows hashed entries by their sha256 only", () => {
    const hash = sha256Of(PAY_EXCERPT);
    const report = judgeReport(expectedWith([{ verdict: "unjudged", rule: "a", line: 2, sha256: hash }]), { unavailable: "not in .cache (offline)" });
    assert.match(report[1] ?? "", /not available \(not in \.cache \(offline\)\)/);
    assert.deepEqual(report.slice(2), ["", "unjudged  a  line 2", `  sha256: ${hash}`]);
  });

  it("starts with the id, the chaffjs version and the number of entries", () => {
    assert.deepEqual(judgeReport(expectedWith([]), { text: "" }), ["doc (judged against chaffjs 0.34.0): 0 entries"]);
  });
});

describe("parseJudgeArgs", () => {
  it("takes one id and --offline", () => {
    assert.deepEqual(parseJudgeArgs(["doc"]), { id: "doc", offline: false });
    assert.deepEqual(parseJudgeArgs(["doc", "--offline"]), { id: "doc", offline: true });
  });

  it("rejects no id, two ids, and any other option", () => {
    assert.ok("problem" in parseJudgeArgs([]));
    assert.ok("problem" in parseJudgeArgs(["a", "b"]));
    assert.ok("problem" in parseJudgeArgs(["doc", "--update"]));
  });

  it("has no option that names a file to write: --offline is its only option", () => {
    assert.deepEqual(Object.keys(JUDGE_OPTIONS), ["offline"]);
    ["--out", "--json", "--output", "--resolve-out", "--write"].forEach((option) => assert.ok("problem" in parseJudgeArgs(["doc", option, "file"]), option));
  });
});

const FS_WRITES = /\b(writeFileSync|appendFileSync|mkdirSync|rmSync|renameSync|copyFileSync|writeFile|appendFile|createWriteStream)\b/;

const runJudge = (args: readonly string[]): { status: number | null; stdout: string } => {
  const result = spawnSync(process.execPath, [join(ROOT, "scripts", "judge.ts"), ...args], { cwd: ROOT, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout };
};

// node_modules is left out: judge never writes there, and its ignored files outgrow execFileSync's output buffer (ENOBUFS).
const repoState = (): string =>
  execFileSync("git", ["status", "--porcelain", "--ignored", "--untracked-files=all", "--", ".", ":(exclude)node_modules"], { cwd: ROOT, encoding: "utf8" });

const metaOf = (id: string): DocumentFiles | undefined => documentFiles().find((file) => file.place.id === id);

describe("yarn judge writes nothing", () => {
  it("imports no file-writing function", () => {
    [join(ROOT, "scripts", "judge.ts"), join(ROOT, "scripts", "lib", "judge.ts")].forEach((path) => assert.doesNotMatch(readFileSync(path, "utf8"), FS_WRITES, path));
  });

  it("prints a committed document's entries and leaves the repository as it was", () => {
    const id = expectedIds().find((candidate) => {
      const files = metaOf(candidate);
      return files !== undefined && committedText(files) !== undefined;
    });
    assert.ok(id !== undefined, "a committed document with an expected file");
    const before = repoState();
    const { status, stdout } = runJudge([id, "--offline"]);
    assert.equal(status, 0);
    assert.match(stdout, new RegExp(`^${id} \\(judged against chaffjs `));
    assert.equal(repoState(), before);
  });

  it("with --offline and no cached copy, exits 1, says the text is not available, and writes nothing", (context) => {
    const id = expectedIds().find((candidate) => {
      const files = metaOf(candidate);
      return files !== undefined && files.textPaths.length === 0 && !["md", "txt"].some((extension) => existsSync(join(ROOT, ".cache", `${candidate}.${extension}`)));
    });
    if (id === undefined) return context.skip("every document that may not be redistributed is cached here");
    const before = repoState();
    const { status, stdout } = runJudge([id, "--offline"]);
    assert.equal(status, 1);
    assert.match(stdout, /not available \(not in .*\(offline\)\)/);
    assert.equal(repoState(), before);
  });
});
