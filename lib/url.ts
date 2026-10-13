/**
 * Places' state in the query string, so a link opens on the same search, branch and mode:
 *   ?from=-114.07,51.05&label=Kensington&store=crowfoot&mode=pedestrian&sort=distance&lang=fr
 * Pure functions; the app owns history. Unit-tested in test/url.test.ts.
 */
import type { SortBy, TravelMode } from "@/lib/rank";

export interface Origin {
  coordinates: [number, number];
  label: string;
}

export interface PlacesState {
  origin: Origin | null;
  store: string | null;
  mode: TravelMode;
  sort: SortBy;
}

export const DEFAULT_STATE: PlacesState = { origin: null, store: null, mode: "auto", sort: "time" };

const round = (n: number) => Number(n.toFixed(5));

export function parseState(search: string): PlacesState {
  const q = new URLSearchParams(search);
  const from = q.get("from")?.split(",").map(Number);
  const valid = from && from.length === 2 && from.every(Number.isFinite) && Math.abs(from[0]!) <= 180 && Math.abs(from[1]!) <= 90;
  return {
    origin: valid ? { coordinates: [from![0]!, from![1]!], label: q.get("label")?.slice(0, 120) || `${round(from![1]!)}, ${round(from![0]!)}` } : null,
    store: q.get("store") || null,
    mode: q.get("mode") === "pedestrian" ? "pedestrian" : "auto",
    sort: q.get("sort") === "distance" ? "distance" : "time",
  };
}

/** `search` with Places' keys replaced by `state`; other keys (such as `lang`) are kept. */
export function writeState(search: string, state: PlacesState): string {
  const q = new URLSearchParams(search);
  for (const key of ["from", "label", "store", "mode", "sort"]) q.delete(key);
  if (state.origin) {
    q.set("from", `${round(state.origin.coordinates[0])},${round(state.origin.coordinates[1])}`);
    q.set("label", state.origin.label);
  }
  if (state.store) q.set("store", state.store);
  if (state.mode !== DEFAULT_STATE.mode) q.set("mode", state.mode);
  if (state.sort !== DEFAULT_STATE.sort) q.set("sort", state.sort);
  const s = q.toString().replace(/%2C/g, ",");
  return s ? `?${s}` : "";
}
