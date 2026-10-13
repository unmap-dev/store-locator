"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistance, formatDuration, type Lang } from "@/lib/kit/i18n";
import type { Ranked, SortBy, TravelMode } from "@/lib/rank";
import type { Store } from "@/lib/stores";
import { TEXT } from "@/lib/text";
import { OpenStatus } from "./open-status";

export interface Row {
  store: Store;
  ranked: Ranked | null;
}

/**
 * The branches as a list, in step with the map (one shared `selected` id). Once there is a
 * starting place, each row says its travel time (Unmap Matrix) and its straight-line distance,
 * each labelled for what it is.
 */
export function StoreList({ rows, selected, now, lang, mode, sort, timesLoading, onSelect }: { rows: readonly Row[]; selected: string | null; now: Date; lang: Lang; mode: TravelMode; sort: SortBy; timesLoading: boolean; onSelect: (id: string) => void }) {
  const t = TEXT[lang];
  const modeWord = mode === "auto" ? t.driveWord : t.walkWord;
  const closest = sort === "time" ? rows[0]?.ranked?.seconds != null ? rows[0]!.store.id : null : rows[0]?.ranked ? rows[0]!.store.id : null;
  return (
    <ol aria-label={t.listLabel} className="flex flex-col">
      {rows.map(({ store, ranked }) => (
        <li key={store.id} className="border-b last:border-b-0">
          <Button
            variant="ghost"
            aria-pressed={selected === store.id}
            onClick={() => onSelect(store.id)}
            data-store-row={store.id}
            className="flex h-auto w-full flex-col items-stretch gap-0.5 rounded-none px-3 py-2.5 text-left font-normal whitespace-normal aria-pressed:bg-muted"
          >
            <span className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate font-medium">{store.branch}</span>
              {closest === store.id ? <Badge variant="secondary">{t.closest}</Badge> : null}
            </span>
            <span className="truncate text-xs text-muted-foreground">{store.address}</span>
            <span className="text-xs text-muted-foreground">
              <OpenStatus store={store} now={now} lang={lang} />
            </span>
            {ranked ? (
              <span className="flex flex-wrap gap-x-2 text-xs tabular-nums" data-metrics="">
                {timesLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : ranked.seconds != null ? (
                  <span className="font-medium">{format(t.travelTime, { time: formatDuration(ranked.seconds, lang), mode: modeWord })}</span>
                ) : (
                  <span className="text-muted-foreground">{t.noTime}</span>
                )}
                <span className="text-muted-foreground">{format(t.straight, { distance: formatDistance(ranked.straight, lang) })}</span>
              </span>
            ) : null}
          </Button>
        </li>
      ))}
    </ol>
  );
}
