import type { DemoManifest } from "@/lib/kit/provenance";

/**
 * What the "Built with Unmap" panel and the header say about Places. Lists only what the app really
 * calls; a service is added here in the same change that starts calling it.
 */
export const MANIFEST: DemoManifest = {
  slug: "places",
  name: { en: "Places · store locator", fr: "Places · localisateur de magasins" },
  tagline: {
    en: "Find the nearest branch of a retail network, with live Unmap maps.",
    fr: "Trouvez la succursale la plus proche d'un réseau de détail, avec les cartes Unmap en direct.",
  },
  services: [
    {
      name: "Maps",
      role: {
        en: "The basemap under the stores: vector tiles and the base style, with labels in the page's language.",
        fr: "La carte de base sous les magasins : tuiles vectorielles et style de base, étiquettes dans la langue de la page.",
      },
      calls: ['<Map apiKey={key} style="base" lang={lang} />'],
      docs: "https://unmap.dev/docs/apis/maps",
    },
    {
      name: "Geocoding",
      role: {
        en: "The search box: city, postal code or street address to a point, as you type, leaning towards Calgary.",
        fr: "La recherche : ville, code postal ou adresse vers un point, à la frappe, en privilégiant Calgary.",
      },
      calls: ["<Geocoder apiKey={key} proximity={[-114.07, 51.04]} onSelect={…} />  // GET /geocode/autocomplete"],
      docs: "https://unmap.dev/docs/apis/geocoding",
    },
    {
      name: "Routing · Matrix",
      role: {
        en: "Driving or walking time and distance from the searched place to every branch, which orders the list. At most 10 branches per call; a branch with no answer is said so, not guessed.",
        fr: "Temps et distance en auto ou à pied du lieu cherché vers chaque succursale, qui ordonnent la liste. Au plus 10 succursales par appel; une succursale sans réponse est indiquée, jamais devinée.",
      },
      calls: ['unmap.router.matrix([origin], branches, { mode: "auto" })'],
      docs: "https://unmap.dev/docs/apis/routing",
    },
    {
      name: "Routing · Directions",
      role: {
        en: "The route from the searched place to the chosen branch, with turn-by-turn steps in English or French and any warning the API attaches.",
        fr: "L'itinéraire du lieu cherché à la succursale choisie, étape par étape en français ou en anglais, avec les avertissements de l'API.",
      },
      calls: ['unmap.router.route(origin, branch, { mode: "auto", steps: true, lang })'],
      docs: "https://unmap.dev/docs/apis/routing",
    },
    {
      name: "Routing · Isochrone",
      role: {
        en: "The area reachable from a branch within 10 and 20 minutes, by car or on foot.",
        fr: "La zone accessible depuis une succursale en 10 et 20 minutes, en auto ou à pied.",
      },
      calls: ['unmap.router.isochrone(branch, { minutes: [10, 20], mode: "auto" })'],
      docs: "https://unmap.dev/docs/apis/routing",
    },
  ],
  items: ["map", "geocoder", "cluster-layer", "marker-popup", "route-line", "route-steps", "geojson-layer", "map-controls"],
  provenance: [
    {
      kind: "sample",
      label: {
        en: "Prairie Lantern Co.: branch names, addresses, phone numbers, hours and services",
        fr: "Prairie Lantern Co. : noms des succursales, adresses, numéros de téléphone, heures et services",
      },
      source: "Fictional, written for this demo (data/stores.sample.json)",
    },
    {
      kind: "live",
      label: { en: "Search results, travel times, routes and reachable areas", fr: "Résultats de recherche, temps de trajet, itinéraires et zones accessibles" },
      source: "Unmap",
      attribution: "Routing © OpenStreetMap contributors",
    },
    {
      kind: "live",
      label: { en: "Basemap", fr: "Carte de base" },
      source: "Unmap",
      attribution: "© unmap © OpenStreetMap contributors",
    },
  ],
  source: "https://github.com/unmap-dev/store-locator",
};
