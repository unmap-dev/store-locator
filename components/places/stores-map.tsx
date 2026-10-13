"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import type { FeatureCollection, RouteResult } from "@unmap/sdk";
import { ClusterLayer } from "@/components/ui/cluster-layer";
import { GeoJSONLayer } from "@/components/ui/geojson-layer";
import { Map } from "@/components/ui/map";
import { MapControls } from "@/components/ui/map-controls";
import { Marker } from "@/components/ui/marker-popup";
import { RouteLine } from "@/components/ui/route-line";
import { API_KEY, GATEWAY } from "@/lib/kit/config";
import { format, type Lang } from "@/lib/kit/i18n";
import { useMap } from "@/lib/map-context";
import { boundsOf, type Store } from "@/lib/stores";
import { TEXT } from "@/lib/text";
import type { Origin } from "@/lib/url";

const reduceMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
type Bounds = [number, number, number, number];

function extend(b: Bounds | null, p: readonly [number, number]): Bounds {
  return b ? [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])] : [p[0], p[1], p[0], p[1]];
}

/**
 * Moves the camera when the question changes, never on every render: every store when the set
 * changes, the searched place with its nearest branches when a place is chosen, the route when
 * directions arrive, and the selected branch when one is picked.
 */
function Camera({ stores, nearest, origin, selected, route }: { stores: readonly Store[]; nearest: readonly Store[]; origin: Origin | null; selected: Store | null; route: RouteResult | null }) {
  const map = useMap();
  const fit = (b: Bounds | null, maxZoom = 14) => {
    if (!map || !b) return;
    map.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 56, maxZoom, duration: reduceMotion() ? 0 : 600 });
  };
  const storesKey = stores.map((s) => s.id).join(",");
  const originKey = origin?.coordinates.join(",") ?? "";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!origin) fit(boundsOf(stores)); }, [map, storesKey, originKey]);
  useEffect(() => {
    if (!origin) return;
    fit(nearest.slice(0, 3).reduce<Bounds | null>((b, s) => extend(b, s.coordinates), extend(null, origin.coordinates)), 15);
    // Frame the place once per search, with the branches nearest it at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, originKey]);
  useEffect(() => {
    if (!map || !selected || route) return;
    map.easeTo({ center: selected.coordinates, zoom: Math.max(map.getZoom(), 13), duration: reduceMotion() ? 0 : 500 });
  }, [map, selected, route]);
  useEffect(() => {
    if (route) fit(route.geometry.coordinates.reduce<Bounds | null>((b, c) => extend(b, c as [number, number]), null), 16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, route]);
  return null;
}

export interface StoresMapProps {
  stores: readonly Store[];
  /** Branches nearest first, for framing a search. */
  nearest: readonly Store[];
  selected: string | null;
  origin: Origin | null;
  route: RouteResult | null;
  reach: FeatureCollection | null;
  /**
   * Rendered inside the map's provider. The panel's map-aware registry parts (the geocoder and the
   * turn-by-turn list) arrive here as portals into the panel, so they reach the map's context.
   */
  children?: ReactNode;
  onSelect: (id: string) => void;
  lang: Lang;
  brand: string;
}

/**
 * The live map: branches as the registry ClusterLayer (they split as you zoom, so none hide under
 * another on a phone), a pin on the selected one and on the searched place, the route and the
 * reachable-area bands. Every layer is a registry component.
 */
export function StoresMap({ stores, nearest, selected, origin, route, reach, onSelect, lang, brand, children }: StoresMapProps) {
  const t = TEXT[lang];
  const current = stores.find((s) => s.id === selected) ?? null;
  const points = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: stores.map((s) => ({ type: "Feature" as const, id: s.id, geometry: { type: "Point" as const, coordinates: s.coordinates }, properties: { id: s.id, name: s.name } })),
    }),
    [stores],
  );
  return (
    <div role="region" aria-label={format(t.mapLabel, { brand })} className="relative h-full min-h-0">
      <Map apiKey={API_KEY} gateway={GATEWAY} style="base" lang={lang} center={[-114.07, 51.04]} zoom={10} controls={false} className="rounded-none" containerStyle={{ position: "absolute", inset: 0, minHeight: 0 }}>
        <Camera stores={stores} nearest={nearest} origin={origin} selected={current} route={route} />
        <MapControls position="bottom-right" />
        {reach ? (
          <GeoJSONLayer
            id="places-reach"
            data={reach as never}
            fillPaint={{ "fill-opacity": ["interpolate", ["linear"], ["get", "contour"], 10, 0.22, 20, 0.1] }}
            linePaint={{ "line-width": 1.5, "line-opacity": 0.6 }}
            circlePaint={false}
          />
        ) : null}
        {route ? <RouteLine coordinates={route.geometry.coordinates as [number, number][]} /> : null}
        <ClusterLayer id="places-stores" data={points as never} onClick={(e) => onSelect(String(e.feature.properties.id))} />
        {origin ? (
          <Marker
            lngLat={origin.coordinates}
            markerContent={<span aria-label={origin.label} data-origin-pin="" className="block size-4 rounded-full border-4 border-background bg-foreground shadow-md" />}
          />
        ) : null}
        {current ? (
          <Marker
            key={current.id}
            lngLat={current.coordinates}
            markerContent={<span aria-label={current.name} data-store-pin={current.id} className="block size-7 rounded-full border-[3px] border-background bg-primary shadow-lg" />}
          />
        ) : null}
        {children}
      </Map>
    </div>
  );
}
