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
import { Link } from "react-router-dom";
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
  date: string;
  location: Location;
  color: string;
  quality: string;
  brand: string; // Add brand to the place
}

function ChangeView({ center }: { center: Location }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], 13);
  }, [center, map]);
  return null;
}

function Pantee() {
  const [currentLocation, setCurrentLocation] = useState<Location>({
    lat: 18.7883,
    lng: 98.9853,
  });
  const [viewLocation, setViewLocation] = useState<Location>({
    lat: 18.7883,
    lng: 98.9853,
  });
  const [places, setPlaces] = useState<Place[]>([]);
  const [qualityFilter, setQualityFilter] = useState<string>(""); // Water quality filter
  const [brandFilter, setBrandFilter] = useState<string>(""); // Brand filter
  const markersRef = useRef<{ [key: number]: L.CircleMarker }>({});

  // Function to convert DMS (Degrees, Minutes, Seconds) to Decimal Degrees
  const dmsToDecimal = (dms: string) => {
    const regex = /(\d+)[°](\d+)'(\d+\.\d+)"([N|S|E|W])/;
    const match = dms.match(regex);
    if (match) {
      const degrees = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const seconds = parseFloat(match[3]);
      const direction = match[4];

      let decimal = degrees + (minutes / 60) + (seconds / 3600);

      // Adjust for N/S/E/W directions
      if (direction === "S" || direction === "W") {
        decimal = -decimal;
      }

      return decimal;
    } else {
      throw new Error("Invalid DMS format");
    }
  };

  // Utility function to format the date (if needed)
  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}, ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  };

  useEffect(() => {
    const fetchPlacesData = async () => {
      try {
        // Fetch strip data
        const stripsResponse = await fetch('http://localhost:3003/strips');
        const stripsData = await stripsResponse.json();

        // Fetch brand data
        const brandResponse = await fetch('http://localhost:3003/brands');
        const brandData = await brandResponse.json();

        // Map the strip data and link it with the corresponding brand
        const storedUserId = sessionStorage.getItem("userId");
        const mappedPlaces = stripsData
          .filter((strip: any) => strip.u_id === storedUserId)
          .map((strip: any) => {
            const brand = brandData.find((b: any) => b.b_id === strip.b_id);
            const lat = dmsToDecimal(strip.s_latitude);
            const lng = dmsToDecimal(strip.s_longitude);

            return {
              id: strip.s_id,
              title: brand ? brand.b_name : "Unknown Brand",
              date: getFormattedDate(strip.s_date),
              location: {
                lat,
                lng,
              },
              color: strip.s_qualitycolor, 
              quality: strip.s_quality,
              brand: brand ? brand.b_name : "Unknown Brand",
            };
          });

        setPlaces(mappedPlaces);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchPlacesData();
  }, []);

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

  const handleCardClick = (placeId: number) => {
    const marker = markersRef.current[placeId];
    if (marker) {
      marker.openPopup();
      const place = places.find(p => p.id === placeId);
      if (place) {
        setViewLocation(place.location);
      }
    }
  };

  // Filter places based on selected filters
  const filteredPlaces = places
    .filter((place) => (qualityFilter ? place.color === qualityFilter : true))
    .filter((place) => (brandFilter ? place.brand === brandFilter : true))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by most recent date
    .slice(0, 10); // Limit to 10 recent places

  return (
    <div style={{ position: "fixed", width: "100vw", height: "100vh" }}>
      <nav className="flex items-center justify-between px-6 py-3 gap-8 z-50">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/image/logo2.png" alt="Logo" className="h-10" />
            <span className="text-xl font-bold text-gray-800">AQUAlity</span>
          </Link>
          <Link to="/home" className="text-gray-800 text-xl font-bold hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors">
            Home
          </Link>
          <Link to="/pantee" className="text-gray-800 text-xl font-bold hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors">
            Map
          </Link>
        </div>
        <div className="relative">
          {/* Filter Inputs */}
          <select
            onChange={(e) => setQualityFilter(e.target.value)}
            value={qualityFilter}
            className="w-70 h-10 p-3 pr-12 bg-white border border-black rounded-l-md rounded-r-full outline-none focus:ring-0"
          >
            <option value="">Filter by Quality</option>
            <option value="#00FF00">Green</option>
            <option value="#FFFF00">Yellow</option>
            <option value="#FF0000">Red</option>
          </select>
          <select
            onChange={(e) => setBrandFilter(e.target.value)}
            value={brandFilter}
            className="w-70 h-10 p-3 pr-12 bg-white border border-black rounded-l-md rounded-r-full outline-none focus:ring-0"
          >
            <option value="">Filter by Brand</option>
            {Array.from(new Set(places.map(place => place.brand))).map(brand => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>
      </nav>

      {/* Map Section */}
      <div style={{ position: "absolute", top: 60, left: 15, right: 15, bottom: 20 }}>
        <MapContainer
          center={[viewLocation.lat, viewLocation.lng]}
          zoom={13}
          className="mt-1 rounded-4xl"
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
          {filteredPlaces.map((place) => (
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
                  <p style={{ margin: "0 0 5px 0"}}>{place.date}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
          <ChangeView center={viewLocation} />
        </MapContainer>
      </div>

      {/* Sidebar */}
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
        {filteredPlaces.map((place) => (
          <div
            key={place.id}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "white",
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
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)";
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
              <h3 style={{ fontSize: "16px", fontWeight: "bold" }}>
                {place.title}
              </h3>
              <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                {place.date}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Pantee;
