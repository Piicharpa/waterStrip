import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { FaLocationCrosshairs } from "react-icons/fa6";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;
interface Location {
  lat: number;
  lng: number;
}
interface Place {
  id: number;
  title: string;
  description: string;
  location: Location;
  color: string;
}
// ฟังก์ชันสำหรับกำหนดข้อความคุณภาพน้ำตามสี
const getWaterQualityText = (color: string) => {
  switch (color) {
    case "#e74c3c":
      return "คุณภาพน้ำ: แย่มาก";
    case "#FF8A24":
      return "คุณภาพน้ำ: แย่";
    case "#FFE521":
      return "คุณภาพน้ำ: ปานกลาง";
    case "#7ECF1B":
      return "คุณภาพน้ำ: ดี";
    default:
      return "คุณภาพน้ำ: ไม่ระบุ";
  }
};
// จำลองของสถานที่
const mockPlaces: Place[] = [
  {
    id: 1,
    title: "A",
    description: "ว่าจะกินดีนะตรวจก่อน เกือบตุย",
    location: { lat: 18.796247, lng: 98.950658 },
    color: "#e74c3c", // สีแดง
  },
  {
    id: 2,
    title: "B",
    description: "เดินผ่านเลยลองตรวจ",
    location: { lat: 18.788117, lng: 98.961804 },
    color: "#FF8A24", // สีส้ม
  },
  {
    id: 3,
    title: "C",
    description: "ตู้กดน้ำหน้าห้องน้ำหญิง",
    location: { lat: 18.797131, lng: 98.971955 },
    color: "#FFE521", // สีเหลือง
  },
  {
    id: 4,
    title: "D",
    description: "น้ำดื่มยี่ห้อหนึ่ง อักษรย่อ A",
    location: { lat: 18.807885, lng: 98.95943 },
    color: "#7ECF1B", // สีเขียว
  },
  {
    id: 5,
    title: "E",
    description: "ท่อระบายน้ำข้างทาง",
    location: { lat: 18.781055, lng: 98.955496 },
    color: "#FFE521", // สีเหลือง
  },
];
function ChangeView({ center }: { center: Location }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], 13);
  }, [center, map]);
  return null;
}
function Dpantee() {
  const [currentLocation, setCurrentLocation] = useState<Location>({
    lat: 18.7883,
    lng: 98.9853,
  });
  const [viewLocation, setViewLocation] = useState<Location>({
    lat: 18.7883,
    lng: 98.9853,
  });
  const markersRef = useRef<{ [key: number]: L.CircleMarker }>({});
  // Function to handle location
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

  // ฟังก์ชันเมื่อคลิกที่การ์ด
  const handleCardClick = (placeId: number) => {
    const marker = markersRef.current[placeId];
    if (marker) {
      // ทำการเปิด popup ของ marker
      marker.openPopup();

      // เลื่อนไปที่ตำแหน่งของสถานที่
      const place = mockPlaces.find((p) => p.id === placeId);
      if (place) {
        setViewLocation(place.location);
      }
    }
  };

  return (
    <div style={{ position: "fixed", width: "100vw", height: "100vh", background: "black"}}>
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-3 bg-black">
        <div className="flex items-center gap-2 ">
          <img src="/image/logo3.png" alt="Logo" className="h-10" />
          <span className="text-lg font-bold text-white">AQUAlity</span>
        </div>
        {/* Search Box */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="w-70 h-10 p-3 pr-12 bg-white border border-black rounded-l-md rounded-r-full outline-none focus:ring-0"
            style={{
              borderTopLeftRadius: "4000px",
              borderBottomLeftRadius: "4000px",
              borderTopRightRadius: "9999px",
              borderBottomRightRadius: "9999px",
            }}
          />
          <button
            onClick={handleLocate}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent hover:bg-black text-black p-2 hover:text-white rounded-full   outline-none focus:ring-0"
          >
            <FaLocationCrosshairs />
          </button>
        </div>
      </nav>
      {/* Map Section */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 15,
          right: 15,
          bottom: 20,
        }}
      >
        <MapContainer
          center={[viewLocation.lat, viewLocation.lng]}
          zoom={13}
          className="mt-1 rounded-4xl  "
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[currentLocation.lat, currentLocation.lng]}>
            <Popup>
              <div>
                <h3 style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>
                  ตำแหน่งของคุณ
                </h3>
              </div>
            </Popup>
          </Marker>
          {mockPlaces.map((place) => (
            <CircleMarker
              key={place.id}
              center={[place.location.lat, place.location.lng]}
              radius={7}
              fillColor={place.color}
              fillOpacity={1}
              stroke={false}
              ref={(ref) => {
                if (ref) markersRef.current[place.id] = ref;
              }}
            >
              <Popup>
                <div>
                  <h3 style={{ fontWeight: "bold", margin: "0 0 5px 0" }}>
                    {place.title}
                  </h3>
                  <p style={{ margin: "0 0 5px 0" }}>{place.description}</p>

                  <span>{getWaterQualityText(place.color)}</span>
                </div>
              </Popup>
            </CircleMarker>
          ))}
          <ChangeView center={viewLocation} />
        </MapContainer>
      </div>
      {/* Sidebar or additional content */}
      <div
        style={{
          position: "fixed",
          top: 60,
          right: 12,
          width: 300,
          padding: "16px",
          overflowY: "auto",
          backgroundColor: "transparent",
          zIndex: 1000,
        }}
      >
        {mockPlaces.map((place) => (
          <div
            key={place.id}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "black",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
              marginBottom: "12px",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onClick={() => handleCardClick(place.id)}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)";
            }}
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: place.color,
                marginRight: "15px",
                marginLeft: "4px",
                flexShrink: 0,
              }}
            />
            <div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                {place.title}
              </h3>
              <p style={{ margin: 0, fontSize: "14px", color: "white" }}>
                {place.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default Dpantee;
