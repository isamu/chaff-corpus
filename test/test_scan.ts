import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isCitation, parseAllowList, personalDataHits, unallowedHits } from "../scripts/lib/scan.ts";

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

  it("leaves a regulation citation alone: a dotted section number, or a number after a regulation's acronym", () => {
    assert.deepEqual(matches("as defined in DFAR 252.227-7014 and DFARS 252.227-7013(a)(16)"), []);
    assert.deepEqual(matches("the clause at 252.227-7015 applies"), []);
    assert.deepEqual(matches("see FAR 202-555-0143, 48 CFR § 252-227-7014 and 42 U.S.C. 300-555-1234"), []);
  });

  it("still finds a phone number beside a citation, after a label, or written with dots throughout", () => {
    assert.deepEqual(matches("DFARS 252.227-7014; questions to 202-555-0143"), ["phone:202-555-0143"]);
    assert.deepEqual(matches("TEL 073-489-5903 FAX 202-555-0143"), ["phone:073-489-5903", "phone:202-555-0143"]);
    assert.deepEqual(matches("Call 202.555.0143 or (202) 555-0143."), ["phone:202.555.0143", "phone:(202) 555-0143"]);
    assert.deepEqual(matches("FARM 202-555-0143"), ["phone:202-555-0143"]);
  });
});

describe("isCitation", () => {
  it("reads a dotted section number or a preceding acronym as a citation, and nothing else", () => {
    assert.equal(isCitation("252.227-7014", "252.227-7014", 0), true);
    assert.equal(isCitation("DFARS 202-555-0143", "202-555-0143", 6), true);
    assert.equal(isCitation("§ 202-555-0143", "202-555-0143", 2), true);
    assert.equal(isCitation("Call 202-555-0143", "202-555-0143", 5), false);
    assert.equal(isCitation("202.555.0143", "202.555.0143", 0), false);
    assert.equal(isCitation("", "", 0), false);
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
