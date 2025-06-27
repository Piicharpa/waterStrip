import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from "react-leaflet";
import { fetchPlaces } from "../../utils/fetchPlaces";
import ChangeViewAndZoom from "./ChangeViewAndZoom.tsx";
import "leaflet/dist/leaflet.css";
import rawGeoJson from "./thailand-provinces.json";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from "geojson";
import { dmsToDecimal } from "../../utils/dmsToDecimal.ts";
import { DateAnalyzer } from "../Convertor/DateAnalyzer";
import L from "leaflet";

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom current location icon
const currentLocationIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'current-location-marker'
});

const thailandProvincesGeoJSON = rawGeoJson as FeatureCollection;
const DEFAULT_POSITION: [number, number] = [13, 100]; // Center of Thailand

const MapView = () => {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_POSITION);
  const [zoom, setZoom] = useState<number>(6); // Default zoom
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [strips, setStrips] = useState<any[]>([]);
  const [provinceColors, setProvinceColors] = useState<Record<string, string>>({});
  const [_, setPlaces] = useState<any[]>([]);
  const mapRef = useRef<L.Map | null>(null);

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

  const onEachProvince = (province: GeoJSON.Feature, layer: L.Layer) => {
    if (province.properties && (province.properties as any).NAME_1) {
      layer.bindPopup((province.properties as any).NAME_1);
    }
  };

  // Get current location with permission change detection
  useEffect(() => {
    let lastPermissionState = '';

    const requestLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const newLocation: [number, number] = [latitude, longitude];
            
            // Update current location marker
            setCurrentLocation(newLocation);
            
            // Update map center and zoom without refresh
            setCenter(newLocation);
            setZoom(13);
            
            console.log("Location updated:", newLocation);
          },
          (error) => {
            console.warn("ไม่สามารถเข้าถึงตำแหน่งได้:", error.message);
            
            // If permission was denied/blocked, remove current location marker
            if (error.code === 1) { // PERMISSION_DENIED
              setCurrentLocation(null);
              console.log("Location permission denied, removing marker");
            }
            
            // Don't change center and zoom if we had location before
            if (!currentLocation) {
              setCenter(DEFAULT_POSITION);
              setZoom(6);
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        console.warn("เบราว์เซอร์ไม่รองรับ geolocation");
        setCenter(DEFAULT_POSITION);
        setZoom(6);
      }
    };

    // Initial location request
    requestLocation();

    // Check for permission changes periodically
    const permissionInterval = setInterval(() => {
      if ("permissions" in navigator) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          const currentPermissionState = result.state;
          
          // Check if permission changed
          if (lastPermissionState !== currentPermissionState) {
            console.log(`Permission changed from ${lastPermissionState} to ${currentPermissionState}`);
            
            if (currentPermissionState === 'granted' && !currentLocation) {
              // Permission was just granted and we don't have location yet
              requestLocation();
            } else if (currentPermissionState === 'denied' || currentPermissionState === 'prompt') {
              // Permission was denied or revoked, remove current location
              if (currentLocation) {
                setCurrentLocation(null);
                console.log("Permission revoked, removing location marker");
              }
            }
            
            lastPermissionState = currentPermissionState;
          }
        }).catch(() => {
          // Fallback for browsers that don't support permissions API
          requestLocation();
        });
      } else {
        // Fallback: try to get location periodically for older browsers
        if (!currentLocation) {
          requestLocation();
        }
      }
    }, 1000); // Check every 1 second for more responsive detection

    // Listen for focus events (when user switches back to tab)
    const handleFocus = () => {
      if (!currentLocation) {
        requestLocation();
      }
    };

    // Listen for visibility change (when tab becomes visible)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible, check permission status
        if ("permissions" in navigator) {
          navigator.permissions.query({ name: 'geolocation' }).then((result) => {
            if (result.state === 'denied' && currentLocation) {
              setCurrentLocation(null);
              console.log("Tab focused: Permission denied, removing marker");
            } else if (result.state === 'granted' && !currentLocation) {
              requestLocation();
            }
          }).catch(() => {
            requestLocation();
          });
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(permissionInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentLocation]); // Depend on currentLocation

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
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ChangeViewAndZoom center={center} zoom={zoom} />
      <GeoJSON
        data={thailandProvincesGeoJSON}
        style={(feature) => {
          const name = feature?.properties ? (feature.properties as any).NAME_1 : undefined;
          const color = name ? provinceColors[name] ?? "#eee" : "#ccc";
          return {
            color: "#666",
            weight: 1,
            fillColor: color,
            fillOpacity: 0,
          };
        }}
        onEachFeature={onEachProvince}
      />
      
      {/* Current Location Marker */}
      {currentLocation && (
        <Marker position={currentLocation} icon={currentLocationIcon}>
          <Popup>
            <div>
              <strong>ตำแหน่งปัจจุบันของคุณ</strong>
              <br />
              Lat: {currentLocation[0].toFixed(6)}
              <br />
              Lng: {currentLocation[1].toFixed(6)}
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default MapView;