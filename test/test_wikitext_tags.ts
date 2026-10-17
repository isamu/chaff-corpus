import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { wikitextToMarkdown } from "../scripts/lib/wikitext-markdown.ts";
import { isMarkupTag, withoutMarkupTags } from "../scripts/lib/wikitext-tags.ts";

describe("isMarkupTag", () => {
  it("is true for a known HTML or extension tag, opening, closing or self-closing, in any case", () => {
    ["<code>", "</code>", "<br>", "<br/>", "<br />", "<SPAN>", "<syntaxhighlight lang=\"bash\">", "<ref name=a />", "</nowiki>"].forEach((tag) => assert.equal(isMarkupTag(tag), true, tag));
  });

  it("is true for an unknown name that carries an attribute", () => {
    ["<widget class=\"x\">", "<foo data-x='1'>", "<bar id=a/>"].forEach((tag) => assert.equal(isMarkupTag(tag), true, tag));
  });

  it("is true for a closing tag only when its name was opened with an attribute", () => {
    assert.equal(isMarkupTag("</widget>", new Set(["widget"])), true);
    assert.equal(isMarkupTag("</widget>"), false);
    assert.equal(isMarkupTag("<widget>", new Set(["widget"])), false);
  });

  it("is false for angle-bracket text that is not a tag: a nick, an address, an unknown bare name", () => {
    ["<jinxer-wm>", "<Amir1>", "<samtar@deploy1002>", "<user name>", "<x y>", "</jinxer-wm>", "<>", "< code>", "<3 >"].forEach((tag) =>
      assert.equal(isMarkupTag(tag), false, tag),
    );
  });
});

describe("wikitextToMarkdown: angle-bracket text", () => {
  it("keeps an IRC nick and a user@host in the text", () => {
    assert.equal(wikitextToMarkdown("Amir said (<code><Amir1> we just had another one</code>)."), "Amir said (<Amir1> we just had another one).\n");
    assert.equal(wikitextToMarkdown("* 22:17 <samtar@deploy1002> Started scap"), "- 22:17 <samtar@deploy1002> Started scap\n");
    assert.equal(wikitextToMarkdown("<pre>\n<jinxer-wm> FIRING: alert\n</pre>"), "<jinxer-wm> FIRING: alert\n");
  });

  it("still strips real tags, with or without attributes", () => {
    assert.equal(wikitextToMarkdown('A <span style="color:red">red</span> <small>note</small> and <widget id=w>text</widget>.'), "A red note and text.\n");
  });
});

describe("withoutMarkupTags", () => {
  it("removes tags and the closing tag of an element that is a tag by its attribute", () => {
    assert.equal(withoutMarkupTags('<b>x</b> <widget id=w>y</widget>'), "x y");
  });

  it("leaves angle-bracket text that is not a tag, including a closer with no attributed opener", () => {
    assert.equal(withoutMarkupTags("<jinxer-wm> FIRING </jinxer-wm> <a@b>"), "<jinxer-wm> FIRING </jinxer-wm> <a@b>");
  });
});
