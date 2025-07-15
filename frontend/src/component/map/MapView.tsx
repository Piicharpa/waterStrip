import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { fetchPlaces } from "../../utils/fetchPlaces";
import "leaflet/dist/leaflet.css";
import rawGeoJson from "./thailand-provinces.json";
import * as turf from "@turf/turf";
import type {
  Feature,
  FeatureCollection,
  Polygon,
  MultiPolygon,
} from "geojson";
import { dmsToDecimal } from "../../utils/dmsToDecimal.ts";
import { DateAnalyzer } from "../Convertor/DateAnalyzer";
import { LatLngBoundsExpression } from "leaflet";

const thailandProvincesGeoJSON = rawGeoJson as FeatureCollection;

// ขอบเขตประเทศไทย
const THAILAND_BOUNDS: LatLngBoundsExpression = [
  [5.610833, 97.344167], // SW
  [20.463056, 105.637222], // NE
];

// ฟังก์ชันสำหรับซูมเข้าที่ผู้ใช้ (เมื่อได้ตำแหน่ง)
const FlyToUserLocation = ({
  position,
}: {
  position: [number, number] | null;
}) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 13, { animate: true }); // ✅ ซูมแบบ smooth กว่า
    }
  }, [position]);

  return null;
};

const MapView = () => {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(
    null
  );
  const [strips, setStrips] = useState<any[]>([]);
  const [provinceColors, setProvinceColors] = useState<Record<string, string>>(
    {}
  );
  const [_, setPlaces] = useState<any[]>([]);

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
        if (
          turf.booleanPointInPolygon(
            point,
            feature as Feature<Polygon | MultiPolygon>
          )
        ) {
          return (feature.properties as any).NAME_1;
        }
      }
    }
    return null;
  };

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

  useEffect(() => {
    if (!strips.length) return;

    const colorCountMap: Record<string, Record<string, number>> = {};

    for (const strip of strips) {
      const lat = dmsToDecimal(strip.s_latitude);
      const lng = dmsToDecimal(strip.s_longitude);
      const color = strip.s_qualitycolor;
      const province = getProvinceFromLatLng(
        lat,
        lng,
        thailandProvincesGeoJSON
      );
      if (!province) continue;

      if (!colorCountMap[province]) colorCountMap[province] = {};
      colorCountMap[province][color] =
        (colorCountMap[province][color] || 0) + 1;
    }

    const mostCommonColorByProvince: Record<string, string> = {};
    for (const province in colorCountMap) {
      const colors = colorCountMap[province];
      const mostCommonColor = Object.entries(colors).sort(
        (a, b) => b[1] - a[1]
      )[0][0];
      mostCommonColorByProvince[province] = mostCommonColor;
    }

    setProvinceColors(mostCommonColorByProvince);
  }, [strips]);

  const onEachProvince = (province: GeoJSON.Feature, layer: L.Layer) => {
    if (province.properties && (province.properties as any).NAME_1) {
      layer.bindPopup((province.properties as any).NAME_1);
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserPosition([latitude, longitude]);
        },
        (error) => {
          console.warn("ไม่สามารถเข้าถึงตำแหน่งได้:", error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
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
      bounds={THAILAND_BOUNDS}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userPosition && <FlyToUserLocation position={userPosition} />}
      <GeoJSON
        data={thailandProvincesGeoJSON}
        style={(feature) => {
          const name = feature?.properties
            ? (feature.properties as any).NAME_1
            : undefined;
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
