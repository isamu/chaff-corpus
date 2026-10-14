import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAllowList, personalDataHits, unallowedHits } from "../scripts/lib/scan.ts";

const matches = (text: string): string[] => personalDataHits(text).map((hit) => `${hit.kind}:${hit.match}`);

describe("personalDataHits", () => {
  it("finds email addresses", () => {
    assert.deepEqual(matches("Write to jane.doe+news@example.co.uk today."), ["email:jane.doe+news@example.co.uk"]);
  });

  it("finds Japanese phone numbers, also in full-width digits", () => {
    assert.deepEqual(matches("電話 03-1234-5678 まで"), ["phone:03-1234-5678"]);
    assert.deepEqual(matches("フリーダイヤル ０１２０－１２３－４５６"), ["phone:0120-123-456"]);
  });

  it("finds international and North American numbers", () => {
    assert.deepEqual(matches("Call +44 20 7946 0958."), ["phone:+44 20 7946 0958"]);
    assert.deepEqual(matches("Call (202) 555-0143 or 202-555-0143."), ["phone:(202) 555-0143", "phone:202-555-0143"]);
  });

  it("gives a string once per line, however many patterns or times it matches", () => {
    assert.deepEqual(matches("TEL 073-489-5903, 073-489-5903"), ["phone:073-489-5903"]);
    assert.deepEqual(matches("a@b.org\na@b.org"), ["email:a@b.org", "email:a@b.org"]);
  });

  it("gives the line of each hit", () => {
    assert.deepEqual(
      personalDataHits("a\nb a@b.org\n").map((hit) => hit.line),
      [2],
    );
  });

  it("leaves dates, article numbers, versions and plain numbers alone", () => {
    assert.deepEqual(matches("2026-10-14, 第12条, version 1.2.3, 1,234,567 yen, ISBN 978-4-00-000000-0, @handle"), []);
    assert.deepEqual(matches(""), []);
  });
});

describe("allow-list", () => {
  it("lets a hit through only for the document the entry names", () => {
    const hits = personalDataHits("press@agency.gov");
    const allowed = [{ id: "release", match: "press@agency.gov", reason: "the agency's published press contact" }];
    assert.deepEqual(unallowedHits("release", hits, allowed), []);
    assert.equal(unallowedHits("other", hits, allowed).length, 1);
  });

  it("reads a list of entries, and an empty file as none", () => {
    assert.deepEqual(parseAllowList(null), { value: [] });
    const parsed = parseAllowList([{ id: "a", match: "x@y.org", reason: "public" }]);
    assert.ok("value" in parsed);
    assert.equal(parsed.value.length, 1);
  });

  it("requires a reason, and a list", () => {
    assert.deepEqual(parseAllowList([{ id: "a", match: "x@y.org" }]), { problems: ["entry 0 (x@y.org): a reason is required"] });
    assert.deepEqual(parseAllowList({ id: "a" }), { problems: ["allowlist.yaml must be a list"] });
    assert.deepEqual(parseAllowList(["x"]), { problems: ["entry 0: must be a mapping"] });
  });
});
