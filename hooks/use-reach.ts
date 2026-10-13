"use client";

import type { FeatureCollection } from "@unmap/sdk";
import { getUnmap } from "@/lib/kit/client";
import { REACH_MINUTES, type TravelMode } from "@/lib/rank";
import { useAsync } from "@/lib/use-async";

/** The area reachable from a branch within REACH_MINUTES, from the Unmap Isochrone API. */
export function useReach(center: [number, number] | null, mode: TravelMode, enabled: boolean) {
  const key = enabled && center ? `${center.join(",")}|${mode}` : null;
  return useAsync<FeatureCollection>(key, async (signal) => {
    const unmap = getUnmap();
    if (!unmap || !center) throw new Error("No API key");
    return unmap.router.isochrone(center, { minutes: REACH_MINUTES[mode], mode, signal });
  });
}
