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
scripts/                        the scripts behind the yarn commands; scripts/lib/ holds the pure functions they use
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
  format: html              # optional: what source.url serves when it is not the text itself
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
"Not run" with the reason. When `source.url` serves something other than the text, `source.format` names the conversion
that produced the judged text from it (isamu/lab's names: `wikitext`, `html`, `google-patents`, `kokkai`); the run
converts the fetched source the same way before comparing the sha256.

### A record of a Hugging Face dataset: `source.hf`

When the text is one record of a dataset on Hugging Face, `source.hf` says which record, and `source.url` is where a
reader sees the document (the filing, the dataset page). `source.hf` cannot be set together with `source.format`.

```yaml
source:
  url: https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100SXUQ,,
  fetched: 2026-10-15
  hf:
    dataset: numad/yuho-text-2024                         # <owner>/<name>
    config: default
    split: train
    offset: 98                                            # the row in the split, or the line in file; from 0
    field: text                                           # the field that holds the text
    revision: 2993206922ead839ce003e2faa65cd5d2ff07607    # the dataset's 40-digit commit sha when the text was taken
    file: yuho-202402.jsonl                               # optional: a JSONL data file of the dataset at revision
```

| field | |
| --- | --- |
| `dataset`, `config`, `split` | which dataset and which of its splits; all required |
| `offset` | a whole number from 0: the row in the split, or, with `file`, the line in that file |
| `field` | the record's field that is the text; with `render`, the field the renderer reads |
| `revision` | required: the commit sha of the dataset the text was taken at |
| `file` | optional: a `.jsonl` path in the dataset. The record is then read from `https://huggingface.co/datasets/<dataset>/resolve/<revision>/<file>`, so it is pinned to `revision` |
| `render` | optional: render the whole record instead of taking `field` as it is. The one renderer is `edinet-bench` (a SakanaAI/EDINET-Bench record as Markdown: title, the sections in `field`, then the summary and the financial statements as tables) |
| `omit` | optional, only with `render`: the parts the renderer leaves out, such as sections that name people |

Without `file`, the record is read from the datasets-server rows API
(`https://datasets-server.huggingface.co/rows?dataset=…&config=…&split=…&offset=…&length=1`), which serves only the
dataset's latest commit. `revision` is recorded but cannot be enforced, so give `file` whenever the dataset has JSONL
files. A data file whose `Content-Length` is over 64 MiB is not read.

The record is fetched only when the document has no committed text (`redistribute: false`), at run time or by
`yarn judge`, and is used only when its sha256 matches. When it does not match, "Not run" gives the reason: the record
at that file and line, or at that row (with a note that the rows API serves the latest commit, not `revision`). For a
document whose text is committed, `source.hf` records where it came from: `yarn validate` checks its fields, and the
sha256 is of the committed file.

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

On a document with `redistribute: false`, an entry quotes nothing: in place of `text` it keeps `sha256:` (the sha256 of
the text at the finding's position), and it has no `message`. `--update` writes such entries, the run matches a finding by
the hash of its text, the report shows only `id:line` and the rule, and `yarn validate` rejects a `text` or `message` in
that document's expected file. Judge one by running chaff on your own copy of the text and reading the finding there.

## Running it

Node 24 and Yarn 1.

```sh
yarn install
yarn validate                 # metadata, licence, personal data, size
yarn typecheck && yarn test
yarn run-corpus               # run chaff, compare with expected/, print the report
yarn run-corpus --update      # add new findings to expected/ as unjudged (verdicts are never touched)
yarn run-corpus --resolve     # --update, and settle what the run decides: a gone false positive is removed, a found
                              # miss becomes correct ("found by chaffjs <version>" added to its note), a lost correct
                              # finding stays; prints the resolved/found/regressed list (--resolve-out <file> saves it)
yarn run-corpus --chaff ../lab/text   # run a local chaff (a lab checkout after `yarn build`) instead of the pinned one
yarn run-corpus --only q3-report,rouki --jobs 2 --offline
```

The pinned chaffjs is the exact version in `package.json`. chaff runs each document as a user would: the command line,
with the document's genre (`--genre`), the experimental rules on, and its language given in a `chaff.yaml`.

## Following chaff releases

The `follow-release` workflow runs daily (and by workflow_dispatch). When npm's latest `chaffjs` is newer than the pin
and neither the branch `chore/chaffjs-<version>` nor a pull request from it exists, it bumps the pin
(`yarn add chaffjs@<version> --exact`), runs `yarn run-corpus --resolve`, and opens a pull request whose body lists what
was resolved (false positives gone), found (misses now given, marked correct) and regressed (correct findings lost).

A pull request opened with the workflow's token starts no other workflow, so `check` does not run on it by itself. The
job runs validate, typecheck, test and the corpus on the bumped commit and puts the results in the body. To get `check`
on the pull request, a maintainer runs `check` from the Actions tab on that branch, or pushes an empty commit to it.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). In short: add the text and its `.yaml`, run `yarn validate` and
`yarn run-corpus --update`, judge what you can, and open a pull request.

If chaff got a document wrong, a wrong finding or one it should give and does not, send it as a case: see
[Report a case where chaff is wrong](CONTRIBUTING.md#report-a-case-where-chaff-is-wrong). CI accepts it as an open case,
isamu/lab tracks it in an issue labelled `corpus-case`, and a chaff release that fixes it settles it here.

## Licences

The code in this repository is under the [MIT License](LICENSE). Each document keeps its own licence, named in its
`.yaml`; the MIT License does not apply to the documents.
