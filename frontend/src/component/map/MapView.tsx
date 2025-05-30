import { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import PlaceMarker from "./PlaceMarker";
import ChangeView from "./ChangeView";
import { fetchPlaces } from "../../utils/fetchPlaces";

const DEFAULT_POSITION: [number, number] = [18.796143, 98.979263]; // เชียงใหม่

const MapView = () => {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_POSITION);
  const [places, setPlaces] = useState<any[]>([]);

  useEffect(() => {
    // ขอพิกัดจากเบราว์เซอร์
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCenter([latitude, longitude]);
        },
        (error) => {
          console.warn("ไม่สามารถเข้าถึงตำแหน่งได้:", error.message);
          setCenter(DEFAULT_POSITION); // fallback
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      console.warn("เบราว์เซอร์ไม่รองรับ geolocation");
      setCenter(DEFAULT_POSITION); // fallback
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
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ChangeView center={center} />
      {places.map((place, index) => (
        <PlaceMarker key={index} place={place} refCallback={() => {}}/>
      ))}
    </MapContainer>
  );
};

export default MapView;
