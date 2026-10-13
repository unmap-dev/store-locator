"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Lang } from "@/lib/kit/i18n";
import { SERVICES, type ServiceId } from "@/lib/stores";
import { TEXT } from "@/lib/text";

/** Filter by sample services: a branch must offer every one that is on. */
export function ServiceFilter({ value, onChange, lang }: { value: ServiceId[]; onChange: (value: ServiceId[]) => void; lang: Lang }) {
  const t = TEXT[lang];
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-xs text-muted-foreground">{t.servicesHint}</legend>
      <ToggleGroup multiple variant="outline" size="sm" value={value} onValueChange={(v) => onChange(v as ServiceId[])} aria-label={t.services} className="flex-wrap">
        {(Object.keys(SERVICES) as ServiceId[]).map((id) => (
          <ToggleGroupItem key={id} value={id}>
            {SERVICES[id][lang]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </fieldset>
  );
}
