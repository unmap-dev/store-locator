"use client";

import type { RouteResult } from "@unmap/sdk";
import type { Lang } from "@/lib/kit/i18n";
import { getUnmap } from "@/lib/kit/client";
import type { TravelMode } from "@/lib/rank";
import { useAsync } from "@/lib/use-async";

/** A route from `from` to `to` with turn-by-turn steps in the page's language. Off until both ends exist. */
export function useDirections(from: [number, number] | null, to: [number, number] | null, mode: TravelMode, lang: Lang, enabled: boolean) {
  const key = enabled && from && to ? `${from.join(",")}|${to.join(",")}|${mode}|${lang}` : null;
  return useAsync<RouteResult>(key, async (signal) => {
    const unmap = getUnmap();
    if (!unmap || !from || !to) throw new Error("No API key");
    return unmap.router.route(from, to, { mode, steps: true, lang, signal });
  });
}
