import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assignShards, idsInShard, parseShard, type Weighted } from "../scripts/lib/shard.ts";

const items = (weights: readonly number[]): Weighted[] => weights.map((weight, index) => ({ id: `doc-${String(index).padStart(3, "0")}`, weight }));

/** A deterministic spread of weights: many small documents and a few large ones, like the corpus. */
const generated = (count: number, seed: number): Weighted[] =>
  items(Array.from({ length: count }, (_, index) => ((index * 7919 + seed * 104729) % 1000) * (index % 17 === 0 ? 50 : 1) + 1));

describe("parseShard", () => {
  it("reads i/n", () => {
    assert.deepEqual(parseShard("1/4"), { index: 1, count: 4 });
    assert.deepEqual(parseShard(" 4/4 "), { index: 4, count: 4 });
    assert.deepEqual(parseShard("1/1"), { index: 1, count: 1 });
  });

  it("rejects anything else", () => {
    ["", "0/4", "5/4", "1/0", "a/b", "1/", "/4", "1-4", "1/4/2", "-1/4", "1.5/4"].forEach((value) => assert.equal(parseShard(value), undefined, value));
  });
});

describe("assignShards", () => {
  it("places every document in exactly one shard, whatever the count", () => {
    [1, 2, 3, 6, 8, 13].forEach((count) =>
      [0, 1, 5, 50, 238].forEach((size) => {
        const docs = generated(size, count);
        const shards = Array.from({ length: count }, (_, index) => idsInShard(docs, { index: index + 1, count }));
        const all = shards.flatMap((ids) => [...ids]);
        assert.equal(all.length, docs.length, `${String(size)} over ${String(count)}`);
        assert.deepEqual(new Set(all), new Set(docs.map((doc) => doc.id)));
      }),
    );
  });

  it("gives the same shards whatever order the documents come in", () => {
    const docs = generated(120, 3);
    assert.deepEqual(assignShards(docs, 6), assignShards(docs.toReversed(), 6));
  });

  it("balances the work: no shard carries more than the lightest plus the heaviest single document", () => {
    [2, 4, 6, 8].forEach((count) => {
      const docs = generated(238, count);
      const placed = assignShards(docs, count);
      const loads = Array.from({ length: count }, (_, index) => docs.filter((doc) => placed.get(doc.id) === index + 1).reduce((sum, doc) => sum + doc.weight, 0));
      const heaviest = Math.max(...docs.map((doc) => doc.weight));
      assert.ok(Math.max(...loads) <= Math.min(...loads) + heaviest, `${String(count)} shards: ${loads.join(", ")}`);
    });
  });

  it("puts a document heavier than all others together in a shard of its own", () => {
    const docs = items([1000, 1, 1, 1, 1, 1]);
    const placed = assignShards(docs, 2);
    const shardOfHeavy = placed.get("doc-000");
    assert.deepEqual(docs.filter((doc) => placed.get(doc.id) === shardOfHeavy).map((doc) => doc.id), ["doc-000"]);
  });

  it("breaks equal weights by id, and leaves shards empty when there are fewer documents than shards", () => {
    const docs = items([5, 5]);
    assert.deepEqual([...assignShards(docs, 3)], [["doc-000", 1], ["doc-001", 2]]);
    assert.deepEqual(idsInShard(docs, { index: 3, count: 3 }), new Set());
  });

  it("keeps the given order inside a shard", () => {
    const docs = items([1, 9, 2, 8, 3, 7]);
    const ids = [...idsInShard(docs, { index: 1, count: 2 })];
    assert.deepEqual(ids, docs.filter((doc) => ids.includes(doc.id)).map((doc) => doc.id));
  });
});
