"use client";

import { format, type Lang } from "@/lib/kit/i18n";
import { DAY_NAMES, clock, openStatus, type Store } from "@/lib/stores";
import { TEXT } from "@/lib/text";

/** "Open · closes 7:00 p.m." from the store's (sample) hours, in Calgary time. */
export function OpenStatus({ store, now, lang }: { store: Store; now: Date; lang: Lang }) {
  const t = TEXT[lang];
  const status = openStatus(store, now);
  if (status.open) return <span className="text-foreground">{format(t.open, { time: clock(status.closesAt, lang) })}</span>;
  if (!status.opensAt || !status.opensDay) return <span>{t.closedForGood}</span>;
  const sameDay = status.opensDay === openStatusDay(now);
  return (
    <span>
      {sameDay
        ? format(t.closedToday, { time: clock(status.opensAt, lang) })
        : format(t.closed, { day: DAY_NAMES[status.opensDay][lang], time: clock(status.opensAt, lang) })}
    </span>
  );
}

function openStatusDay(now: Date) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Edmonton", weekday: "short" }).format(now).toLowerCase().slice(0, 3);
}
