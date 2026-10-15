import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseMeta, sha256Of, type MetaPlace } from "../scripts/lib/meta.ts";

const GENRES = new Set(["business/report", "legal/statute"]);
const TEXT = "# Report\n\nThe quarter closed.\n";
const PLACE: MetaPlace = { language: "en", genre: "business/report", id: "q3-report" };

const valid = (): Record<string, unknown> => ({
  id: "q3-report",
  title: "Q3 report",
  language: "en",
  genre: "business/report",
  source: { url: "https://example.gov/q3", fetched: "2026-10-14" },
  license: { name: "Public domain", url: "https://example.gov/policy" },
  redistribute: true,
  sha256: sha256Of(TEXT),
});

const problemsOf = (raw: unknown, text: string | undefined, place: MetaPlace = PLACE): readonly string[] => {
  const parsed = parseMeta(raw, place, GENRES, text);
  return "problems" in parsed ? parsed.problems : [];
};

describe("parseMeta", () => {
  it("accepts a complete meta with its text, markdown by default", () => {
    const parsed = parseMeta(valid(), PLACE, GENRES, TEXT);
    assert.ok("value" in parsed);
    assert.equal(parsed.value.format, "markdown");
    assert.equal(parsed.value.license.url, "https://example.gov/policy");
  });

  it("accepts a document that may not be redistributed, without its text", () => {
    assert.deepEqual(problemsOf({ ...valid(), redistribute: false }, undefined), []);
  });

  it("accepts a source.format lab converted the source from, and keeps it", () => {
    const parsed = parseMeta({ ...valid(), redistribute: false, source: { url: "https://example.gov/q3", fetched: "2026-10-14", format: "html" } }, PLACE, GENRES, undefined);
    assert.ok("value" in parsed);
    assert.equal(parsed.value.source.format, "html");
    const plain = parseMeta(valid(), PLACE, GENRES, TEXT);
    assert.ok("value" in plain);
    assert.equal(plain.value.source.format, undefined);
  });

  it("rejects a source.format lab has no conversion for", () => {
    ["markdown", "HTML", "pdf", 1].forEach((format) => {
      assert.match(problemsOf({ ...valid(), source: { url: "https://example.gov/q3", fetched: "2026-10-14", format } }, TEXT).join("\n"), /source.format must be one of wikitext, html, google-patents, kokkai/);
    });
  });

  it("accepts a source.hf record address and keeps it", () => {
    const hf = { dataset: "numad/yuho-text-2024", config: "default", split: "train", offset: 3, field: "text", revision: "2993206922ead839ce003e2faa65cd5d2ff07607", file: "yuho-202401.jsonl" };
    const parsed = parseMeta({ ...valid(), source: { url: "https://huggingface.co/datasets/numad/yuho-text-2024", fetched: "2026-10-15", hf } }, PLACE, GENRES, TEXT);
    assert.ok("value" in parsed);
    assert.deepEqual(parsed.value.source.hf, hf);
  });

  it("rejects a source.hf that is incomplete, and one beside a source.format", () => {
    const source = { url: "https://huggingface.co/datasets/numad/yuho-text-2024", fetched: "2026-10-15" };
    assert.deepEqual(problemsOf({ ...valid(), source: { ...source, hf: { dataset: "numad/yuho-text-2024", config: "default", split: "train", offset: 3, field: "text", revision: "main" } } }, TEXT), [
      "source.hf.revision must be the dataset's 40-digit commit sha",
    ]);
    assert.deepEqual(problemsOf({ ...valid(), source: { ...source, hf: [] } }, TEXT), ["source.hf must be a mapping (dataset, config, split, offset, field, revision)"]);
    assert.deepEqual(problemsOf({ ...valid(), source: { ...source, format: "html", hf: {} } }, TEXT), ["source.format and source.hf cannot both be set (source.hf.render renders a record)"]);
  });

  it("accepts license unknown without a url, for a person to establish", () => {
    assert.deepEqual(problemsOf({ ...valid(), license: { name: "unknown" } }, TEXT), []);
  });

  it("requires a licence, with where it is stated", () => {
    assert.deepEqual(problemsOf({ ...valid(), license: undefined }, TEXT), ["license.name is required"]);
    assert.deepEqual(problemsOf({ ...valid(), license: { name: "CC-BY-4.0" } }, TEXT), ["license.url (where the licence is stated) is required"]);
  });

  it("rejects a genre chaff does not know, and a folder that disagrees", () => {
    assert.match(problemsOf({ ...valid(), genre: "business/memo" }, TEXT).join("\n"), /not a genre chaff knows/);
    assert.match(problemsOf(valid(), TEXT, { ...PLACE, genre: "legal/statute" }).join("\n"), /genre must match the folder/);
  });

  it("rejects a language other than ja and en, and one that disagrees with the folder", () => {
    assert.match(problemsOf({ ...valid(), language: "fr" }, TEXT).join("\n"), /language must be one of ja, en/);
    assert.match(problemsOf(valid(), TEXT, { ...PLACE, language: "ja" }).join("\n"), /language must match the folder/);
  });

  it("rejects a sha256 that does not match, a missing text, and a committed text that may not be redistributed", () => {
    assert.deepEqual(problemsOf(valid(), `${TEXT}more\n`), ["sha256 does not match the text"]);
    assert.deepEqual(problemsOf(valid(), undefined), ["the text file is missing (redistribute: true)"]);
    assert.deepEqual(problemsOf({ ...valid(), redistribute: false }, TEXT), ["a document with redistribute: false must not commit its text"]);
    assert.deepEqual(problemsOf({ ...valid(), sha256: "ABC" }, TEXT), ["sha256 must be 64 lowercase hex digits"]);
  });

  it("rejects a bad source, id or format", () => {
    assert.match(problemsOf({ ...valid(), source: { url: "ftp://x", fetched: "14 Oct" } }, TEXT).join("\n"), /source\.url.*\n.*source\.fetched/);
    assert.match(problemsOf({ ...valid(), id: "other" }, TEXT).join("\n"), /id must be "q3-report"/);
    assert.match(problemsOf({ ...valid(), format: "html" }, TEXT).join("\n"), /format must be one of markdown, text/);
  });

  it("rejects what is not a mapping", () => {
    assert.deepEqual(problemsOf(null, TEXT), ["the file must be a mapping"]);
    assert.deepEqual(problemsOf(["id"], TEXT), ["the file must be a mapping"]);
  });
});
