/**
 * The store model, and everything Places works out about stores without asking the API: which
 * services a branch offers, whether it is open now, how far it is in a straight line. Plain
 * TypeScript, no React, no fetch; unit-tested in test/stores.test.ts.
 *
 * Store names, addresses, phone numbers, hours and services are SAMPLE DATA
 * (data/stores.sample.json, DATA_SOURCES.md). Replace that file with your own FeatureCollection of
 * the same shape, or load one in the browser; parseStores() says what is wrong with it.
 */
import type { Lang, Text } from "@/lib/kit/i18n";

export type Day = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export const DAYS: readonly Day[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export type ServiceId = "pickup" | "repairs" | "rentals" | "returns" | "accessible" | "parking" | "ev";

export const SERVICES: Record<ServiceId, Text> = {
  pickup: { en: "In-store pickup", fr: "Cueillette en magasin" },
  repairs: { en: "Bike and ski repairs", fr: "Réparation de vélos et de skis" },
  rentals: { en: "Gear rentals", fr: "Location d'équipement" },
  returns: { en: "Returns", fr: "Retours" },
  accessible: { en: "Step-free access", fr: "Accès sans marche" },
  parking: { en: "Parking", fr: "Stationnement" },
  ev: { en: "EV charging", fr: "Recharge de VÉ" },
};

export interface Store {
  id: string;
  name: string;
  branch: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  services: ServiceId[];
  /** "HH:MM-HH:MM" in the store's local time, or null when closed that day. */
  hours: Record<Day, string | null>;
  /** [lng, lat]. */
  coordinates: [number, number];
}

/** The time zone the sample stores keep their hours in. */
export const STORE_TIME_ZONE = "America/Edmonton";

const HOURS = /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-4]):([0-5]\d)$/;

export class StoreDataError extends Error {
  constructor(readonly problems: string[]) {
    super(problems.join("\n"));
    this.name = "StoreDataError";
  }
}

/**
 * A FeatureCollection of points as stores, or a StoreDataError listing every problem found. Used
 * for the bundled sample and for a file a visitor loads, so both are held to the same shape.
 */
export function parseStores(input: unknown): Store[] {
  const problems: string[] = [];
  const fc = input as { type?: unknown; features?: unknown };
  if (!fc || fc.type !== "FeatureCollection" || !Array.isArray(fc.features)) throw new StoreDataError(["Expected a GeoJSON FeatureCollection."]);
  const seen = new Set<string>();
  const stores: Store[] = [];
  fc.features.forEach((f: unknown, i: number) => {
    const feature = f as { geometry?: { type?: unknown; coordinates?: unknown }; properties?: Record<string, unknown> };
    const where = `Feature ${i + 1}`;
    const coords = feature?.geometry?.coordinates as unknown[] | undefined;
    if (feature?.geometry?.type !== "Point" || !Array.isArray(coords) || coords.length < 2) {
      problems.push(`${where}: geometry must be a Point.`);
      return;
    }
    const [lng, lat] = coords as number[];
    if (typeof lng !== "number" || typeof lat !== "number" || !Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90) {
      problems.push(`${where}: coordinates must be [longitude, latitude] in degrees (WGS84).`);
      return;
    }
    const p = feature.properties ?? {};
    const str = (key: string, required = true) => {
      const v = p[key];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (required) problems.push(`${where}: "${key}" is required.`);
      return "";
    };
    const id = str("id");
    if (id && seen.has(id)) problems.push(`${where}: duplicate id "${id}".`);
    seen.add(id);
    const services = Array.isArray(p.services) ? (p.services as unknown[]).filter((s): s is ServiceId => typeof s === "string" && s in SERVICES) : [];
    const rawHours = (p.hours ?? {}) as Record<string, unknown>;
    const hours = {} as Record<Day, string | null>;
    for (const day of DAYS) {
      const v = rawHours[day];
      if (v === null || v === undefined) hours[day] = null;
      else if (typeof v === "string" && HOURS.test(v)) hours[day] = v;
      else {
        problems.push(`${where}: hours.${day} must be "HH:MM-HH:MM" or null.`);
        hours[day] = null;
      }
    }
    stores.push({
      id,
      name: str("name"),
      branch: str("branch", false) || str("name", false),
      address: str("address"),
      city: str("city", false),
      province: str("province", false),
      postalCode: str("postalCode", false),
      phone: str("phone", false),
      services,
      hours,
      coordinates: [lng, lat],
    });
  });
  if (!stores.length && !problems.length) problems.push("The collection has no features.");
  if (problems.length) throw new StoreDataError(problems);
  return stores;
}

/** Stores offering every one of `services` (all of them when none are chosen). */
export function filterByServices(stores: readonly Store[], services: readonly ServiceId[]): Store[] {
  return stores.filter((s) => services.every((id) => s.services.includes(id)));
}

/** The weekday and minutes since midnight at `date` in `timeZone`. */
export function localTime(date: Date, timeZone = STORE_TIME_ZONE): { day: Day; minutes: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  const day = (parts.weekday as string).toLowerCase().slice(0, 3) as Day;
  return { day, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

export type OpenStatus = { open: true; closesAt: string } | { open: false; opensAt: string | null; opensDay: Day | null };

/** Whether a store is open at `date` by its (sample) hours, and when that changes. */
export function openStatus(store: Store, date: Date, timeZone = STORE_TIME_ZONE): OpenStatus {
  const { day, minutes } = localTime(date, timeZone);
  const today = store.hours[day];
  if (today) {
    const [from, to] = today.split("-") as [string, string];
    if (minutes >= toMinutes(from) && minutes < toMinutes(to)) return { open: true, closesAt: to };
    if (minutes < toMinutes(from)) return { open: false, opensAt: from, opensDay: day };
  }
  const start = DAYS.indexOf(day);
  for (let i = 1; i <= 7; i++) {
    const next = DAYS[(start + i) % 7]!;
    const hours = store.hours[next];
    if (hours) return { open: false, opensAt: hours.slice(0, 5), opensDay: next };
  }
  return { open: false, opensAt: null, opensDay: null };
}

/** Straight-line distance in metres (haversine). Not a travel distance: Places labels it so. */
export function straightLine(a: readonly [number, number], b: readonly [number, number]): number {
  const R = 6371008.8, rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad, dLng = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Stores nearest first, by straight line from `from`. */
export function byStraightLine(stores: readonly Store[], from: readonly [number, number]): { store: Store; metres: number }[] {
  return stores.map((store) => ({ store, metres: straightLine(from, store.coordinates) })).sort((a, b) => a.metres - b.metres);
}

/** [west, south, east, north] around the stores. */
export function boundsOf(stores: readonly Store[]): [number, number, number, number] | null {
  if (!stores.length) return null;
  const lngs = stores.map((s) => s.coordinates[0]), lats = stores.map((s) => s.coordinates[1]);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}

export const DAY_NAMES: Record<Day, Text> = {
  mon: { en: "Monday", fr: "lundi" },
  tue: { en: "Tuesday", fr: "mardi" },
  wed: { en: "Wednesday", fr: "mercredi" },
  thu: { en: "Thursday", fr: "jeudi" },
  fri: { en: "Friday", fr: "vendredi" },
  sat: { en: "Saturday", fr: "samedi" },
  sun: { en: "Sunday", fr: "dimanche" },
};

/** "09:00" as "9:00 a.m." in English, "9 h" in French. */
export function clock(hhmm: string, lang: Lang): string {
  const h = Number(hhmm.slice(0, 2)), m = Number(hhmm.slice(3, 5));
  if (lang === "fr") return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
  const suffix = h < 12 || h === 24 ? "a.m." : "p.m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}
