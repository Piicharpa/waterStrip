import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvent,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FaLocationCrosshairs } from "react-icons/fa6";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { FaCheck } from "react-icons/fa6";
import { useNavigate, useLocation } from "react-router-dom";

// Utility function to convert decimal to DMS
const toDMS = (decimal: number, isLat: boolean = true) => {
  const degrees = Math.floor(Math.abs(decimal));
  const minutes = Math.floor((Math.abs(decimal) - degrees) * 60);
  const seconds = ((Math.abs(decimal) - degrees - minutes / 60) * 3600).toFixed(
    1
  );

  let direction;
  if (isLat) {
    direction = decimal >= 0 ? "N" : "S";
  } else {
    direction = decimal >= 0 ? "E" : "W";
  }

  return `${degrees}°${minutes}'${seconds}"${direction}`;
};

// กำหนด icon สำหรับ Marker
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// ฟังก์ชันสำหรับการเปลี่ยนแปลงมุมมองแผนที่
function ChangeView({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center, map]);
  return null;
}

// Component หลัก AddMap
const AddMap = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get previous location from route state or use default
  const previousLocation = location.state?.previousLocation || {
    lat: 18.7883,
    lng: 98.9853,
  };

  const [currentLocation, setCurrentLocation] = useState({
    lat: 18.7883,
    lng: 98.9853,
  });
  const [viewLocation, setViewLocation] = useState(previousLocation);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    latDMS: string;
    lngDMS: string;
  } | null>(location.state?.selectedLocation || null);
  const [userMarkerVisible, setUserMarkerVisible] = useState(!selectedLocation);

  const markersRef = useRef<{ [key: number]: L.Marker | null }>({});

  // ฟังก์ชันตรวจสอบตำแหน่งของผู้ใช้
  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(newLocation);
          setViewLocation(newLocation);
          setUserMarkerVisible(true);

          const latDMS = toDMS(newLocation.lat, true);
          const lngDMS = toDMS(newLocation.lng, false);

          setSelectedLocation({
            ...newLocation,
            latDMS,
            lngDMS,
          });

          setTimeout(() => {
            markersRef.current[0]?.openPopup();
          }, 100);
        },
        (error) => {
          console.error("Error fetching location:", error);
          alert("ไม่สามารถค้นหาตำแหน่งของคุณได้: " + error.message);
        }
      );
    } else {
      alert("เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง");
    }
  };

  // ฟังก์ชันที่เกิดจากการเลือกตำแหน่งจากแผนที่
  const handleLocationSelect = (lat: number, lng: number) => {
    const latDMS = toDMS(lat, true);
    const lngDMS = toDMS(lng, false);

    setSelectedLocation({
      lat,
      lng,
      latDMS,
      lngDMS,
    });
    setUserMarkerVisible(false);
    setViewLocation({ lat, lng });

    setTimeout(() => {
      markersRef.current[1]?.openPopup();
    }, 100);
  };

  // ฟังก์ชันเพื่อให้ Marker สามารถลากได้
  const handleMarkerDragEnd = (e: any) => {
    const { lat, lng } = e.target.getLatLng();
    const latDMS = toDMS(lat, true);
    const lngDMS = toDMS(lng, false);

    setSelectedLocation({
      lat,
      lng,
      latDMS,
      lngDMS,
    });
  };

  // ฟังก์ชันเพื่อส่งตำแหน่งไปยังหน้า Ladd
  const handleConfirmLocation = () => {
    if (selectedLocation) {
      // เก็บค่าตำแหน่งใน localStorage เพื่อส่งไปยังหน้า Ladd
      localStorage.setItem(
        "selectedLocation",
        JSON.stringify(selectedLocation)
      );
      navigate("/add"); // นำทางไปยังหน้า Ladd
    }
  };

  // Handling the click event on the map to select a location
  function MapClickHandler({
    onSelect,
  }: {
    onSelect: (lat: number, lng: number) => void;
  }) {
    useMapEvent("click", (e) => {
      onSelect(e.latlng.lat, e.latlng.lng);
    });
    return null;
  }

  return (
    <div style={{ position: "fixed", width: "100vw", height: "100vh" }}>
      {/* ปุ่มค้นหาตำแหน่งของผู้ใช้ */}
      <button
        onClick={() => {
          setSelectedLocation(null);
          handleLocate();
        }}
        className="absolute right-2 top-2 bg-transparent hover:bg-black text-black p-2 hover:text-white rounded-full outline-none focus:ring-0"
        style={{ zIndex: 1000 }}>
        <FaLocationCrosshairs />
      </button>

      {/* Map Section */}
      <div
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        <MapContainer
          center={[viewLocation.lat, viewLocation.lng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}>
          <MapClickHandler onSelect={handleLocationSelect} />

          {/* Tile Layer for the map */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Marker for current location */}
          {userMarkerVisible && currentLocation && (
            <Marker
              position={[currentLocation.lat, currentLocation.lng]}
              icon={DefaultIcon}
              ref={(el) => (markersRef.current[0] = el)}>
              <Popup>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: "200px",
                  }}>
                  <h3 style={{ fontWeight: "bold", marginBottom: "5px" }}>
                    ตำแหน่งของคุณ
                  </h3>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <p style={{ whiteSpace: "nowrap" }}>
                      {selectedLocation?.latDMS}, {selectedLocation?.lngDMS}
                    </p>
                    <button
                      onClick={handleConfirmLocation}
                      className="bg-black ml-4.5 h-6 w-6 rounded-full text-white flex justify-center items-center">
                      <FaCheck />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Marker for selected location */}
          {selectedLocation && !userMarkerVisible && (
            <Marker
              ref={(el) => (markersRef.current[1] = el)}
              position={[selectedLocation.lat, selectedLocation.lng]}
              icon={DefaultIcon}
              draggable={true}
              eventHandlers={{
                dragend: handleMarkerDragEnd,
              }}>
              <Popup>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: "200px",
                  }}>
                  <h3 style={{ fontWeight: "bold", marginBottom: "5px" }}>
                    ตำแหน่งที่เลือก
                  </h3>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <p>
                      {selectedLocation.latDMS}, {selectedLocation.lngDMS}
                    </p>
                    <button
                      onClick={handleConfirmLocation}
                      className="bg-black ml-4 h-6 w-6 rounded-full text-white flex justify-center items-center">
                      <FaCheck />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          <ChangeView center={viewLocation} />
        </MapContainer>
      </div>
    </div>
  );
};

export default AddMap;
