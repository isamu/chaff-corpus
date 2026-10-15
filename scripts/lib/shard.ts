// Splitting the documents over CI jobs: every document lands in exactly one shard, the same one on every run, and the
// shards carry about the same work. Pure.

/** Shard `index` (1-based) of `count`. */
export type Shard = { readonly index: number; readonly count: number };

const SHARD_PATTERN = /^(\d+)\/(\d+)$/;

/** "i/n" with 1 ≤ i ≤ n, or undefined. */
export const parseShard = (value: string): Shard | undefined => {
  const match = SHARD_PATTERN.exec(value.trim());
  if (match === null) return undefined;
  const index = Number(match[1]);
  const count = Number(match[2]);
  return index >= 1 && index <= count ? { index, count } : undefined;
};

/** One document to place: its id, and how much work it is (any unit, the same for all). */
export type Weighted = { readonly id: string; readonly weight: number };

const heaviestFirst = (left: Weighted, right: Weighted): number => right.weight - left.weight || left.id.localeCompare(right.id);

const lightestShard = (loads: readonly number[]): number => loads.reduce((best, load, index) => (load < (loads[best] ?? Infinity) ? index : best), 0);

/** The shard (1-based) of each id: heaviest first, each to the shard with the least work so far, ties to the lower shard. */
export const assignShards = (items: readonly Weighted[], count: number): Map<string, number> => {
  const loads = Array.from({ length: Math.max(1, count) }, () => 0);
  return items.toSorted(heaviestFirst).reduce((placed, item) => {
    const shard = lightestShard(loads);
    loads[shard] = (loads[shard] ?? 0) + item.weight;
    return placed.set(item.id, shard + 1);
  }, new Map<string, number>());
};

/** The ids in `shard`, in the order given. */
export const idsInShard = (items: readonly Weighted[], shard: Shard): Set<string> => {
  const placed = assignShards(items, shard.count);
  return new Set(items.filter((item) => placed.get(item.id) === shard.index).map((item) => item.id));
};
