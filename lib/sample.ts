import { parseStores, type Store } from "@/lib/stores";
import raw from "@/data/stores.sample.json";

/** The bundled sample network. Replace data/stores.sample.json with your own stores. */
export const SAMPLE_STORES: Store[] = parseStores(raw);

export const SAMPLE_BRAND = "Prairie Lantern Co.";
