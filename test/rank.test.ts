import { describe, expect, it } from "vitest";
import { MATRIX_MAX, chunks, rank, travelById } from "../lib/rank";
import { SAMPLE_STORES } from "../lib/sample";

const from: [number, number] = [-114.0869, 51.0526]; // Kensington

describe("ranking", () => {
  it("splits matrix calls at 10 destinations", () => {
    expect(MATRIX_MAX).toBe(10);
    expect(chunks(SAMPLE_STORES).map((c) => c.length)).toEqual([10, 10]);
    expect(chunks([1, 2, 3], 2)).toEqual([[1, 2], [3]]);
  });

  it("maps each call's first row back to its stores, keeping nulls", () => {
    const groups = [SAMPLE_STORES.slice(0, 2), SAMPLE_STORES.slice(2, 3)];
    const travel = travelById(groups, [
      { durations: [[60, null]], distances: [[500, null]] },
      { durations: [[30]], distances: [[200]] },
    ]);
    expect(travel.get(SAMPLE_STORES[0]!.id)).toEqual({ seconds: 60, metres: 500 });
    expect(travel.get(SAMPLE_STORES[1]!.id)).toEqual({ seconds: null, metres: null });
    expect(travel.get(SAMPLE_STORES[2]!.id)).toEqual({ seconds: 30, metres: 200 });
  });

  it("orders by travel time with unanswered branches last, or by straight line", () => {
    const [a, b, c] = SAMPLE_STORES;
    const travel = new Map([
      [a!.id, { seconds: 900, metres: 9000 }],
      [b!.id, { seconds: 120, metres: 1500 }],
      [c!.id, { seconds: null, metres: null }],
    ]);
    const byTime = rank([a!, b!, c!], from, "time", travel).map((r) => r.store.id);
    expect(byTime).toEqual([b!.id, a!.id, c!.id]);
    const byDistance = rank([a!, b!, c!], from, "distance", travel);
    expect(byDistance.map((r) => r.straight)).toEqual([...byDistance.map((r) => r.straight)].sort((x, y) => x - y));
    expect(byDistance[0]!.store.id).toBe("kensington");
  });

  it("falls back to straight line when there are no travel times yet", () => {
    expect(rank(SAMPLE_STORES, from, "time")[0]!.store.id).toBe("kensington");
  });
});
