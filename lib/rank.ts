/**
 * Ranking branches from a place: by straight-line distance (worked out here) or by travel time
 * (from the Unmap Matrix API). The two are never mixed: a row says which one it shows. Plain
 * TypeScript, unit-tested in test/rank.test.ts.
 */
import { straightLine, type Store } from "@/lib/stores";

export type TravelMode = "auto" | "pedestrian";
export type SortBy = "time" | "distance";

/** The Matrix API answers at most 10 destinations per origin per call (spec §5, docs/apis/routing). */
export const MATRIX_MAX = 10;

/** Split a list into runs of at most `size`. */
export function chunks<T>(items: readonly T[], size = MATRIX_MAX): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** One branch's numbers from a place. `seconds`/`metres` are null when the API had no answer. */
export interface Ranked {
  store: Store;
  /** Straight line, metres. Always known. */
  straight: number;
  /** Travel time in seconds from the Matrix API; null before it answers or when the cell is null. */
  seconds: number | null;
  /** Travel distance in metres from the Matrix API; null likewise. */
  metres: number | null;
}

/**
 * Travel times keyed by store id from one origin row of each matrix call, in call order. A null
 * cell stays null: the API had no answer for that pair, which is not proof there is no road.
 */
export function travelById(storesByCall: readonly (readonly Store[])[], rows: readonly { durations: (number | null)[][]; distances: (number | null)[][] }[]): Map<string, { seconds: number | null; metres: number | null }> {
  const out = new Map<string, { seconds: number | null; metres: number | null }>();
  storesByCall.forEach((stores, call) => {
    const row = rows[call];
    stores.forEach((store, j) => {
      out.set(store.id, { seconds: row?.durations[0]?.[j] ?? null, metres: row?.distances[0]?.[j] ?? null });
    });
  });
  return out;
}

/**
 * Branches from `origin`, sorted. By time, branches without a travel time go last (by straight
 * line among themselves); by distance, the straight line decides. Ties keep the input order.
 */
export function rank(stores: readonly Store[], origin: readonly [number, number], sortBy: SortBy, travel?: Map<string, { seconds: number | null; metres: number | null }>): Ranked[] {
  const rows = stores.map((store) => {
    const t = travel?.get(store.id);
    return { store, straight: straightLine(origin, store.coordinates), seconds: t?.seconds ?? null, metres: t?.metres ?? null };
  });
  return rows.sort((a, b) => {
    if (sortBy === "time") {
      if (a.seconds == null && b.seconds != null) return 1;
      if (b.seconds == null && a.seconds != null) return -1;
      if (a.seconds != null && b.seconds != null && a.seconds !== b.seconds) return a.seconds - b.seconds;
    }
    return a.straight - b.straight;
  });
}

/** Isochrone bands per mode, in minutes: what "reachable area" draws round a branch. */
export const REACH_MINUTES: Record<TravelMode, number[]> = { auto: [10, 20], pedestrian: [10, 20] };
