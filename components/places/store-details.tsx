"use client";

import type { ReactNode } from "react";
import { PhoneIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, type Lang } from "@/lib/kit/i18n";
import { ProvenanceBadge } from "@/lib/kit/provenance-badge";
import { DAYS, DAY_NAMES, SERVICES, clock, localTime, type Store } from "@/lib/stores";
import { TEXT } from "@/lib/text";
import { OpenStatus } from "./open-status";

const WEEK = [...DAYS.slice(1), DAYS[0]!];

/** A selected branch: address, phone, this week's hours and its services. All sample data. */
/** `fromFile`: the store came from a file the visitor loaded, so it is theirs, not sample data. */
export function StoreDetails({ store, now, lang, onClose, actions, children, fromFile = false }: { store: Store; now: Date; lang: Lang; onClose: () => void; actions?: ReactNode; children?: ReactNode; fromFile?: boolean }) {
  const t = TEXT[lang];
  const today = localTime(now).day;
  return (
    <Card size="sm" data-store-details={store.id}>
      <CardHeader>
        <CardTitle>{store.name}</CardTitle>
        <CardDescription>
          {store.address}, {store.city} {store.postalCode}
        </CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label={t.close} onClick={onClose}>
            <XIcon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <OpenStatus store={store} now={now} lang={lang} />
          {fromFile ? <Badge variant="outline" data-provenance="user">{t.yourFile}</Badge> : <ProvenanceBadge kind="sample" lang={lang} />}
        </div>
        <div className="flex flex-wrap gap-2">
          {actions}
          {store.phone ? (
            <a href={`tel:${store.phone.replace(/[^+\d]/g, "")}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <PhoneIcon />
              {format(t.call, { phone: store.phone })}
            </a>
          ) : null}
        </div>
        {children}
        <div>
          <h3 className="mb-1 text-xs font-medium text-muted-foreground">{fromFile ? t.hoursPlain : t.hours}</h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5">
            {WEEK.map((day) => {
              const hours = store.hours[day];
              return (
                <div key={day} className="contents" data-today={day === today ? "" : undefined}>
                  <dt className={day === today ? "font-medium" : "text-muted-foreground"}>{DAY_NAMES[day][lang]}</dt>
                  <dd className={day === today ? "font-medium" : undefined}>
                    {hours ? `${clock(hours.slice(0, 5), lang)} – ${clock(hours.slice(6), lang)}` : t.closedForGood}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
        {store.services.length ? (
          <ul className="flex flex-wrap gap-1.5" aria-label={t.services}>
            {store.services.map((id) => (
              <li key={id}>
                <Badge variant="secondary">{SERVICES[id][lang]}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
