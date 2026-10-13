# Features

What Places does, which Unmap API does it, and what it deliberately does not do.

## Implemented

| Feature | How | Unmap |
| --- | --- | --- |
| Map of every branch | registry `map`; branches as a `cluster-layer` that splits as you zoom, so none hides under another on a phone | Maps API (`/styles`, `/tiles`) |
| Search a city, postal code or address | registry `geocoder`, leaning towards Calgary, in English or French | Geocoding (`/geocode/autocomplete`) |
| Use my location | the browser's geolocation, never stored | — |
| Rank by travel time | one origin against at most 10 branches per call, calls sent together; driving or walking | Routing · Matrix (`POST /matrix`) |
| Rank by distance | straight line, worked out in the browser and labelled "in a straight line" | — |
| Closest branch | the top of the travel-time order, badged "Closest" | Matrix |
| A branch with no travel time | the matrix cell is null; the row says "No travel time" and a note says it is not proof there is no road | Matrix |
| Matrix not enabled on a deployment | the 404 is shown as one sentence and the list falls back to straight-line order | Matrix |
| Directions to a branch | summary time and distance, warnings the API attaches (an endpoint moved to the nearest road), turn-by-turn steps in en/fr; hovering a step highlights its stretch | Routing (`/route` with `steps`, `lang`), registry `route-line`, `route-steps` |
| Reachable area | 10- and 20-minute bands round the branch, by car or on foot | Routing · Isochrone (`/isochrone`), registry `geojson-layer` |
| Errors | every API failure shown where its answer would have been, in en/fr, with the gateway's own message and a retry when waiting could help (400/401/403/404/422/429/5xx, network) | — |
| List and map in step | one selected id; select a row or a point, the other follows | — |
| Filter by service | client-side, on the sample `services` field | — |
| Load your own stores | a GeoJSON file read and validated in the browser (`parseStores`), labelled "Your file", never uploaded; 5 MB cap; every problem listed | — |
| Branch details | address, phone, this week's hours with today marked, services, open now | — (sample data) |
| Shareable state | `?from=&label=&store=&mode=&sort=&lang=` | — |
| English and French | the header switch; map labels, search results and route steps follow | Maps, Geocoding and Routing `lang` |
| No-key state | lists the branches and explains how to get a key; never calls the API without one | — |
| Built with Unmap | the services, calls, components and data sources behind the page | — |

Requests are made only when you act (a search, a mode change, a branch's buttons), never on map
movement; an obsolete request is cancelled when a newer one replaces it, and the browser smoke
tests fail if the same call is made twice.

## Not goals

Business accounts, bookings, store management, and verified or live opening hours (spec §4
non-goals). Unmap does not supply the business data: names, hours, phones and services are sample
data and are labelled so.
