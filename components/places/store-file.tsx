"use client";

import { useRef, useState } from "react";
import { FileUpIcon, UndoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, type Lang } from "@/lib/kit/i18n";
import { StoreDataError, parseStores, type Store } from "@/lib/stores";
import { TEXT } from "@/lib/text";

const MAX_BYTES = 5 * 1024 * 1024;

export interface LoadedFile {
  name: string;
  stores: Store[];
}

/**
 * Load a GeoJSON file of stores in the browser (spec §4, optional enhancement). The file is read
 * and validated here with parseStores(), the same check the sample passes; it is never uploaded.
 */
export function StoreFile({ loaded, onLoad, lang }: { loaded: LoadedFile | null; onLoad: (file: LoadedFile | null) => void; lang: Lang }) {
  const t = TEXT[lang];
  const input = useRef<HTMLInputElement>(null);
  const [problems, setProblems] = useState<string[] | null>(null);

  const read = async (file: File) => {
    setProblems(null);
    if (file.size > MAX_BYTES) return setProblems([t.fileTooBig]);
    let json: unknown;
    try {
      json = JSON.parse(await file.text());
    } catch {
      return setProblems([t.fileNotJson]);
    }
    try {
      onLoad({ name: file.name, stores: parseStores(json) });
    } catch (e) {
      setProblems(e instanceof StoreDataError ? e.problems : [String(e)]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={input}
          type="file"
          accept=".geojson,.json,application/geo+json,application/json"
          className="sr-only"
          aria-label={t.loadFile}
          data-store-file=""
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void read(file);
          }}
        />
        <Button variant="outline" size="sm" onClick={() => input.current?.click()} title={t.loadFileHint}>
          <FileUpIcon />
          {t.loadFile}
        </Button>
        {loaded ? (
          <>
            <Badge variant="outline" data-provenance="user">{t.yourFile}</Badge>
            <span className="text-xs text-muted-foreground">{format(t.fileLoaded, { n: loaded.stores.length, file: loaded.name })}</span>
            <Button variant="ghost" size="sm" onClick={() => onLoad(null)}>
              <UndoIcon />
              {t.useSample}
            </Button>
          </>
        ) : null}
      </div>
      {problems ? (
        <Alert variant="destructive" data-file-problems="">
          <AlertTitle>{t.fileProblems}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {problems.slice(0, 5).map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            {problems.length > 5 ? <p>{format(t.moreProblems, { n: problems.length - 5 })}</p> : null}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
