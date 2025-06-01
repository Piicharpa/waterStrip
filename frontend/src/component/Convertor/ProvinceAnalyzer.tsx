import rawGeoJson from "./thailand-provinces.json";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from "geojson";

const thailandProvincesGeoJSON = rawGeoJson as FeatureCollection;

/**
 * Get Thai province name from latitude and longitude (supports decimal & DMS).
 */
export const getProvinceFromLatLng = (
  lat: number,
  lng: number
) => {
  if (isNaN(lat) || isNaN(lng)) {
    console.warn("❌ Invalid lat/lng input:", lat, lng);
    return null;
  }

  const point = turf.point([lng, lat]);
  for (const feature of thailandProvincesGeoJSON.features) {
    if (
      feature.geometry.type === "Polygon" ||
      feature.geometry.type === "MultiPolygon"
    ) {
      if (turf.booleanPointInPolygon(point, feature as Feature<Polygon | MultiPolygon>)) {
        return (feature.properties as any).NAME_1;
      }
    }
  }

  console.warn("❌ Could not find province for:", lat, lng);
  return null;
};
