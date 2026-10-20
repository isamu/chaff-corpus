import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeFetched } from "../scripts/lib/html/fetched-text.ts";
import { convertedText, isSourceFormat, SOURCE_FORMATS } from "../scripts/lib/source-format.ts";

const meeting = (speeches: readonly { readonly speaker: string; readonly speech: string }[]): string =>
  JSON.stringify({
    meetingRecord: [{ session: 217, nameOfHouse: "参議院", nameOfMeeting: "消費者問題に関する特別委員会", issue: "第7号", date: "2025-05-23", speechRecord: speeches }],
  });

describe("isSourceFormat", () => {
  it("accepts lab's names for a source that is converted", () => {
    assert.deepEqual(SOURCE_FORMATS.filter(isSourceFormat), ["wikitext", "html", "google-patents", "kokkai"]);
  });

  it("rejects anything else", () => {
    [undefined, null, "", "markdown", "text", "HTML", "gutenberg", 1, {}].forEach((value) => assert.equal(isSourceFormat(value), false));
  });
});

describe("convertedText", () => {
  it("keeps a source without a format as fetched", () => {
    assert.equal(convertedText(undefined, "<p>as is</p>\n"), "<p>as is</p>\n");
    assert.equal(convertedText(undefined, ""), "");
  });

  it("converts HTML to Markdown, with character references read", () => {
    assert.equal(convertedText("html", "<html><body><main><h1>Terms</h1><p>Fees &amp; charges apply.</p></main></body></html>"), "# Terms\n\nFees & charges apply.\n");
  });

  it("keeps a numbered heading whose first subsection follows it with the same tag, and drops an empty unnumbered one", () => {
    const page = (body: string): string => `<html><body><main>${body}</main></body></html>`;
    assert.equal(convertedText("html", page("<h4>3. 結果</h4><h4>3.1 データ</h4><p>本文。</p>")), "#### 3. 結果\n\n#### 3.1 データ\n\n本文。\n");
    assert.equal(convertedText("html", page("<h4>Editorial Notes</h4><h4>Codification</h4><p>Text.</p>")), "#### Codification\n\nText.\n");
  });

  it("keeps a prose table's header row, and a list of words set as a table, but not a list of links", () => {
    const page = (body: string): string => `<html><body><main>${body}<p>End.</p></main></body></html>`;
    const glossary = "<table><tr><th>Term</th><th>Definition</th></tr><tr><td>Alt text</td><td>A short description of an image.</td></tr></table>";
    assert.equal(convertedText("html", page(glossary)), "Term\n\nDefinition\n\nAlt text\n\nA short description of an image.\n\nEnd.\n");
    const words = "<table><tr><td>翻刻</td></tr><tr><td>タグ付け</td></tr><tr><td>翻訳</td></tr></table>";
    assert.equal(convertedText("html", page(words)), "翻刻\n\nタグ付け\n\n翻訳\n\nEnd.\n");
    const links = "<table><tr><td><a href='/a'>A</a></td></tr><tr><td><a href='/b'>B</a></td></tr><tr><td><a href='/c'>C</a></td></tr></table>";
    assert.equal(convertedText("html", page(links)), "End.\n");
  });

  it("keeps where a section links in one comment closing it, without changing the text", () => {
    const page = "<html><body><main><h2>Fees</h2><p>See <a href='https://example.org/fees'>the fee table</a> and <a href='/local'>the form</a>.</p><h2>Contact</h2><p>Write to us.</p></main></body></html>";
    assert.equal(convertedText("html", page), "## Fees\n\nSee the fee table and the form.\n\n<!-- https://example.org/fees -->\n\n## Contact\n\nWrite to us.\n");
  });

  it("keeps an accordion panel's title, drawn as links within the page, as a heading", () => {
    // The panel markup of an NPS article (Stewardship in Recreation, a US Government work): an icon link and a title link.
    const panel =
      '<div class="panel"><div class="panel-heading" role="tab"><h4 class="panel-title">' +
      '<a aria-hidden="true" data-toggle="collapse" href="#collapse1" role="button"><span class="glyphicon"> </span></a> ' +
      '<a data-toggle="collapse" href="#collapse1" role="button">Principle #1 – Plan Ahead and Prepare</a></h4></div>' +
      '<div class="panel-collapse collapse" id="collapse1" role="tabpanel"><div class="panel-body"><ul><li>Repackage food to minimize waste.</li></ul></div></div></div>';
    const page = `<html><body><main><h3>Leave No Trace</h3><p>Practice the seven principles.</p>${panel}</main></body></html>`;
    assert.equal(
      convertedText("html", page),
      "### Leave No Trace\n\nPractice the seven principles.\n\n#### Principle #1 – Plan Ahead and Prepare\n\n- Repackage food to minimize waste.\n",
    );
  });

  it("drops a hidden box a script fills in, and keeps a hidden answer with words of its own", () => {
    const widget = "<div style='display:none'><h2>You Might Also Like</h2><ul class='results'></ul><script>fill()</script></div>";
    const page = (body: string): string => `<html><body><main><h2>Article</h2><p>The park opens in May.</p>${body}<p>Last updated: May 1.</p></main></body></html>`;
    assert.equal(convertedText("html", page(widget)), "## Article\n\nThe park opens in May.\n\nLast updated: May 1.\n");
    const answer = "<div style='display:none'><p>Any resident may apply.</p></div>";
    assert.equal(convertedText("html", page(answer)), "## Article\n\nThe park opens in May.\n\nAny resident may apply.\n\nLast updated: May 1.\n");
  });

  it("converts wikitext to Markdown, keeping a link's text and dropping a template", () => {
    assert.equal(convertedText("wikitext", "== Getting in ==\nTake the [[Izu Kyuko Line|train]] from Ito.{{citation needed}}\n"), "## Getting in\nTake the train from Ito.\n");
  });

  it("converts a Diet meeting to its speeches, without the roster", () => {
    const json = meeting([
      { speaker: "会議録情報", speech: "出席者　委員長" },
      { speaker: "委員長", speech: "○委員長　ただいまから会議を開きます。\n────────\n　本日の議題に入ります。" },
    ]);
    assert.equal(convertedText("kokkai", json), "# 第217回国会 参議院 消費者問題に関する特別委員会 第7号（2025-05-23）\n\n○委員長　ただいまから会議を開きます。\n\n本日の議題に入ります。\n");
  });

  it("keeps only a patent's own sections", () => {
    const page = '<html><body><nav>Similar documents</nav><section itemprop="abstract"><p>An umbrella for sun and rain.</p></section></body></html>';
    assert.equal(convertedText("google-patents", page), "An umbrella for sun and rain.\n");
  });

  it("throws on a response that is not what the format says, rather than give an empty document", () => {
    assert.throws(() => convertedText("kokkai", meeting([]).replace("meetingRecord", "other")), /no meetingRecord/);
    assert.throws(() => convertedText("kokkai", "not json"), SyntaxError);
    assert.throws(() => convertedText("google-patents", "<html><body><p>Not found</p></body></html>"), /no abstract, description or claims section/);
  });
});

describe("decodeFetched", () => {
  const SHIFT_JIS_TOKYO = new Uint8Array([0x93, 0x8c, 0x8b, 0x9e]);

  it("reads a body in the encoding it declares, in the header or in a <meta charset>", () => {
    assert.equal(decodeFetched(SHIFT_JIS_TOKYO, "text/html; charset=Shift_JIS"), "東京");
    const head = new TextEncoder().encode('<meta charset="shift_jis">');
    assert.equal(decodeFetched(new Uint8Array([...head, ...SHIFT_JIS_TOKYO]), "text/html"), '<meta charset="shift_jis">東京');
  });

  it("reads UTF-8 when nothing is declared, a label is unknown, or a non-markup body quotes a <meta>", () => {
    const utf8 = new TextEncoder().encode("東京");
    assert.equal(decodeFetched(utf8, null), "東京");
    assert.equal(decodeFetched(utf8, "text/html; charset=no-such-label"), "東京");
    const quoted = new TextEncoder().encode('`<meta charset="shift_jis">` 東京');
    assert.equal(decodeFetched(quoted, "text/markdown"), '`<meta charset="shift_jis">` 東京');
  });
});
