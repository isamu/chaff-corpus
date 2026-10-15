## Summary

<!-- What this PR adds or changes: a case, documents, verdicts, or code. Delete the checklists that do not apply. -->

## Items to Confirm / Review

<!-- What a reviewer should check in particular. -->

## For a new document

- [ ] **Licence**: the licence is named in the `.yaml` (`license.name`, `license.url`), and it allows what `redistribute` says. If the licence does not allow redistribution, only the `.yaml` is committed (`redistribute: false`).
- [ ] **Source**: `source.url` points at the document as fetched, and `source.fetched` is the date.
- [ ] **No personal data**: the text names no private person and holds no private email address or phone number (`yarn validate` scans for both; a published contact goes in `allowlist.yaml` with a reason).
- [ ] **Language**: `ja` or `en`, and the folder agrees (`docs/<lang>/…`).
- [ ] **Genre**: a genre chaff knows (`npx chaff genres`), and the folder agrees (`docs/<lang>/<genre>/`).
- [ ] **Human-written**: I checked that the text was written by people, not generated.
- [ ] `yarn validate` and `yarn run-corpus --update` ran; the new findings are in `expected/<id>.yaml`.

## For a case (chaff got it wrong)

See [Report a case where chaff is wrong](https://github.com/isamu/chaff-corpus/blob/main/CONTRIBUTING.md#report-a-case-where-chaff-is-wrong). The checks for a new document above apply too.

- [ ] **May be shared**: the text is under a licence that allows redistribution (or only its `.yaml` is committed with `redistribute: false`). Nothing confidential, not even an excerpt.
- [ ] **No personal data**: no private person's name, email address or phone number.
- [ ] `yarn run-corpus --update --only <id>` ran on the final text, so `expected/<id>.yaml` holds what the pinned chaffjs gives.
- [ ] **Wrong findings** are marked `verdict: false-positive` with a one-line `note`; their `rule`, `line` and `text` are unchanged.
- [ ] **Missing findings** are entries with `rule` (a name from `npx chaff rules`), `line`, `what` and `verdict: missed`.

What chaff got wrong, in a sentence or two:

<!-- e.g. "undefined-acronym on line 12: HVAC is spelled out in the table above it." -->
