import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { fetchPlaces } from "../../utils/fetchPlaces";
import ChangeView from "./ChangeView";
import "leaflet/dist/leaflet.css";
import rawGeoJson from "./thailand-provinces.json";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from "geojson";


const thailandProvincesGeoJSON = rawGeoJson as FeatureCollection;
const DEFAULT_POSITION: [number, number] = [18.796143, 98.979263]; // Chiang Mai

/**
 * Converts a DMS (Degrees, Minutes, Seconds) string to decimal degrees.
 * Example input: "18°47'46.1\"N" or "98°59'13.3\"E"
 */
function dmsToDecimal(dms: string): number {
  const regex = /(\d+)[°:](\d+)[\'′:](\d+(?:\.\d+)?)[\"\″]?([NSEW])/i;
  const match = dms.match(regex);
  if (!match) return NaN;
  const [, deg, min, sec, dir] = match;
  let dec = Number(deg) + Number(min) / 60 + Number(sec) / 3600;
  if (dir === "S" || dir === "W") dec *= -1;
  return dec;
}

const MapView = () => {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_POSITION);
  const [strips, setStrips] = useState<any[]>([]);
  const [provinceColors, setProvinceColors] = useState<Record<string, string>>({});
  const [places, setPlaces] = useState<any[]>([]);

  // Utility to get province name from coordinates
  const getProvinceFromLatLng = (
    lat: number,
    lng: number,
    provincesGeoJSON: FeatureCollection
  ): string | null => {
    const point = turf.point([lng, lat]);
    for (const feature of provincesGeoJSON.features) {
      if (
        feature.geometry.type === "Polygon" ||
        feature.geometry.type === "MultiPolygon"
      ) {
        if (turf.booleanPointInPolygon(point, feature as Feature<Polygon | MultiPolygon>)) {

          return (feature.properties as any).NAME_1;
        }
      }
    }
    return null;
  };

  // Fetch places and strips data
  useEffect(() => {
      const fetchPlacesData = async () => {
        try {
          // Fetch strip data
          const stripsResponse = await fetch('/api/strips');
          const stripsData = await stripsResponse.json();
          setStrips(stripsData);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
  
      fetchPlacesData();
    }, []);

  // Analyze strip data to assign colors to provinces
  useEffect(() => {
    if (!strips.length) return;

    const colorCountMap: Record<string, Record<string, number>> = {};

    for (const strip of strips) {
      const lat = dmsToDecimal(strip.s_latitude);
      const lng = dmsToDecimal(strip.s_longitude);
      console.log(`Processing strip at lat: ${lat}, lng: ${lng}`);
      console.log("ตัวอย่าง properties:", thailandProvincesGeoJSON.features[0].properties);

      

      const color = strip.s_qualitycolor;
      console.log(` Color: ${color}`);

      const province = getProvinceFromLatLng(lat, lng, thailandProvincesGeoJSON);
      console.log(` Province: ${province}`);
      if (!province) continue;

      if (!colorCountMap[province]) {
        colorCountMap[province] = {};
      }
      colorCountMap[province][color] = (colorCountMap[province][color] || 0) + 1;

      console.log(` Province: ${province}, Color: ${color}`);
    }

    const mostCommonColorByProvince: Record<string, string> = {};
    for (const province in colorCountMap) {
      const colors = colorCountMap[province];
      const mostCommonColor = Object.entries(colors).sort((a, b) => b[1] - a[1])[0][0];
      mostCommonColorByProvince[province] = mostCommonColor;
    }
      console.log("Province colors:", mostCommonColorByProvince);
    setProvinceColors(mostCommonColorByProvince);
  }, [strips]);


  // Popup on each province
  const onEachProvince = (province: GeoJSON.Feature, layer: L.Layer) => {
    if (province.properties && (province.properties as any).name) {
      layer.bindPopup((province.properties as any).name);
    }
  };

  // Get user's geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCenter([latitude, longitude]);
        },
        (error) => {
          console.warn("ไม่สามารถเข้าถึงตำแหน่งได้:", error.message);
          setCenter(DEFAULT_POSITION);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      console.warn("เบราว์เซอร์ไม่รองรับ geolocation");
      setCenter(DEFAULT_POSITION);
    }
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchPlaces();
      setPlaces(data);
    };
    fetchData();
  }, []);
  return (
    <MapContainer
      center={center}
      zoom={9}
      scrollWheelZoom={true}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ChangeView center={center} />

      {/* Province polygons with dynamic fillColor */}
      <GeoJSON
        data={thailandProvincesGeoJSON}
        style={(feature) => {
          const name = feature?.properties ? (feature.properties as any).NAME_1 : undefined;
          const color = name ? provinceColors[name]?? "#eee"  : "#ccc";
          return {
            color: "#666",
            weight: 1,
            fillColor: color,
            fillOpacity: 0.5,
          };
        }}
        onEachFeature={onEachProvince}
      />
    </MapContainer>
  );
};

export default MapView;