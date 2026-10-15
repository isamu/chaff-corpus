// The text of a document that may not be redistributed: fetched from its URL into the git-ignored .cache/, and used
// only when it is byte for byte the text that was judged (its sha256). A source with a source.format is converted first,
// as isamu/lab converted it when it fetched the document.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CACHE } from "./corpus.ts";
import { decodeFetched } from "./html/fetched-text.ts";
import { EXTENSION, MAX_TEXT_BYTES, sha256Of, type Meta } from "./meta.ts";
import { convertedText } from "./source-format.ts";

const FETCH_TIMEOUT_MS = 30 * 1000;

export type Available = { readonly text: string } | { readonly unavailable: string };

export const cachePath = (meta: Meta): string => join(CACHE, `${meta.id}${EXTENSION[meta.format]}`);

const fetchText = async (url: string): Promise<string> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
    if (Number(response.headers.get("content-length") ?? 0) > MAX_TEXT_BYTES) throw new Error(`larger than ${String(MAX_TEXT_BYTES)} bytes`);
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

const mismatchReason = (meta: Meta): string =>
  meta.source.format === undefined
    ? "the text at source.url does not match sha256 (it changed, or it was converted when judged and source.format is missing)"
    : `the text at source.url, converted from ${meta.source.format}, does not match sha256 (the source changed upstream)`;

const fromNetwork = async (meta: Meta): Promise<Available> => {
  try {
    const text = convertedText(meta.source.format, await fetchText(meta.source.url));
    if (sha256Of(text) !== meta.sha256) return { unavailable: mismatchReason(meta) };
    mkdirSync(CACHE, { recursive: true });
    writeFileSync(cachePath(meta), text);
    return { text };
  } catch (error) {
    return { unavailable: `cannot fetch ${meta.source.url}: ${error instanceof Error ? error.message : String(error)}` };
  }
};

/** The text to run chaff on: the cached copy when it matches, else a fresh fetch when that matches, else why there is none. */
export const uncommittedText = async (meta: Meta, offline: boolean): Promise<Available> => {
  const cached = fromCache(meta);
  if (cached !== undefined && "text" in cached) return cached;
  if (offline) return cached ?? { unavailable: `not in ${CACHE} (offline)` };
  return fromNetwork(meta);
};
