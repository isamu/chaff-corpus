import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { wikitextToMarkdown } from "../scripts/lib/wikitext-markdown.ts";
import { openDepth, splitOutside } from "../scripts/lib/wikitext-split.ts";
import { tableMarkdown, tableRanges } from "../scripts/lib/wikitext-table.ts";

describe("wikitextToMarkdown: tables", () => {
  it("keeps a table's caption and cells as a Markdown table, the first row as its header", () => {
    const source = ["== Scorecard ==", '{| class="wikitable"', "|+[[Scorecard|Engagement scorecard]]", "!Question", "!Answer", "|-", "|Were fewer than five people paged?", "|no", "|}", "After."].join("\n");
    assert.equal(
      wikitextToMarkdown(source),
      ["## Scorecard", "", "Engagement scorecard", "", "| Question | Answer |", "| --- | --- |", "| Were fewer than five people paged? | no |", "", "After.", ""].join("\n"),
    );
  });

  it("reads `||` and `!!` cells, drops a cell's attributes, and leaves an empty cell under one that spans rows", () => {
    const source = ["{|", "! !!Ages 0-5 !!Ages 12+", "|-", "!Day pass", '|rowspan=2|Free ||{{EUR|9}}', "|-", '!Week pass', '| style="color:red" | {{EUR|18}}', "|}"].join("\n");
    assert.equal(wikitextToMarkdown(source), ["|  | Ages 0-5 | Ages 12+ |", "| --- | --- | --- |", "| Day pass | Free | €9 |", "| Week pass |  | €18 |", ""].join("\n"));
  });

  it("joins a cell written over several lines, with a template that spans lines and list marks, into one cell", () => {
    const source = ["{|", "! No. !! Temple", "|-", "| 1 || ", "* {{listing | type=temple", "| name=Ryozenji", "| content=", "}}", " || first", "|}"].join("\n");
    assert.equal(wikitextToMarkdown(source), ["| No. | Temple |  |", "| --- | --- | --- |", "| 1 | Ryozenji | first |", ""].join("\n"));
  });

  it("repeats a cell that spans columns as empty cells after it, and escapes a `|` in a cell", () => {
    const source = ["{|", "!A!!B!!C", "|-", '! colspan="2" |Total', "|{{code|a{{!}}b}}", "|-", "|x || y || [[Page|label]]", "|}"].join("\n");
    assert.equal(wikitextToMarkdown(source), ["| A | B | C |", "| --- | --- | --- |", "| Total |  | ab |", "| x | y | label |", ""].join("\n"));
  });

  it("keeps a table's text but not a table with no cells, and does not let a table eat the text after it", () => {
    assert.equal(wikitextToMarkdown(["Before.", "{|", "|-", "|}", "After."].join("\n")), "Before.\n\nAfter.\n");
    assert.equal(wikitextToMarkdown(["{|", "|a", "|}", "Plain line."].join("\n")), "| a |\n| --- |\n\nPlain line.\n");
  });

  it("flattens a table inside a cell into the cell's text", () => {
    const source = ["{|", "|outer", "{|", "|inner || cell", "|}", "|}"].join("\n");
    assert.equal(wikitextToMarkdown(source), "| outer inner cell |\n| --- |\n");
  });

  it("drops a table inside a template that is itself dropped", () => {
    assert.equal(wikitextToMarkdown(["Text.", "{{Infobox", "| data =", "{|", "|cell", "|}", "}}"].join("\n")), "Text.\n");
  });
});

describe("wikitextToMarkdown: links", () => {
  it("keeps a link's label, or its target when it has none", () => {
    assert.equal(wikitextToMarkdown("See [[Incident Scorecard|the scorecard]] and [[Runbook]]."), "See the scorecard and Runbook.\n");
  });

  it("keeps an external link's label, and drops a bare external link", () => {
    assert.equal(wikitextToMarkdown("[https://sal.toolforge.org/production SAL log] and [https://example.org] here."), "SAL log and here.\n");
  });

  it("drops a file or category link", () => {
    assert.equal(wikitextToMarkdown("A [[File:Chart.png|thumb|Chart]] graph.[[Category:Incidents]]"), "A graph.\n");
  });
});

describe("wikitextToMarkdown: templates the converter does not know", () => {
  it("keeps the one value of a template written inside a line of text", () => {
    assert.equal(wikitextToMarkdown("* Patch {{gerrit|869169}} merged {{done}}\n* {{phab|T325739}} Fix the cookbook"), "- Patch 869169 merged\n- T325739 Fix the cookbook\n");
    assert.equal(wikitextToMarkdown("a Perl script, {{code|Markdown.pl}}, which"), "a Perl script, Markdown.pl, which\n");
  });

  it("drops a template that stands on a line of its own, even with one value", () => {
    assert.equal(wikitextToMarkdown("Text.\n{{related|Chicago}}\n  {{IsPartOf|Shizuoka}}  \nMore."), "Text.\n\nMore.\n");
  });

  it("drops an infobox or other template written over several lines", () => {
    assert.equal(wikitextToMarkdown("{{Incident scorecard\n| task = T1\n| impact = outage\n}}\n\nThe database was overloaded."), "The database was overloaded.\n");
    assert.equal(wikitextToMarkdown("Text {{box|\nline}} after."), "Text after.\n");
  });

  it("drops a template with named or several values, whose last value is not reliably text", () => {
    assert.equal(wikitextToMarkdown("Knokke, Station {{rint|be|rail}} and more"), "Knokke, Station and more\n");
    assert.equal(wikitextToMarkdown("Released {{start date and age|2004|03|09}} as"), "Released as\n");
    assert.equal(wikitextToMarkdown("A {{small|x|size=2}} b"), "A b\n");
  });

  it("drops references, footnotes and navigation templates even inside a line", () => {
    assert.equal(wikitextToMarkdown("text/markdown{{Ref RFC|7763}} and {{efn|a note}} then {{see also|Zeebrugge}} end"), "text/markdown and then end\n");
    assert.equal(wikitextToMarkdown("Grutatext{{r|grutatext}}, and EtText"), "Grutatext, and EtText\n");
  });

  it("keeps a nested unknown template's value inside a known template's value", () => {
    assert.equal(wikitextToMarkdown("Price {{EUR|{{formatnum|1200}}}} only"), "Price €1200 only\n");
  });
});

describe("splitOutside", () => {
  it("splits at the separator outside templates and links", () => {
    assert.deepEqual(splitOutside("a||{{x|y||z}}||[[p|q]]", "||"), ["a", "{{x|y||z}}", "[[p|q]]"]);
    assert.deepEqual(splitOutside("name|a=[[b|c]]|d", "|"), ["name", "a=[[b|c]]", "d"]);
  });

  it("gives the text whole when the separator is absent, and empty parts around separators at its edges", () => {
    assert.deepEqual(splitOutside("plain", "||"), ["plain"]);
    assert.deepEqual(splitOutside("", "|"), [""]);
    assert.deepEqual(splitOutside("||a||", "||"), ["", "a", ""]);
  });
});

describe("openDepth", () => {
  it("counts templates and links left open, and is 0 when they are closed or the text has none", () => {
    assert.equal(openDepth("* {{listing | type=temple"), 1);
    assert.equal(openDepth("{{a|[[b"), 2);
    assert.equal(openDepth("{{a}} [[b]]"), 0);
    assert.equal(openDepth("a { single [ bracket"), 0);
    assert.equal(openDepth("}}"), -1);
  });
});

describe("tableRanges and tableMarkdown", () => {
  it("finds each top-level table, nested ones inside it, and one that never closes", () => {
    assert.deepEqual(tableRanges(["x", "{|", "{|", "|}", "|}", "y", "{|", "|a"]), [
      { start: 1, end: 4 },
      { start: 6, end: 7 },
    ]);
    assert.deepEqual(tableRanges(["no table", "|} stray"]), []);
  });

  it("renders an unclosed table's last line as a cell", () => {
    assert.deepEqual(tableMarkdown(["{|", "|a", "|b"], (text) => text), ["| a | b |", "| --- | --- |"]);
  });

  it("gives nothing for a table without cells or caption", () => {
    assert.deepEqual(tableMarkdown(["{|", "|}"], (text) => text), []);
  });
});
