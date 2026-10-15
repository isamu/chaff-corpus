// expected/<id>.yaml as written by `--update`: one key order, no folded lines, so a diff shows only what changed.
import { stringify } from "yaml";
import type { Expected, ExpectedEntry } from "./expected.ts";

const entryObject = (entry: ExpectedEntry): Record<string, string | number> => {
  const note = entry.note === undefined ? {} : { note: entry.note };
  if (entry.verdict === "missed") return { rule: entry.rule, line: entry.line, what: entry.what, verdict: entry.verdict, ...note };
  if ("sha256" in entry) return { rule: entry.rule, line: entry.line, sha256: entry.sha256, verdict: entry.verdict, ...note };
  const message = entry.message === undefined ? {} : { message: entry.message };
  return { rule: entry.rule, line: entry.line, text: entry.text, ...message, verdict: entry.verdict, ...note };
};

export const expectedYaml = (expected: Expected): string =>
  stringify({ id: expected.id, chaff: expected.chaff, findings: expected.findings.map(entryObject) }, { lineWidth: 0 });
