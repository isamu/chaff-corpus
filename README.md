# chaff-corpus

[日本語](README.ja.md)

Real documents with judged [chaff](https://isamu.github.io/lab/en/) findings, run by CI.

chaff (npm [`chaffjs`](https://www.npmjs.com/package/chaffjs)) checks business documents in Japanese and English
deterministically. This repository holds real documents and, for each one, a judgement of every finding chaff gives on
it: correct, a false positive, or a finding chaff should give and does not. CI runs chaff over all of them and reports
precision and misses per rule and per genre.

The repository **reports**; it never blocks chaff's own pull requests. Its own CI fails only when a finding judged
correct disappears, when a fully judged document gets a new finding, or when a document's metadata is invalid.

## Layout

```
docs/<lang>/<genre>/<id>.md     the text (or <id>.txt for plain text, read by chaff as text)
docs/<lang>/<genre>/<id>.yaml   what the document is: source, licence, language, genre, sha256 of the text
expected/<id>.yaml              every finding chaff gives on it, each with a verdict
allowlist.yaml                  published contact addresses and numbers that may stay in a text
scripts/                        validate.ts, run.ts and the pure functions they use
```

`<genre>` is a chaff genre such as `business/report` or `legal/statute` (`npx chaff genres` lists them).

### The document's `.yaml`

```yaml
id: q3-report
title: Quarterly report, Q3
language: en                # ja | en
genre: business/report      # a genre chaff knows
format: markdown            # markdown (<id>.md, the default) | text (<id>.txt)
source:
  url: https://example.gov/reports/q3
  fetched: 2026-10-14
license:
  name: CC-BY-4.0
  url: https://creativecommons.org/licenses/by/4.0/   # where the licence is stated
  note: "© Example Agency; converted to Markdown"     # attribution and anything else the licence asks for
redistribute: true          # false: only this file is committed; the text is fetched at run time
sha256: 3f5a…               # of the text, as chaff reads it
notes: optional free text
```

A document whose licence does not allow redistribution has only its `.yaml`. At run time its text is fetched from
`source.url` into the git-ignored `.cache/` and used only when its sha256 matches; otherwise the report lists it under
"Not run" with the reason. (A text that was converted to Markdown when it was judged cannot be fetched as it is: put the
converted text in `.cache/<id>.md` by hand.)

### `expected/<id>.yaml` and verdicts

```yaml
id: q3-report
chaff: 0.33.0               # the chaffjs version the file was first written against
findings:
  - rule: cliche
    line: 35
    text: Discussing these expectations explicitly   # the document's text at the finding's position
    message: '"on the same page" is a cliché'
    verdict: correct
  - rule: undefined-acronym
    line: 18
    text: TTS._
    verdict: false-positive
    note: TTS is expanded in the page's footer, which chaff does not see
  - rule: numbering-gap
    line: 40
    what: section 4 is followed by section 6
    verdict: missed
```

| verdict | meaning | when the run changes it |
| --- | --- | --- |
| `correct` | the finding is right and must stay | gone: **CI fails** (a regression) |
| `false-positive` | the finding is wrong and should go | gone: reported as an improvement; still there: listed as work |
| `missed` | a finding chaff should give and does not (`rule`, `line`, `what`) | that rule on that line appears: reported as found |
| `unjudged` | nobody has judged it yet | listed as "to judge" |

A finding is the same finding when its rule, line and text are the same. A document is **fully judged** when its file
has no `unjudged` entry; a new finding there makes CI fail, because someone has to judge it.

## Running it

Node 24 and Yarn 1.

```sh
yarn install
yarn validate                 # metadata, licence, personal data, size
yarn typecheck && yarn test
yarn run-corpus               # run chaff, compare with expected/, print the report
yarn run-corpus --update      # add new findings to expected/ as unjudged (verdicts are never touched)
yarn run-corpus --chaff ../lab/text   # run a local chaff (a lab checkout after `yarn build`) instead of the pinned one
yarn run-corpus --only q3-report,rouki --jobs 2 --offline
```

The pinned chaffjs is the exact version in `package.json`. chaff runs each document as a user would: the command line,
with the document's genre (`--genre`), the experimental rules on, and its language given in a `chaff.yaml`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). In short: add the text and its `.yaml`, run `yarn validate` and
`yarn run-corpus --update`, judge what you can, and open a pull request.

## Licences

The code in this repository is under the [MIT License](LICENSE). Each document keeps its own licence, named in its
`.yaml`; the MIT License does not apply to the documents.
