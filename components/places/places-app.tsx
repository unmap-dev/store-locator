"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { NavigationIcon, TimerIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { RouteSteps } from "@/components/ui/route-steps";
import { useDirections } from "@/hooks/use-directions";
import { useReach } from "@/hooks/use-reach";
import { useTravelTimes } from "@/hooks/use-travel-times";
import { ApiProblemAlert } from "@/lib/kit/api-problem";
import { API_KEY } from "@/lib/kit/config";
import { AppHeader } from "@/lib/kit/app-header";
import { format } from "@/lib/kit/i18n";
import { MissingKey } from "@/lib/kit/missing-key";
import { useLang } from "@/lib/kit/use-lang";
import { MANIFEST } from "@/lib/manifest";
import { REACH_MINUTES, rank } from "@/lib/rank";
import { SAMPLE_BRAND, SAMPLE_STORES } from "@/lib/sample";
import { filterByServices, type ServiceId } from "@/lib/stores";
import { TEXT } from "@/lib/text";
import { DEFAULT_STATE, parseState, writeState, type PlacesState } from "@/lib/url";
import { Directions } from "./directions";
import { SearchBox, SearchPanel } from "./search-panel";
import { ServiceFilter } from "./service-filter";
import { StoreDetails } from "./store-details";
import { StoreFile, type LoadedFile } from "./store-file";
import { StoreList, type Row } from "./store-list";
import { StoresMap } from "./stores-map";
import { TravelControls } from "./travel-controls";

/** Places' state, kept in the query string so a link reopens the same search, branch and mode. */
function usePlacesState(): [PlacesState, (patch: Partial<PlacesState>) => void] {
  const [state, setState] = useState<PlacesState>(DEFAULT_STATE);
  useEffect(() => {
    // The URL only exists after mount in a static export.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(parseState(window.location.search));
  }, []);
  const update = useCallback((patch: Partial<PlacesState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${writeState(window.location.search, next)}`);
      return next;
    });
  }, []);
  return [state, update];
}

/** The time the open/closed labels are worked out at, refreshed each minute. */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * Places: a store locator for a fictional retail network. The stores are sample data, filtered
 * here; the map, search, travel times, directions and reachable areas are live Unmap.
 */
export function PlacesApp() {
  const [lang, setLang] = useLang();
  const [state, update] = usePlacesState();
  const [services, setServices] = useState<ServiceId[]>([]);
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [showReach, setShowReach] = useState(false);
  const [stepsTarget, setStepsTarget] = useState<HTMLDivElement | null>(null);
  const [geocoderTarget, setGeocoderTarget] = useState<HTMLDivElement | null>(null);
  const now = useNow();
  const t = TEXT[lang];
  const { origin, mode, sort, store: selected } = state;

  const stores = useMemo(() => filterByServices(file?.stores ?? SAMPLE_STORES, services), [file, services]);
  const current = stores.find((s) => s.id === selected) ?? null;

  const [times, retryTimes] = useTravelTimes(API_KEY ? (origin?.coordinates ?? null) : null, stores, mode);
  const matrixOff = times.status === "error" && (times.error as { status?: number }).status === 404;
  const travel = times.status === "done" ? times.data : undefined;
  const rows: Row[] = useMemo(() => {
    if (!origin) return stores.map((store) => ({ store, ranked: null }));
    return rank(stores, origin.coordinates, matrixOff ? "distance" : sort, travel).map((ranked) => ({ store: ranked.store, ranked }));
  }, [stores, origin, sort, travel, matrixOff]);
  const someNull = !!travel && rows.some((r) => r.ranked && r.ranked.seconds == null);

  const [route, retryRoute] = useDirections(origin?.coordinates ?? null, current?.coordinates ?? null, mode, lang, showRoute && !!API_KEY);
  const [reach, retryReach] = useReach(current?.coordinates ?? null, mode, showReach && !!API_KEY);

  const select = (id: string | null) => {
    update({ store: id });
    setShowRoute(false);
    setShowReach(false);
  };

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader manifest={MANIFEST} lang={lang} onLang={setLang} />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="order-last flex min-h-0 flex-1 flex-col overflow-y-auto border-t lg:order-first lg:w-[400px] lg:flex-none lg:border-t-0 lg:border-r">
          <div className="flex flex-col gap-3 p-3">
            {API_KEY ? <SearchPanel origin={origin} onOrigin={(o) => update({ origin: o })} lang={lang} geocoderSlot={setGeocoderTarget} /> : null}
            {origin ? <TravelControls mode={mode} sort={sort} onMode={(m) => update({ mode: m })} onSort={(s) => update({ sort: s })} lang={lang} /> : null}
            {origin && times.status === "error" ? (
              matrixOff ? (
                <Alert>
                  <AlertDescription>{t.matrixOff}</AlertDescription>
                </Alert>
              ) : (
                <ApiProblemAlert error={times.error} lang={lang} onRetry={retryTimes} />
              )
            ) : null}
            {someNull ? <p className="text-xs text-muted-foreground">{t.noTimeNote}</p> : null}
            <ServiceFilter value={services} onChange={setServices} lang={lang} />
            <StoreFile
              loaded={file}
              onLoad={(f) => {
                setFile(f);
                select(null);
              }}
              lang={lang}
            />
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {stores.length === 1 ? t.branchesOne : format(t.branches, { n: stores.length })}
              {file ? "" : ` · ${t.hoursNote}`}
              {origin && times.status === "loading" ? ` · ${t.timesLoading}` : ""}
            </p>
            {current ? (
              <StoreDetails
                store={current}
                fromFile={!!file}
                now={now}
                lang={lang}
                onClose={() => select(null)}
                actions={
                  API_KEY ? (
                    <>
                      <Button size="sm" variant={showRoute ? "secondary" : "default"} onClick={() => setShowRoute((v) => !v)} disabled={!origin} title={origin ? undefined : t.needOrigin}>
                        <NavigationIcon />
                        {showRoute ? t.hideDirections : t.directions}
                      </Button>
                      <Button size="sm" variant="outline" aria-pressed={showReach} onClick={() => setShowReach((v) => !v)}>
                        <TimerIcon />
                        {showReach ? t.hideReach : t.reach}
                      </Button>
                    </>
                  ) : null
                }
              >
                {API_KEY && !origin ? <p className="text-xs text-muted-foreground">{t.needOrigin}</p> : null}
                {showReach ? (
                  reach.status === "error" ? (
                    <ApiProblemAlert error={reach.error} lang={lang} onRetry={retryReach} />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {REACH_MINUTES[mode].map((m) => format(t.reachLegend, { minutes: m, mode: mode === "auto" ? t.driveWord : t.walkWord })).join(" · ")}
                    </p>
                  )
                ) : null}
                {showRoute && origin ? <Directions state={route} mode={mode} lang={lang} onRetry={retryRoute} stepsSlot={setStepsTarget} /> : null}
              </StoreDetails>
            ) : null}
          </div>
          {rows.length ? (
            <StoreList rows={rows} selected={selected} now={now} lang={lang} mode={mode} sort={matrixOff ? "distance" : sort} timesLoading={times.status === "loading"} onSelect={select} />
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyDescription>{t.noneMatch}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" size="sm" onClick={() => setServices([])}>
                  {t.clearFilters}
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </aside>
        <main className="h-[45dvh] shrink-0 lg:h-auto lg:min-w-0 lg:flex-1">
          {API_KEY ? (
            <StoresMap
              stores={stores}
              nearest={rows.map((r) => r.store)}
              selected={selected}
              origin={origin}
              route={showRoute && route.status === "done" ? route.data : null}
              reach={showReach && reach.status === "done" ? reach.data : null}
              onSelect={select}
              lang={lang}
              brand={SAMPLE_BRAND}
            >
              <SearchBox target={geocoderTarget} onOrigin={(o) => update({ origin: o })} lang={lang} resetKey={origin ? "set" : "empty"} />
              {showRoute && route.status === "done" && route.data.steps?.length && stepsTarget
                ? createPortal(<RouteSteps steps={route.data.steps} coordinates={route.data.geometry.coordinates as [number, number][]} lang={lang} />, stepsTarget)
                : null}
            </StoresMap>
          ) : (
            <MissingKey lang={lang} />
          )}
        </main>
      </div>
    </div>
  );
}
