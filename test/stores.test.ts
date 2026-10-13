import { describe, expect, it } from "vitest";
import raw from "../data/stores.sample.json";
import { SAMPLE_STORES } from "../lib/sample";
import { StoreDataError, boundsOf, byStraightLine, clock, filterByServices, openStatus, parseStores, straightLine } from "../lib/stores";

// 2026-10-14 is a Wednesday. Calgary is UTC-6 in October (MDT).
const at = (iso: string) => new Date(iso);

describe("sample data", () => {
  it("is 15–25 stores in and around Calgary, each with a unique id", () => {
    expect(SAMPLE_STORES.length).toBeGreaterThanOrEqual(15);
    expect(SAMPLE_STORES.length).toBeLessThanOrEqual(25);
    expect(new Set(SAMPLE_STORES.map((s) => s.id)).size).toBe(SAMPLE_STORES.length);
    for (const s of SAMPLE_STORES) {
      expect(s.coordinates[0]).toBeGreaterThan(-114.4);
      expect(s.coordinates[0]).toBeLessThan(-113.8);
      expect(s.coordinates[1]).toBeGreaterThan(50.8);
      expect(s.coordinates[1]).toBeLessThan(51.25);
    }
  });

  it("says it is sample data, and uses only the 555-01xx fiction range for phones", () => {
    expect((raw as { _note: string })._note).toMatch(/SAMPLE DATA/);
    for (const s of SAMPLE_STORES) expect(s.phone).toMatch(/^\+1 403-555-01\d\d$/);
  });
});

describe("parseStores", () => {
  const point = (props: Record<string, unknown>, coordinates: unknown = [-114, 51]) => ({ type: "Feature", geometry: { type: "Point", coordinates }, properties: props });

  it("rejects what is not a FeatureCollection", () => {
    expect(() => parseStores({ type: "Feature" })).toThrow(StoreDataError);
  });

  it("lists every problem, with the feature it is in", () => {
    try {
      parseStores({ type: "FeatureCollection", features: [point({ name: "A" }), point({ id: "b", name: "B", address: "x" }, [200, 51]), { type: "Feature", geometry: { type: "LineString", coordinates: [] } }] });
      throw new Error("expected a StoreDataError");
    } catch (e) {
      const problems = (e as StoreDataError).problems;
      expect(problems).toContain('Feature 1: "id" is required.');
      expect(problems).toContain("Feature 2: coordinates must be [longitude, latitude] in degrees (WGS84).");
      expect(problems).toContain("Feature 3: geometry must be a Point.");
    }
  });

  it("drops unknown services and rejects malformed hours", () => {
    const stores = parseStores({ type: "FeatureCollection", features: [point({ id: "a", name: "A", address: "1 St", services: ["pickup", "teleport"], hours: { mon: "09:00-17:00" } })] });
    expect(stores[0]!.services).toEqual(["pickup"]);
    expect(stores[0]!.hours.tue).toBeNull();
    expect(() => parseStores({ type: "FeatureCollection", features: [point({ id: "a", name: "A", address: "1 St", hours: { mon: "9-5" } })] })).toThrow(/hours.mon/);
  });
});

describe("store logic", () => {
  const store = { ...SAMPLE_STORES[0]!, hours: { mon: "09:00-19:00", tue: "09:00-19:00", wed: "09:00-19:00", thu: null, fri: "09:00-20:00", sat: null, sun: null } };

  it("filters on every chosen service", () => {
    expect(filterByServices(SAMPLE_STORES, [])).toHaveLength(SAMPLE_STORES.length);
    const ev = filterByServices(SAMPLE_STORES, ["ev", "repairs"]);
    expect(ev.length).toBeGreaterThan(0);
    for (const s of ev) expect(s.services).toEqual(expect.arrayContaining(["ev", "repairs"]));
  });

  it("works out open and closed in Calgary time", () => {
    expect(openStatus(store, at("2026-10-14T18:00:00Z"))).toEqual({ open: true, closesAt: "19:00" }); // Wed 12:00
    expect(openStatus(store, at("2026-10-14T14:00:00Z"))).toEqual({ open: false, opensAt: "09:00", opensDay: "wed" }); // Wed 08:00
    expect(openStatus(store, at("2026-10-15T03:00:00Z"))).toEqual({ open: false, opensAt: "09:00", opensDay: "fri" }); // Wed 21:00, Thu closed
  });

  it("orders by straight-line distance and frames the stores", () => {
    const from: [number, number] = [-114.0869, 51.0526];
    const ranked = byStraightLine(SAMPLE_STORES, from);
    expect(ranked[0]!.store.id).toBe("kensington");
    expect(ranked.map((r) => r.metres)).toEqual([...ranked.map((r) => r.metres)].sort((a, b) => a - b));
    expect(straightLine([-114, 51], [-114, 52])).toBeGreaterThan(111_000);
    const b = boundsOf(SAMPLE_STORES)!;
    expect(b[0]).toBeLessThan(b[2]);
  });

  it("writes times the way each language does", () => {
    expect(clock("09:00", "en")).toBe("9:00 a.m.");
    expect(clock("19:30", "en")).toBe("7:30 p.m.");
    expect(clock("19:30", "fr")).toBe("19 h 30");
    expect(clock("09:00", "fr")).toBe("9 h");
  });
});
