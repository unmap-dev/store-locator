"use client";

import type { RouteResult } from "@unmap/sdk";
import { InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { ApiProblemAlert } from "@/lib/kit/api-problem";
import { format, formatDistance, formatDuration, type Lang } from "@/lib/kit/i18n";
import type { TravelMode } from "@/lib/rank";
import { TEXT } from "@/lib/text";
import type { AsyncState } from "@/lib/use-async";

/**
 * A route's summary and any warnings the API attached (an endpoint moved to the nearest road, a
 * closure on the way), then a slot the map fills with the registry's turn-by-turn list (it lives
 * inside the map so hovering a step can highlight its stretch of the line).
 */
export function Directions({ state, mode, lang, onRetry, stepsSlot }: { state: AsyncState<RouteResult>; mode: TravelMode; lang: Lang; onRetry: () => void; stepsSlot: (el: HTMLDivElement | null) => void }) {
  const t = TEXT[lang];
  const modeWord = mode === "auto" ? t.driveWord : t.walkWord;
  if (state.status === "loading" || state.status === "idle")
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
        <Spinner /> {t.routeLoading}
      </p>
    );
  if (state.status === "error") return <ApiProblemAlert error={state.error} lang={lang} onRetry={onRetry} />;
  const route = state.data;
  return (
    <div className="flex flex-col gap-2" data-route="">
      <p className="text-sm font-medium tabular-nums" aria-live="polite">
        {format(t.routeSummary, { time: formatDuration(route.durationSeconds, lang), distance: formatDistance(route.distanceMeters, lang), mode: modeWord })}
      </p>
      {route.warnings?.map((w) => (
        <Alert key={`${w.code}-${w.where ?? ""}`} data-warning={w.code}>
          <InfoIcon />
          <AlertTitle>{t.relocated}</AlertTitle>
          <AlertDescription>{w.message}</AlertDescription>
        </Alert>
      ))}
      {route.steps?.length ? (
        <section aria-label={t.steps}>
          <h3 className="mb-1 text-xs font-medium text-muted-foreground">{t.steps}</h3>
          <div ref={stepsSlot} />
        </section>
      ) : null}
    </div>
  );
}
