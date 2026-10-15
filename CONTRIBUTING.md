# Contributing

[日本語](CONTRIBUTING.ja.md)

Three kinds of contribution are welcome: a **case** where chaff got a document wrong, a **document** (with its findings
judged, or left as unjudged for someone else), and a **verdict** on findings already listed.

## Report a case where chaff is wrong

When chaff gives a wrong finding on a document, or does not give one it should, send the document here as a **case**.
A case is a document you may share plus its expected file, in which the wrong finding is marked `false-positive` and the
missing one is marked `missed`. A case is the most useful report chaff can get: the fix in chaff is made against your
text, and the case stays here, so the same mistake cannot come back unnoticed.

1. **Make sure you may share the text.** The licence rules of [Adding a document](#adding-a-document) apply: the text
   must be under a licence that allows redistribution, or, when it is public but may not be copied, you commit only its
   `.yaml` with `redistribute: false`. A text you wrote yourself is fine when you put it under a licence such as CC0 or
   CC BY 4.0 and name it in the `.yaml`. A confidential document cannot be a case, nor can an excerpt of it: write a
   short text of your own that shows the same mistake instead.
2. **Make sure it holds no personal data**: no private person's name, email address or phone number. `yarn validate`
   scans for email addresses and phone numbers; it cannot see names, so check those yourself.
3. **Add the document** as in steps 3 to 5 of [Adding a document](#adding-a-document): the text at
   `docs/<lang>/<genre>/<id>.md`, its `.yaml` beside it, and the text's `sha256`.
4. **Get chaff's findings.** Run `yarn validate`, then

   ```sh
   yarn run-corpus --update --only <id>
   ```

   This writes `expected/<id>.yaml` with every finding chaff gives, each one `unjudged`. The corpus runs the chaffjs
   pinned in `package.json`, with the document's genre and the experimental rules on, so its findings can differ from
   your own run of chaff. What the corpus finds is what the case is judged against.
5. **Mark the wrong finding**: change its `verdict` to `false-positive` and add a one-line `note` saying why. Leave
   `rule`, `line` and `text` as they are; they are how the run finds the finding again.
6. **Add the missing finding**: a new entry with `rule`, `line`, `what` and `verdict: missed` (and a `note` if it
   helps). `rule` is the chaff rule that should report it (`npx chaff rules` lists them, `npx chaff explain <rule>` says
   what one is for), and `line` is the line in the document file. The miss counts as found when that rule gives a
   finding on that line.
7. **Judge the rest if you can** (see [Judging findings](#judging-findings)) and leave the others `unjudged`. Then open
   a pull request; the template has a checklist for a case.

For example, in `expected/lease-notice.yaml` (the entries `--update` wrote also carry a `message`, which you keep):

```yaml
id: lease-notice
chaff: 0.34.0
findings:
  - rule: undefined-acronym
    line: 12
    text: HVAC
    verdict: false-positive
    note: HVAC is spelled out in the table above, which chaff does not connect to this line
  - rule: numbering-gap
    line: 40
    what: clause 4 is followed by clause 6
    verdict: missed
```

### What happens next

- **CI accepts the case.** `false-positive` and `missed` entries are open cases: the report lists them as work, and
  they do not fail the build. `check` fails only when a `correct` finding is lost, when a document with no `unjudged`
  entry gets a new finding, or when the metadata is invalid. If you change the text after running `--update`, run it
  again.
- **The pull request also shows lab's main**: a second, report-only run against chaff as it is on
  isamu/lab's main says whether the case is already fixed there but not yet released.
- **A lab issue is opened for it.** Once the case is on main here, isamu/lab's daily sync opens one issue per document
  with open cases, labelled `corpus-case`, and keeps it up to date. A lab pull request that fixes chaff
  is run against this corpus, and its report says which cases it resolves.
- **A chaff release closes it.** When a new chaffjs is on npm, a daily workflow here opens a pull request that bumps the
  pin and runs `yarn run-corpus --resolve`: a false positive chaff no longer gives is
  removed, and a miss chaff now gives becomes `correct`, with `found by chaffjs <version>` added to its note. Once that
  pull request is merged, the document has no open case left, and the next sync closes the lab issue.

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

### A document that may not be redistributed

Its expected file keeps no text: each finding is known by `rule`, `line` and the `sha256` of its text, so the repository
alone does not show what a finding points at. To read the findings, run

```sh
yarn judge <id>
```

It reads `expected/<id>.yaml` and the document's text (fetched into the git-ignored `.cache/` as `yarn run-corpus`
does; `--offline` uses the cache only), runs no chaff, and prints each entry's verdict, rule and line with the text the
finding points at, recovered from your copy of the document. When no text on that line has the entry's `sha256`, it
says so: the document changed or the line moved. It only prints; it writes nothing to the repository.

Then edit `verdict` and `note` in `expected/<id>.yaml` as above, and leave `sha256` and `line` as they are. **Never
paste the document's text into a `note`**: describe the mistake in your own words ("a defined term used before its
definition"), not by quoting the line.

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
