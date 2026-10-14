# Contributing

[日本語](CONTRIBUTING.ja.md)

Two kinds of contribution are welcome: a **document** (with its findings judged, or left as unjudged for someone
else), and a **verdict** on findings already listed.

## Adding a document

1. **Check the licence.** The document must be under a licence that lets it be redistributed (public domain, CC0,
   CC BY, CC BY-SA, a government open-data licence, MIT, Apache-2.0, …) — or, if it does not, you add only its
   `.yaml` and set `redistribute: false`. Never commit a text whose licence you have not read.
2. **Check it is human-written and holds no personal data.** No private person's name, email address or phone number.
   A published contact (a press office, a public hotline) may stay; add it to `allowlist.yaml` with the reason.
3. **Pick the language and genre.** `ja` or `en`; a genre from `npx chaff genres`.
4. **Add the files**: the text at `docs/<lang>/<genre>/<id>.md` (or `.txt` with `format: text` for plain text), and the
   `.yaml` beside it. The id is lowercase letters, digits and hyphens, unique in the repository. Keep the text as the
   source has it; converting HTML to Markdown is fine, rewriting is not. Under 2 MiB.
5. **Fill in the `.yaml`** (see the README): source URL and fetch date, licence name, the URL where it is stated, and in
   `license.note` the attribution the licence asks for. `sha256` is `shasum -a 256 <file>` (or `sha256sum`).
6. **Run** `yarn validate`, then `yarn run-corpus --update --only <id>`. This writes `expected/<id>.yaml` with every
   finding as `unjudged`.
7. **Judge what you can** (below), and open a pull request. The template asks for the checks above.

## Judging findings

Open `expected/<id>.yaml` beside the document and read each finding **in context** (the line, and the lines around it).

- `correct`: chaff is right; a careful editor would point at the same thing.
- `false-positive`: chaff is wrong here. Add a `note` that says why, in one line — the shape of the mistake ("a heading
  read as a sentence", "a defined term used before its definition, which the document allows") is what turns into a
  fix in chaff.
- Leave `unjudged` what you are not sure of. A partly judged document is fine.
- `missed`: something chaff should find and does not. Add an entry with `rule`, `line`, `what` and `verdict: missed`.

Do not change `text` or `line`: they are how the run finds the finding again.

A document is fully judged once no entry is `unjudged`. From then on a new finding on it fails CI until someone judges
it, so judge a whole document before relying on it.

## When chaff changes

A new chaffjs is a pull request that bumps the pinned version (`yarn add --exact chaffjs@<version>`). Its CI shows what
moved: correct findings lost (a regression to report in chaff), false positives gone and misses found (improvements),
and new findings to judge. `yarn run-corpus --update` adds the new findings as unjudged; verdicts are never changed by
the script.

To try an unreleased chaff, build it in a lab checkout (`yarn build` in `text/`) and run
`yarn run-corpus --chaff <path to lab>/text`.

## Code

`scripts/lib/` holds pure functions (matching, tallying, meta and expected-file schemas, the personal-data scan), each
tested in `test/test_*.ts` with `node:test`. Run `yarn typecheck` and `yarn test` before a pull request.
