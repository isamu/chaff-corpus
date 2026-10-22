// The text of a document that may not be redistributed: fetched from its URL into the git-ignored .cache/, and used
// only when it is byte for byte the text that was judged (its sha256). A source with a source.format is converted first,
// as isamu/lab converted it when it fetched the document; a source.hf is one record of a Hugging Face dataset.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CACHE } from "./corpus.ts";
import { decodeFetched } from "./html/fetched-text.ts";
import { hfRowUrl, hfText, isPinned, type HfRow } from "./hf-row.ts";
import { EXTENSION, MAX_TEXT_BYTES, sha256Of, type Meta, type Source } from "./meta.ts";
import { convertedText } from "./source-format.ts";

const FETCH_TIMEOUT_MS = 30 * 1000;

/** A dataset's JSONL file holds many records; the record, not the file, is held to MAX_TEXT_BYTES. */
const MAX_HF_FILE_BYTES = 64 * 1024 * 1024;

export type Available = { readonly text: string } | { readonly unavailable: string };

export const cachePath = (meta: Meta): string => join(CACHE, `${meta.id}${EXTENSION[meta.format]}`);

const fetchText = async (url: string, maxBytes: number = MAX_TEXT_BYTES): Promise<string> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
    if (Number(response.headers.get("content-length") ?? 0) > maxBytes) throw new Error(`larger than ${String(maxBytes)} bytes`);
    return decodeFetched(new Uint8Array(await response.arrayBuffer()), response.headers.get("content-type"));
  } finally {
    clearTimeout(timer);
  }
};

const fromCache = (meta: Meta): Available | undefined => {
  const path = cachePath(meta);
  if (!existsSync(path)) return undefined;
  const text = readFileSync(path, "utf8");
  return sha256Of(text) === meta.sha256 ? { text } : { unavailable: `${path} does not match sha256` };
};

const hfMismatchReason = (hf: HfRow): string =>
  isPinned(hf)
    ? `the record at ${hf.dataset}@${hf.revision} ${hf.file ?? ""} line ${String(hf.offset)} does not match sha256`
    : `the record at ${hf.dataset} ${hf.config}/${hf.split} row ${String(hf.offset)} does not match sha256 (the rows API serves the latest commit, not ${hf.revision}; the dataset may have changed)`;

const mismatchReason = (source: Source): string => {
  if (source.hf !== undefined) return hfMismatchReason(source.hf);
  return source.format === undefined
    ? "the text at source.url does not match sha256 (it changed, or it was converted when judged and source.format is missing)"
    : `the text at source.url, converted from ${source.format}, does not match sha256 (the source changed upstream)`;
};

const fetchedHfText = async (hf: HfRow): Promise<string> => {
  const text = hfText(hf, await fetchText(hfRowUrl(hf), MAX_HF_FILE_BYTES));
  if ("problems" in text) throw new Error(`${hfRowUrl(hf)}: ${text.problems.join("; ")}`);
  return text.value;
};

const fetchedSourceText = async (source: Source): Promise<string> =>
  source.hf === undefined ? convertedText(source.format, await fetchText(source.url)) : fetchedHfText(source.hf);

const fromNetwork = async (meta: Meta, source: Source): Promise<Available> => {
  try {
    const text = await fetchedSourceText(source);
    if (sha256Of(text) !== meta.sha256) return { unavailable: mismatchReason(source) };
    mkdirSync(CACHE, { recursive: true });
    writeFileSync(cachePath(meta), text);
    return { text };
  } catch (error) {
    return { unavailable: `cannot fetch ${source.url}: ${error instanceof Error ? error.message : String(error)}` };
  }
};

/** The text to run chaff on: the cached copy when it matches, else a fresh fetch when that matches, else why there is none. */
export const uncommittedText = async (meta: Meta, offline: boolean): Promise<Available> => {
  const cached = fromCache(meta);
  if (cached !== undefined && "text" in cached) return cached;
  if (offline) return cached ?? { unavailable: `not in ${CACHE} (offline)` };
  return meta.source === undefined ? { unavailable: "no source to fetch the text from" } : fromNetwork(meta, meta.source);
};
