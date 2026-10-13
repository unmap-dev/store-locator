"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { LocateFixedIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Geocoder } from "@/components/ui/geocoder";
import { API_KEY, GATEWAY } from "@/lib/kit/config";
import { format, type Lang } from "@/lib/kit/i18n";
import { TEXT } from "@/lib/text";
import type { Origin } from "@/lib/url";

/** Search results lean towards the sample network's city. */
const CALGARY: [number, number] = [-114.07, 51.04];

/**
 * The registry Geocoder (Unmap Geocoding, `/geocode/autocomplete`), rendered inside the map's
 * provider (it reads the map) and portalled into the search panel's slot.
 */
export function SearchBox({ target, onOrigin, lang, resetKey }: { target: HTMLElement | null; onOrigin: (origin: Origin) => void; lang: Lang; resetKey: string }) {
  const t = TEXT[lang];
  if (!target) return null;
  return createPortal(
    <Geocoder
      key={resetKey}
      apiKey={API_KEY}
      gateway={GATEWAY}
      lang={lang}
      limit={6}
      proximity={CALGARY}
      placeholder={t.searchPlaceholder}
      emptyText={t.searchEmpty}
      onSelect={(r) => onOrigin({ coordinates: [r.lng, r.lat], label: r.name })}
    />,
    target,
  );
}

/**
 * Where to rank branches from: a place typed into the search box (rendered by SearchBox into
 * `geocoderSlot`), or the browser's own location.
 */
export function SearchPanel({ origin, onOrigin, lang, geocoderSlot }: { origin: Origin | null; onOrigin: (origin: Origin | null) => void; lang: Lang; geocoderSlot: (el: HTMLDivElement | null) => void }) {
  const t = TEXT[lang];
  const [locating, setLocating] = useState(false);
  const [denied, setDenied] = useState(false);

  const locate = () => {
    if (!("geolocation" in navigator)) return setDenied(true);
    setLocating(true);
    setDenied(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onOrigin({ coordinates: [Number(pos.coords.longitude.toFixed(5)), Number(pos.coords.latitude.toFixed(5))], label: t.myLocation });
      },
      () => {
        setLocating(false);
        setDenied(true);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  return (
    <div role="search" aria-label={t.searchLabel} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div ref={geocoderSlot} className="min-w-0 flex-1" />
        <Button variant="outline" size="icon" aria-label={locating ? t.locating : t.useLocation} title={t.useLocation} onClick={locate} disabled={locating}>
          <LocateFixedIcon />
        </Button>
      </div>
      {denied ? <p className="text-xs text-muted-foreground">{t.locationDenied}</p> : null}
      {origin ? (
        <p className="flex items-center gap-1 text-sm">
          <span className="min-w-0 truncate">{format(t.from, { place: origin.label })}</span>
          <Button variant="ghost" size="icon-xs" aria-label={t.clearOrigin} onClick={() => onOrigin(null)}>
            <XIcon />
          </Button>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">{t.pickOrigin}</p>
      )}
    </div>
  );
}
