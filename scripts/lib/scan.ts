// Looking for an email address or a phone number in a committed text, and the allow-list for known public ones. Pure.
import { isNonEmptyString, isRecord } from "./guards.ts";
import type { Parsed } from "./expected.ts";

export type PersonalDataKind = "email" | "phone";

export type Hit = { readonly kind: PersonalDataKind; readonly match: string; readonly line: number };

/** A string known to be public, in one document, and why it may stay. */
export type Allowed = { readonly id: string; readonly match: string; readonly reason: string };

const NOT_DIGIT_BEFORE = String.raw`(?<![\d\-+])`;
const NOT_DIGIT_AFTER = String.raw`(?![\d\-])`;

const PATTERNS: readonly { readonly kind: PersonalDataKind; readonly pattern: RegExp }[] = [
  { kind: "email", pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g },
  // Japanese numbers (03-1234-5678, 0120-123-456), written with any hyphen or with full-width digits.
  { kind: "phone", pattern: new RegExp(String.raw`${NOT_DIGIT_BEFORE}0\d{1,4}-\d{1,4}-\d{3,4}${NOT_DIGIT_AFTER}`, "g") },
  // International (+44 20 7946 0958, +1-202-555-0143).
  { kind: "phone", pattern: new RegExp(String.raw`\+\d{1,3}[ .\-]?\(?\d{1,4}\)?(?:[ .\-]?\d{2,4}){2,4}${NOT_DIGIT_AFTER}`, "g") },
  // North American ((202) 555-0143, 202-555-0143, 202.555.0143).
  { kind: "phone", pattern: new RegExp(String.raw`${NOT_DIGIT_BEFORE}(?:\(\d{3}\)\s?|\d{3}[\-.])\d{3}[\-.]\d{4}${NOT_DIGIT_AFTER}`, "g") },
];

/** NFKC folds full-width digits and hyphens (０３－１２３４) into the ASCII the patterns read; dashes that look like hyphens are folded too. */
const normalised = (line: string): string => line.normalize("NFKC").replace(/[‐‑‒–—―−ー]/g, "-");

/** A section number with a dot before its hyphen (252.227-7014): a phone number keeps one separator throughout. */
const DOTTED_SECTION = /^\d+\.\d+-\d+$/;

/** A regulation's acronym or a section sign just before the number: "DFARS 252.227-7014", "48 CFR § 252-227-7014". */
const REGULATION_BEFORE = /(?:\b(?:FAR|DFARS?|AFARS|DEARS?|GSAR|HSAR|NFS|CFR|U\.?\s?S\.?\s?C)\.?|§)\s*(?:§\s*)?$/;

/** A citation of a regulation's section that has the shape of a phone number. */
export const isCitation = (line: string, match: string, index: number): boolean =>
  DOTTED_SECTION.test(match) || REGULATION_BEFORE.test(line.slice(0, index));

const phoneOrEmail = (kind: PersonalDataKind, line: string, match: RegExpExecArray): boolean => kind === "email" || !isCitation(line, match[0], match.index);

/** Each string once per line: a number two patterns read (073-489-5903 is also North American in shape) is one hit. */
const hitsInLine = (line: string, lineNumber: number): Hit[] => {
  const text = normalised(line);
  const found = PATTERNS.flatMap(({ kind, pattern }) =>
    [...text.matchAll(pattern)].filter((match) => phoneOrEmail(kind, text, match)).map((match) => ({ kind, match: match[0], line: lineNumber })),
  );
  return found.filter((hit, index) => found.findIndex((other) => other.match === hit.match) === index);
};

/** Every email address and phone number in the text, by line, as it reads after folding full-width characters. */
export const personalDataHits = (text: string): Hit[] => text.split(/\r?\n/).flatMap((line, index) => hitsInLine(line, index + 1));

/** The hits in document `id` that no allow-list entry for it names. */
export const unallowedHits = (id: string, hits: readonly Hit[], allowed: readonly Allowed[]): Hit[] => {
  const names = new Set(allowed.filter((entry) => entry.id === id).map((entry) => entry.match));
  return hits.filter((hit) => !names.has(hit.match));
};

const allowedOf = (raw: unknown, index: number): Allowed | string => {
  if (!isRecord(raw)) return `entry ${String(index)}: must be a mapping`;
  const { id, match, reason } = raw;
  if (!isNonEmptyString(id) || !isNonEmptyString(match)) return `entry ${String(index)}: id and match are required`;
  if (!isNonEmptyString(reason)) return `entry ${String(index)} (${match}): a reason is required`;
  return { id, match, reason };
};

/** allowlist.yaml: a list of { id, match, reason }. An empty file is an empty list. */
export const parseAllowList = (raw: unknown): Parsed<readonly Allowed[]> => {
  if (raw === null || raw === undefined) return { value: [] };
  if (!Array.isArray(raw)) return { problems: ["allowlist.yaml must be a list"] };
  const entries = raw.map((entry: unknown, index) => allowedOf(entry, index));
  const problems = entries.filter((entry) => typeof entry === "string");
  return problems.length > 0 ? { problems } : { value: entries.filter((entry) => typeof entry !== "string") };
};
