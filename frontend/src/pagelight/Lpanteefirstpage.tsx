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
  rawDate: string; // 🆕 เก็บค่าเดิมจาก DB
  formattedDate: string; // 🆕 แปลงไว้ใช้แสดงผล
  location: Location;
  color: string;
  quality: string;
}

// Define the shape of the API response
interface StripStatusResponse {
  s_id: number;
  brand_name: string;
  s_latitude: string;
  s_longitude: string;
  s_date: string;
  s_qualitycolor: string;
  s_quality: string;
}

function ChangeView({ center }: { center: Location }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], 13);
  }, [center, map]);
  return null;
}

function Panteefirstpage() {
  const [currentLocation, setCurrentLocation] = useState<Location>({
    lat: 18.7883,
    lng: 98.9853,
  });
  const [viewLocation, setViewLocation] = useState<Location>({
    lat: 18.7883,
    lng: 98.9853,
  });
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [isWaterQualityDropdownOpen, setIsWaterQualityDropdownOpen] =
    useState(false);
  const [selectedQuality, setSelectedQuality] = useState("");
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const waterQualityDropdownRef = useRef<HTMLDivElement>(null);
  const brandDropdownRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: number]: L.CircleMarker }>({});

  // Water quality options matching the image
  const waterQualityOptions = [
    { value: "", label: "All", color: "" },
    { value: "#00c951", label: "Good", color: "green" },
    { value: "#f0b100", label: "Fair", color: "yellow" },
    { value: "#fb2c36", label: "Bad", color: "red" },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        waterQualityDropdownRef.current &&
        !waterQualityDropdownRef.current.contains(event.target as Node)
      ) {
        setIsWaterQualityDropdownOpen(false);
      }

      if (
        brandDropdownRef.current &&
        !brandDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBrandDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Function to convert DMS (Degrees, Minutes, Seconds) to Decimal Degrees
  const dmsToDecimal = (dms: string) => {
    const regex = /(\d+)[°](\d+)'(\d+\.\d+)"([N|S|E|W])/;
    const match = dms.match(regex);
    if (match) {
      const degrees = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const seconds = parseFloat(match[3]);
      const direction = match[4];

      let decimal = degrees + minutes / 60 + seconds / 3600;

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
    return `${
      date.getMonth() + 1
    }/${date.getDate()}/${date.getFullYear()}, ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  };

  useEffect(() => {
    const fetchPlacesData = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedBrand) params.append("brand", selectedBrand);
        if (selectedQuality) params.append("quality", selectedQuality);

        const response = await fetch(
          `/api/strip-status/public?${params.toString()}`
        );
        const data: StripStatusResponse[] = await response.json();

        // Map data with explicit type conversion
        const mappedPlaces = data
          .map((strip): Place => {
            const lat = dmsToDecimal(strip.s_latitude);
            const lng = dmsToDecimal(strip.s_longitude);

            return {
              id: strip.s_id,
              title: strip.brand_name || "Unknown Brand",
              rawDate: strip.s_date,
              formattedDate: getFormattedDate(strip.s_date),
              location: { lat, lng },
              color: strip.s_qualitycolor,
              quality: strip.s_quality,
            };
          })
          .sort(
            (a, b) =>
              new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
          );

        setPlaces(mappedPlaces);
        setFilteredPlaces(mappedPlaces);

        // Extract unique brand names for dropdown
        const uniqueBrands = Array.from(
          new Set(mappedPlaces.map((place) => place.title))
        ).sort();

        setBrands(uniqueBrands);
      } catch (error) {
        console.error("Error fetching public strip data:", error);
      }
    };

    fetchPlacesData();
  }, [selectedBrand, selectedQuality]);

  // Filter places when brand or quality selection changes
  useEffect(() => {
    let filtered = places;

    if (selectedBrand !== "") {
      filtered = filtered.filter((place) => place.title === selectedBrand);
    }

    if (selectedQuality !== "") {
      filtered = filtered.filter((place) => place.color === selectedQuality);
    }

    // 10 อันล่าสุด
    const sortedFiltered = [...filtered].sort(
      (a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
    );

    const recentFiltered = sortedFiltered.slice(0, 10);

    setFilteredPlaces(recentFiltered);

    if (recentFiltered.length > 0) {
      setViewLocation(recentFiltered[0].location);
    }
  }, [selectedBrand, selectedQuality, places]);

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

  // Handle quality selection
  const handleQualitySelect = (quality: string) => {
    setSelectedQuality(quality);
    setIsWaterQualityDropdownOpen(false);
  };

  // Handle brand selection
  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand);
    setIsBrandDropdownOpen(false);
  };

  // ฟังก์ชันเมื่อคลิกที่การ์ด
  const handleCardClick = (placeId: number) => {
    const marker = markersRef.current[placeId];
    if (marker) {
      // ทำการเปิด popup ของ marker
      marker.openPopup();

      // เลื่อนไปที่ตำแหน่งของสถานที่
      const place = places.find((p) => p.id === placeId);
      if (place) {
        setViewLocation(place.location);
      }
    }
  };

  return (
    <div style={{ position: "fixed", width: "100vw", height: "100vh" }}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-3 gap-8 z-50">
        {/* Logo Section */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img src="/image/logo2.png" alt="Logo" className="h-10" />
            <span className="text-xl font-bold text-gray-800">AQUAlity</span>
          </Link>

          {/* Menu Links */}
          <Link
            to="/"
            className="text-gray-800 text-base hover:underline px-4 py-2 rounded-lg transition-colors"
          >
            Home
          </Link>
        </div>

        {/* Navigation and controls wrapper */}
        <div className="flex items-center gap-4">
          {/* Water Quality Dropdown */}
          <div
            ref={waterQualityDropdownRef}
            className="relative w-14 z-[10000]"
          >
            {/* Dropdown Trigger */}
            <div
              onClick={() => {
                setIsWaterQualityDropdownOpen(!isWaterQualityDropdownOpen);
                // Close brand dropdown if open
                setIsBrandDropdownOpen(false);
              }}
              className="flex items-center justify-between w-15 h-10 p-2 bg-white border border-black rounded-l-full cursor-pointer"
            >
              <div className="flex items-center">
                {selectedQuality === "" ? (
                  <>
                    <div className="w-5 h-5 mr-2 rounded-full bg-gradient-to-tr from-green-500 via-yellow-500 to-red-500"></div>
                  </>
                ) : (
                  <>
                    <div
                      className={`w-5 h-5 mr-2 rounded-full ${
                        selectedQuality === "#00c951"
                          ? "bg-green-500"
                          : selectedQuality === "#f0b100"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                  </>
                )}
              </div>
              <svg
                className="w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>

            {/* Dropdown Menu */}
            {isWaterQualityDropdownOpen && (
              <div className="absolute top-full left-0 w-25 mt-4 border border-gray-200 bg-white rounded-lg  z-[10001]">
                {waterQualityOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleQualitySelect(option.value)}
                    className="flex items-center p-2 hover:bg-gray-100 hover:rounded-lg cursor-pointer"
                  >
                    <div
                      className={`w-5 h-5 mr-2  rounded-full ${
                        option.value === ""
                          ? "bg-gradient-to-tr from-green-500 via-yellow-500 to-red-500"
                          : option.value === "#00c951"
                          ? "bg-green-500"
                          : option.value === "#f0b100"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                    <span>{option.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Brand Dropdown */}
          <div ref={brandDropdownRef} className="relative w-64 z-[10000]">
            {/* Dropdown Trigger */}
            <div
              onClick={() => {
                setIsBrandDropdownOpen(!isBrandDropdownOpen);
                // Close water quality dropdown if open
                setIsWaterQualityDropdownOpen(false);
              }}
              className="flex items-center justify-between w-full h-10 p-2 bg-white border rounded-r-full border-black  cursor-pointer"
            >
              <span>{selectedBrand || "Select Brand"}</span>
              <svg
                className="w-4 h-4 ml-2"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>

            {/* Dropdown Menu */}
            {isBrandDropdownOpen && (
              <div className="absolute top-full left-0 w-full mt-4 border border-gray-200 bg-white  rounded-lg  z-[10001] max-h-60 overflow-y-auto">
                <div
                  key="all-brands"
                  onClick={() => handleBrandSelect("")}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                >
                  All Brands
                </div>
                {brands.map((brand) => (
                  <div
                    key={brand}
                    onClick={() => handleBrandSelect(brand)}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {brand}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Location button */}
          <button
            onClick={handleLocate}
            className="bg-white hover:bg-black text-black hover:text-white p-2 rounded-full  outline-none focus:ring-0 transition-colors"
            title="Find my location"
          >
            <FaLocationCrosshairs size={20} />
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
                  <p style={{ margin: "0 0 5px 0" }}>{place.formattedDate}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
          <ChangeView center={viewLocation} />
        </MapContainer>
      </div>

      {/* Sidebar with filtered places */}
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
          maxHeight: "calc(100vh - 100px)",
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
              const target = e.currentTarget as HTMLDivElement;
              target.style.transform = "translateY(-2px)";
              target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
            }}
            onMouseOut={(e) => {
              const target = e.currentTarget as HTMLDivElement;
              target.style.transform = "translateY(0)";
              target.style.boxShadow =
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
                }}
              >
                {place.title}
              </h3>
              <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                {place.formattedDate}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Panteefirstpage;
