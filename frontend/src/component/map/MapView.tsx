import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { fetchPlaces } from "../../utils/fetchPlaces";
import ChangeView from "./ChangeView";
import "leaflet/dist/leaflet.css";
import rawGeoJson from "./thailand-provinces.json";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from "geojson";
import { dmsToDecimal } from "../../utils/dmsToDecimal.ts"; // Assuming you have a utility function for DMS conversion
import { DateAnalyzer } from "../Convertor/DateAnalyzer"; 

const thailandProvincesGeoJSON = rawGeoJson as FeatureCollection;
const DEFAULT_POSITION: [number, number] = [18.796143, 98.979263]; // Chiang Mai


const MapView = () => {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_POSITION);
  const [strips, setStrips] = useState<any[]>([]);
  const [provinceColors, setProvinceColors] = useState<Record<string, string>>({});
  const [_, setPlaces] = useState<any[]>([]);

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
        const stripsResponse = await fetch("/api/strips");
        const stripsData = await stripsResponse.json();
        const ThisMontStrip = DateAnalyzer(stripsData);
        setStrips(ThisMontStrip);
        console.log("Fetched strips data:", ThisMontStrip);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchPlacesData();
  }, []);

  // Analyze strip data to assign colors to provinces
  useEffect(() => {
    if (!strips.length) return;

    const stripsThisMonth = strips;

    console.log("Strips from current month:", stripsThisMonth);

    const colorCountMap: Record<string, Record<string, number>> = {};

    for (const strip of stripsThisMonth) {
      const lat = dmsToDecimal(strip.s_latitude);
      const lng = dmsToDecimal(strip.s_longitude);
      const color = strip.s_qualitycolor;

      const province = getProvinceFromLatLng(lat, lng, thailandProvincesGeoJSON);

      if (!province) continue;

      if (!colorCountMap[province]) {
        colorCountMap[province] = {};
      }
      colorCountMap[province][color] = (colorCountMap[province][color] || 0) + 1;
    }

    const mostCommonColorByProvince: Record<string, string> = {};
    for (const province in colorCountMap) {
      const colors = colorCountMap[province];
      const mostCommonColor = Object.entries(colors).sort((a, b) => b[1] - a[1])[0][0];
      mostCommonColorByProvince[province] = mostCommonColor;
    }

    setProvinceColors(mostCommonColorByProvince);
  }, [strips]);

  // Popup on each province
  const onEachProvince = (province: GeoJSON.Feature, layer: L.Layer) => {
    if (province.properties && (province.properties as any).NAME_1) {
      layer.bindPopup((province.properties as any).NAME_1);
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

  // Fetch additional place info (if needed)
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
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={center} />
        <GeoJSON
          data={thailandProvincesGeoJSON}
          style={(feature) => {
            const name = feature?.properties ? (feature.properties as any).NAME_1 : undefined;
            const color = name ? provinceColors[name] ?? "#eee" : "#ccc";
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
