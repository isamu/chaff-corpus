import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { edinetBenchMarkdown } from "../scripts/lib/edinet-bench-markdown.ts";
import { hfRowUrl, hfText, isPinned, parseHfRow, recordFromJsonl, recordFromRows, type HfRow } from "../scripts/lib/hf-row.ts";

const REVISION = "2993206922ead839ce003e2faa65cd5d2ff07607";

const ROW: HfRow = { dataset: "numad/yuho-text-2024", config: "default", split: "train", offset: 1, field: "text", revision: REVISION };

const rowsBody = (offset: number, row: unknown): string => JSON.stringify({ features: [], rows: [{ row_idx: offset, row, truncated_cells: [] }] });

const problemsOf = <T>(parsed: { value: T } | { problems: readonly string[] }): readonly string[] => ("problems" in parsed ? parsed.problems : []);

describe("parseHfRow", () => {
  it("accepts a record address with its revision, and the optional file, render and omit", () => {
    assert.deepEqual(parseHfRow({ ...ROW }), { value: ROW });
    const full = { ...ROW, file: "yuho-202401.jsonl", render: "edinet-bench", omit: ["役員の状況"] };
    assert.deepEqual(parseHfRow(full), { value: full });
    assert.deepEqual(problemsOf(parseHfRow({ ...ROW, offset: 0 })), []);
  });

  it("names every field that is missing or wrong", () => {
    assert.deepEqual(problemsOf(parseHfRow({})), [
      "source.hf.dataset must be <owner>/<name>",
      "source.hf.config is required",
      "source.hf.split is required",
      "source.hf.offset must be a whole number from 0",
      "source.hf.field is required",
      "source.hf.revision must be the dataset's 40-digit commit sha",
    ]);
    assert.deepEqual(problemsOf(parseHfRow("numad/yuho-text-2024")), ["source.hf must be a mapping (dataset, config, split, offset, field, revision)"]);
  });

  it("rejects a dataset without an owner, a negative or fractional offset, and a revision that is a branch", () => {
    assert.deepEqual(problemsOf(parseHfRow({ ...ROW, dataset: "yuho-text-2024" })), ["source.hf.dataset must be <owner>/<name>"]);
    [-1, 1.5, "1"].forEach((offset) => assert.deepEqual(problemsOf(parseHfRow({ ...ROW, offset })), ["source.hf.offset must be a whole number from 0"]));
    ["main", REVISION.slice(1), REVISION.toUpperCase()].forEach((revision) =>
      assert.deepEqual(problemsOf(parseHfRow({ ...ROW, revision })), ["source.hf.revision must be the dataset's 40-digit commit sha"]),
    );
  });

  it("rejects a file that is not a JSONL path in the dataset, an unknown renderer, and omit without a renderer", () => {
    ["data.parquet", "../x.jsonl", "a b.jsonl", 3].forEach((file) => assert.deepEqual(problemsOf(parseHfRow({ ...ROW, file })), ["source.hf.file must be a .jsonl path in the dataset"]));
    assert.deepEqual(problemsOf(parseHfRow({ ...ROW, render: "markdown" })), ["source.hf.render must be one of edinet-bench"]);
    assert.deepEqual(problemsOf(parseHfRow({ ...ROW, omit: ["役員の状況"] })), ["source.hf.omit needs source.hf.render"]);
    assert.deepEqual(problemsOf(parseHfRow({ ...ROW, render: "edinet-bench", omit: "役員の状況" })), ["source.hf.omit must be a list of names"]);
  });
});

describe("hfRowUrl", () => {
  it("reads a JSONL file at the pinned revision", () => {
    const row = { ...ROW, file: "yuho-202401.jsonl" };
    assert.equal(hfRowUrl(row), `https://huggingface.co/datasets/numad/yuho-text-2024/resolve/${REVISION}/yuho-202401.jsonl`);
    assert.equal(isPinned(row), true);
  });

  it("falls back to one row of the rows API, which is not pinned", () => {
    assert.equal(hfRowUrl(ROW), "https://datasets-server.huggingface.co/rows?dataset=numad%2Fyuho-text-2024&config=default&split=train&offset=1&length=1");
    assert.equal(isPinned(ROW), false);
  });
});

describe("recordFromRows", () => {
  it("takes the row at the offset", () => {
    assert.deepEqual(recordFromRows(rowsBody(4, { text: "本文" }), 4), { value: { text: "本文" } });
  });

  it("finds no record when the response holds another row or none", () => {
    assert.deepEqual(problemsOf(recordFromRows(rowsBody(5, { text: "本文" }), 4)), ["no record at offset 4"]);
    assert.deepEqual(problemsOf(recordFromRows(JSON.stringify({ rows: [] }), 4)), ["no record at offset 4"]);
    assert.deepEqual(problemsOf(recordFromRows(JSON.stringify({ error: "The split does not exist." }), 4)), ["the rows API response has no rows"]);
  });

  it("rejects a response that is not JSON", () => {
    assert.match(problemsOf(recordFromRows("<html>rate limited</html>", 0)).join(), /^the rows API response is not JSON: /u);
  });
});

describe("recordFromJsonl", () => {
  const body = `${JSON.stringify({ text: "一行目" })}\n${JSON.stringify({ text: "二行目" })}\n`;

  it("takes the line at the offset", () => {
    assert.deepEqual(recordFromJsonl(body, 0), { value: { text: "一行目" } });
    assert.deepEqual(recordFromJsonl(body, 1), { value: { text: "二行目" } });
  });

  it("finds no record past the end, or on a blank line", () => {
    assert.deepEqual(problemsOf(recordFromJsonl(body, 2)), ["no record at line 2"]);
    assert.deepEqual(problemsOf(recordFromJsonl(body, 9)), ["no record at line 9"]);
  });

  it("rejects a line that is not JSON, or not a record", () => {
    assert.match(problemsOf(recordFromJsonl('{"text": "途中で切れ\n', 0)).join(), /^line 0 is not JSON: /u);
    assert.deepEqual(problemsOf(recordFromJsonl('["text"]\n', 0)), ["line 0 is not a record"]);
  });
});

describe("hfText", () => {
  it("gives the field of the record, as it is", () => {
    assert.deepEqual(hfText(ROW, rowsBody(1, { text: "２【沿革】当社は設立されました。", url: "https://example.jp" })), { value: "２【沿革】当社は設立されました。" });
    const pinned = { ...ROW, file: "yuho-202401.jsonl", offset: 0 };
    assert.deepEqual(hfText(pinned, `${JSON.stringify({ text: "本文" })}\n`), { value: "本文" });
  });

  it("names the field when the record does not have it as text", () => {
    assert.deepEqual(problemsOf(hfText({ ...ROW, field: "body" }, rowsBody(1, { text: "本文" }))), ['the record has no text field "body"']);
    assert.deepEqual(problemsOf(hfText(ROW, rowsBody(1, { text: 12 }))), ['the record has no text field "text"']);
  });

  it("passes on a missing record and a malformed body", () => {
    assert.deepEqual(problemsOf(hfText(ROW, rowsBody(0, { text: "本文" }))), ["no record at offset 1"]);
    assert.match(problemsOf(hfText(ROW, "{")).join(), /not JSON/u);
  });

  it("renders the record when the row names a renderer", () => {
    const record = { meta: JSON.stringify({ 会社名: "例株式会社" }), text: JSON.stringify({ 沿革: { FilingDate: "沿革の本文" } }) };
    assert.deepEqual(hfText({ ...ROW, render: "edinet-bench" }, rowsBody(1, record)), { value: "# 例株式会社 有価証券報告書\n\n## 沿革\n\n沿革の本文\n" });
  });
});

describe("edinetBenchMarkdown", () => {
  const record = {
    meta: JSON.stringify({ 会社名: "例株式会社", 提出書類: "有価証券報告書", 当事業年度開始日: "2022-04-01", 当事業年度終了日: "2023-03-31" }),
    text: JSON.stringify({
      沿革: { FilingDate: "２【沿革】1990年設立" },
      役員の状況: { FilingDate: "役員の氏名" },
      連結貸借対照表: { CurrentYear: " 当期の表 ", Prior1Year: "前期の表" },
      研究開発活動: { FilingDate: "  " },
    }),
    bs: JSON.stringify({ 流動資産: { Prior1Year: "100", CurrentYear: "120" }, "その他|注": { CurrentYear: "－" } }),
    pl: "",
    summary: JSON.stringify({ 自己資本比率: { Prior1Year: "0.577", CurrentYear: "0.605" } }),
  };

  it("gives the sections in order, older periods first, leaving out omitted and empty ones, then the tables", () => {
    assert.deepEqual(edinetBenchMarkdown(record, "text", ["役員の状況"]), {
      value: [
        "# 例株式会社 有価証券報告書（2022-04-01〜2023-03-31）",
        "## 沿革",
        "２【沿革】1990年設立",
        "## 連結貸借対照表",
        "前期の表",
        "当期の表",
        "## 主要な経営指標等の推移",
        "| 科目 | 前期 | 当期 |\n| --- | ---: | ---: |\n| 自己資本比率 | 0.577 | 0.605 |",
        "## 貸借対照表（単位：円）",
        "| 科目 | 前期 | 当期 |\n| --- | ---: | ---: |\n| 流動資産 | 100 | 120 |\n| その他\\|注 |  | － |",
      ].join("\n\n") + "\n",
    });
  });

  it("names a field that is missing or malformed", () => {
    assert.deepEqual(problemsOf(edinetBenchMarkdown(record, "sections", [])), ['the record has no field "sections"']);
    assert.deepEqual(problemsOf(edinetBenchMarkdown({ ...record, text: "{" }, "text", [])), ['"text" is not JSON']);
    assert.deepEqual(problemsOf(edinetBenchMarkdown({ ...record, text: JSON.stringify({ 沿革: "本文" }) }, "text", [])), ['"text" is not a mapping of name -> period -> text']);
    assert.deepEqual(problemsOf(edinetBenchMarkdown({ ...record, bs: JSON.stringify({ 流動資産: { CurrentYear: 120 } }) }, "text", [])), ['"bs" is not a mapping of name -> period -> text']);
  });

  it("titles a record whose meta is missing or malformed plainly", () => {
    const plain = edinetBenchMarkdown({ text: JSON.stringify({}), meta: "{" }, "text", []);
    assert.deepEqual(plain, { value: "# 有価証券報告書\n" });
  });
});
