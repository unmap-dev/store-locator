# Data sources

Everything on screen, where it comes from, and how far to trust it.

| What | Source | Licence | Live? |
| --- | --- | --- | --- |
| Basemap (streets, labels, water, parks) | Unmap Maps API, built from OpenStreetMap | ODbL, © OpenStreetMap contributors | Live |
| Search results | Unmap Geocoding API (open address and place data; see unmap.dev/attribution) | per source | Live |
| Travel times, routes, turn-by-turn steps, reachable areas | Unmap Routing API, on the OpenStreetMap road network | ODbL, © OpenStreetMap contributors | Live |
| Store names, addresses, phone numbers, opening hours, services | **Sample data**, invented for this app: `data/stores.sample.json` | Free to reuse | No |

## The sample network

Prairie Lantern Co. is a **fictional** retailer. Its 20 branches are placed at approximate points
in real Calgary neighbourhoods so that the map, search and routing have something real to work
with, but:

- the business, branch names and services do not exist;
- the street addresses are plausible but invented, and the coordinates are approximate (a branch
  may sit mid-block or across the street from its address);
- the phone numbers use 403-555-0100 to 0119, part of the range reserved for fiction;
- the opening hours are invented and are interpreted in Calgary time (`America/Edmonton`).

The app labels this as sample data wherever it is shown (the header, each branch's details and the
Built with Unmap panel). Unmap does not supply business names, hours, phone numbers or services:
the Unmap Places API returns names, locations and addresses of points of interest from open data.

## Accuracy and limitations

- "Open" and "closed" are worked out in your browser from the sample hours. They are not verified
  and there are no holiday hours.
- The straight-line distance is "as the crow flies", not a travel distance, and is labelled as such.
- Travel times come from the road network without live traffic; they are typical, not current.
- A branch with no travel time means the Matrix API had no answer for that pair, not that no road
  reaches it; directions may still work.
- Routing and search cover Canada.
