"use client";

import { getUnmap } from "@/lib/kit/client";
import { chunks, travelById, type TravelMode } from "@/lib/rank";
import type { Store } from "@/lib/stores";
import { useAsync } from "@/lib/use-async";

/**
 * Travel time and distance from `origin` to every store, from the Unmap Matrix API: one origin
 * against at most 10 destinations per call, the calls sent together. Null cells stay null.
 * Nothing is requested until there is an origin.
 */
export function useTravelTimes(origin: [number, number] | null, stores: readonly Store[], mode: TravelMode) {
  const key = origin ? `${origin.join(",")}|${mode}|${stores.map((s) => s.id).join(",")}` : null;
  return useAsync(key, async (signal) => {
    const unmap = getUnmap();
    if (!unmap || !origin) throw new Error("No API key");
    const groups = chunks(stores);
    const rows = await Promise.all(groups.map((group) => unmap.router.matrix([origin], group.map((s) => s.coordinates), { mode, signal })));
    return travelById(groups, rows);
  });
}
