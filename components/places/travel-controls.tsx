"use client";

import { CarIcon, FootprintsIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Lang } from "@/lib/kit/i18n";
import type { SortBy, TravelMode } from "@/lib/rank";
import { TEXT } from "@/lib/text";

/** Drive or walk, and whether the list is ordered by travel time or by straight-line distance. */
export function TravelControls({ mode, sort, onMode, onSort, lang }: { mode: TravelMode; sort: SortBy; onMode: (m: TravelMode) => void; onSort: (s: SortBy) => void; lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleGroup variant="outline" size="sm" spacing={0} value={[mode]} onValueChange={(v) => v[0] && onMode(v[0] as TravelMode)} aria-label={t.mode}>
        <ToggleGroupItem value="auto">
          <CarIcon data-icon="inline-start" />
          {t.drive}
        </ToggleGroupItem>
        <ToggleGroupItem value="pedestrian">
          <FootprintsIcon data-icon="inline-start" />
          {t.walk}
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup variant="outline" size="sm" spacing={0} value={[sort]} onValueChange={(v) => v[0] && onSort(v[0] as SortBy)} aria-label={t.sortBy}>
        <ToggleGroupItem value="time">{t.sortTime}</ToggleGroupItem>
        <ToggleGroupItem value="distance">{t.sortDistance}</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
