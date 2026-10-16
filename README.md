# Store Locator, built with Unmap

A store and branch locator for a retail network: search a city, postal code or address and the
branches are ranked by real driving or walking time, with the straight-line distance beside it;
pick one for its hours, turn-by-turn directions and the area you can reach from it in 10 or 20
minutes. One of the [Unmap apps](https://unmap.dev/apps); live at
[apps.unmap.dev/store-locator](https://apps.unmap.dev/store-locator/).

The stores belong to **Prairie Lantern Co., a fictional retailer**. Every name, address, phone
number, opening hour and service is sample data (see [`DATA_SOURCES.md`](DATA_SOURCES.md)); the map
is live Unmap. Replace the sample with your own stores and it is your locator.

> See [`FEATURES.md`](FEATURES.md) for what is in, which Unmap API does each part, and what is
> deliberately not.

## Run it

You need Node 24, pnpm and a free Unmap browser key from
[unmap.dev/dashboard](https://unmap.dev/dashboard).

```bash
cp .env.example .env.local      # then set NEXT_PUBLIC_UNMAP_KEY
pnpm install
pnpm dev                        # http://localhost:3201
```

Without a key the app still lists the stores and says how to get one; it never calls the API with
a missing key.

| Command | |
| --- | --- |
| `pnpm dev` | development server on port 3201 |
| `pnpm build` | static export in `out/` |
| `pnpm test` | unit and component tests (Vitest) |
| `pnpm lint` / `pnpm typecheck` | |
| `pnpm run deploy` | build, then `wrangler deploy` to your Cloudflare account (edit `wrangler.jsonc` first) |

The key ships in the browser bundle. Restrict it to your origins (`http://localhost:3201` and your
domain) in the dashboard. Any static host works: `out/` is plain files.

## Use your own stores

Replace [`data/stores.sample.json`](data/stores.sample.json) with a GeoJSON FeatureCollection of
points. Each feature's `properties`:

| Field | | |
| --- | --- | --- |
| `id` | required | unique, stable; used in the `?store=` link |
| `name`, `address` | required | |
| `branch`, `city`, `province`, `postalCode`, `phone` | optional | |
| `services` | optional | any of `pickup`, `repairs`, `rentals`, `returns`, `accessible`, `parking`, `ev`; edit `SERVICES` in `lib/stores.ts` for your own |
| `hours` | optional | `{ "mon": "09:00-19:00", …, "sun": null }`, local time; `null` is closed |

To try a file without changing the code, use **Load your stores** in the app: it reads the file in
your browser, checks it the same way, and never uploads it. Coordinates are `[longitude, latitude]` in WGS84. `parseStores()` in `lib/stores.ts` validates the
file and lists every problem it finds. Set the time zone your hours are in with `STORE_TIME_ZONE`.
Then update the `sample` entry in `lib/manifest.ts` and `DATA_SOURCES.md`, since your data is no
longer a sample.

## How it is built

```
app/page.tsx                 the one page; renders the app in the browser
components/places/           the app: list, filters, details, map pane
components/ui/  lib/map-*    Unmap registry components and shadcn primitives, copied in unmodified
lib/kit/                     the Unmap app kit (header, Built with Unmap panel, errors, en/fr), copied in
hooks/                       one hook per Unmap call: travel times (matrix), directions, reachable area
lib/stores.ts                the store model: validation, filters, open hours, distances (no React, no fetch)
lib/rank.ts                  ordering by travel time or straight line; matrix batching (no React, no fetch)
lib/url.ts                   the query-string state: ?from=&label=&store=&mode=&sort=&lang=
lib/manifest.ts              what the Built with Unmap panel lists
lib/text.ts                  this app's words in English and French
data/stores.sample.json      the sample network
```

Layers run one way: components → hooks → `lib/` (plain TypeScript, unit-tested) → `@unmap/sdk`,
the only thing that talks to the API. The map is the Unmap registry's `map` component; install the
same components in your own project with
`npx @unmap/cli add map geocoder cluster-layer marker-popup route-line route-steps geojson-layer map-controls`.

In the Unmap monorepo the copied files are kept in step by `pnpm sync` and `test/sync.test.ts`; in
your own copy they are ordinary source you can edit.

## Licence

Code: MIT. The sample data is fictional and free to reuse. Map data © OpenStreetMap contributors
(ODbL), served by Unmap.
