"use client";

/**
 * <ClusterLayer> - many points drawn as clusters that split as you zoom in, on MapLibre's own
 * clustering. Clusters show their count and zoom in on click; single points report `onClick`.
 * `sum` adds up a property across each cluster (e.g. `sum={["beds"]}` gives `beds` on every
 * cluster feature).
 *
 * Colours default to your `--primary`, with counts in `--primary-foreground`.
 *
 * Copied into your project by `npx shadcn add`. Edit freely.
 */

import { useId } from "react";
import {
  accentColor,
  labelFont,
  themeMeta,
  tokenColor,
  useLayerPointer,
  useLayerSet,
  type BeforeId,
  type GeoJSONData,
  type LayerSpec,
  type MapFeatureEvent,
} from "@/lib/map-layers";

/** The last resort for count text when neither `--primary-foreground` nor `--background` resolves. */
const FALLBACK_LABEL = "#ffffff";

export interface ClusterLayerProps {
  /** Point features only (a FeatureCollection; MultiPoint is not clustered) or a URL MapLibre fetches. */
  data: GeoJSONData;
  /** Map id when multiple maps share a page. Defaults to "default". */
  mapId?: string;
  /** Source id and layer-id prefix. Defaults to a generated id. */
  id?: string;
  /** Cluster radius in pixels. Defaults to 50. */
  radius?: number;
  /** The last zoom at which points cluster. Defaults to 14. */
  maxZoom?: number;
  /** Point counts where clusters grow: [medium, large]. Defaults to [10, 100]. */
  steps?: [number, number];
  /** Numeric properties summed into each cluster's properties. */
  sum?: string[];
  /** Colour for clusters and points. Defaults to your --primary (or the theme accent). */
  color?: string;
  /** Called when a single point is clicked. */
  onClick?: (event: MapFeatureEvent) => void;
  /** Called instead of zooming in when a cluster is clicked. */
  onClusterClick?: (event: MapFeatureEvent & { count: number }) => void;
  /** Insertion point. Default: below the labels. `null`: on top. */
  beforeId?: BeforeId;
}

type ClusterSource = { getClusterExpansionZoom?: (clusterId: number) => Promise<number> };

export function ClusterLayer({
  data,
  mapId,
  id,
  radius = 50,
  maxZoom = 14,
  steps = [10, 100],
  sum,
  color,
  onClick,
  onClusterClick,
  beforeId,
}: ClusterLayerProps) {
  const generated = `unmap-clusters-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const sourceId = id ?? generated;
  const clustersId = `${sourceId}-clusters`;
  const pointsId = `${sourceId}-points`;

  const { map } = useLayerSet({
    mapId,
    sourceId,
    source: {
      cluster: true,
      clusterRadius: radius,
      clusterMaxZoom: maxZoom,
      ...(sum && sum.length > 0
        ? { clusterProperties: Object.fromEntries(sum.map((name) => [name, ["+", ["get", name]]])) }
        : {}),
    },
    data,
    beforeId,
    key: JSON.stringify([color, steps]),
    layers: (live) => {
      const colour = accentColor(live, color, themeMeta(live).marker?.color);
      const background = tokenColor(live, "--background");
      const label = tokenColor(live, "--primary-foreground") ?? background ?? FALLBACK_LABEL;
      return [
        {
          id: clustersId,
          type: "circle",
          source: sourceId,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": colour,
            "circle-radius": ["step", ["get", "point_count"], 16, steps[0], 22, steps[1], 30],
            "circle-stroke-color": background ?? colour,
            "circle-stroke-width": 2,
            "circle-opacity": 0.9,
          },
        },
        {
          id: `${sourceId}-count`,
          type: "symbol",
          source: sourceId,
          filter: ["has", "point_count"],
          // Symbols place top down and the counts sit below every base label: without these a
          // count that touches a city or road label is dropped.
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-font": labelFont(live),
            "text-size": 12,
            "text-allow-overlap": true,
            "text-ignore-placement": true,
          },
          paint: { "text-color": label },
        },
        {
          id: pointsId,
          type: "circle",
          source: sourceId,
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": colour,
            "circle-radius": 5,
            "circle-stroke-color": background ?? colour,
            "circle-stroke-width": 1.5,
          },
        },
      ] as LayerSpec[];
    },
  });

  useLayerPointer({
    map,
    layerIds: [clustersId],
    enabled: true,
    onClick: (event) => {
      const count = Number(event.feature.properties.point_count ?? 0);
      if (onClusterClick) {
        onClusterClick({ ...event, count });
        return;
      }
      if (!map) return;
      const clusterId = Number(event.feature.properties.cluster_id);
      const source = map.getSource(sourceId) as ClusterSource | undefined;
      const center = (event.feature.geometry as { coordinates?: [number, number] }).coordinates ?? event.lngLat;
      const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      // A cluster clicked mid-swap or mid-zoom can find no source, a rejected lookup, or, once it
      // resolves, a source rebuilt under the same id whose clusters differ; ignore all three.
      source
        ?.getClusterExpansionZoom?.(clusterId)
        .then((zoom) => {
          if ((map.getSource(sourceId) as unknown) === source) map.easeTo({ center, zoom, duration: reduce ? 0 : 500 });
        })
        .catch(() => {});
    },
  });
  useLayerPointer({ map, layerIds: [pointsId], enabled: onClick !== undefined, onClick });
  return null;
}
