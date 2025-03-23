import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useRef, useEffect } from "react";
import { LatLngExpression } from "leaflet";
import { useNavigate } from "react-router-dom";

// กำหนดค่าตำแหน่งเริ่มต้น
const INITIAL_CENTER: [number, number] = [18.7883, 98.9853]; // เชียงใหม่
const INITIAL_ZOOM = 14;

// กำหนด interface สำหรับ props
interface MapControllerProps {
  setShowText: React.Dispatch<React.SetStateAction<boolean>>;
}

// เพิ่ม type ให้กับ window object
declare global {
  interface Window {
    resetMap?: () => void;
  }
}

function MapController({ setShowText }: MapControllerProps) {
    const map = useMap();
  
    useMapEvents({
      movestart: () => setShowText(false),
      zoomstart: () => setShowText(false),
    });
  
    useEffect(() => {
      window.resetMap = () => {
        map.flyTo(INITIAL_CENTER, INITIAL_ZOOM);
        setTimeout(() => setShowText(true), 300); // ✅ เพิ่ม delay ป้องกันข้อความหาย
      };
  
      return () => {
        window.resetMap = undefined;
      };
    }, [map, setShowText]);
  
    return null;
  }

function FirstPage() {
  const [showText, setShowText] = useState(true);
  const pageRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;

      const isMapClick = mapRef.current && mapRef.current.contains(e.target);
      const isLeafletControl = e.target.className && 
                              (typeof e.target.className === 'string' &&
                              (e.target.className.includes('leaflet-control') || 
                               e.target.className.includes('leaflet-zoom')));

      if (!isMapClick && !isLeafletControl) {
        window.resetMap?.(); // รีเซ็ตทั้งตำแหน่งและซูมในคลิกเดียว
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div ref={pageRef} className="w-full h-screen flex flex-col" style={{ position: "fixed"}}>
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-3 bg-white">
        <div className="flex items-center gap-2">
          <img src="/image/logo2.png" alt="Logo" className="h-10" />
          <span className="text-lg font-bold">AQUAlity</span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="text-black">A</a>
          <a href="#" className="text-black">B</a>
          <a href="#" className="text-black">C</a>
          <a href="#" className="text-black">D</a>
          <a href="#" className="text-black">Signin</a>
          <button className="bg-black hover:bg-[#ffffff] border border-transparent hover:border-black text-white hover:text-black px-4 py-1 rounded-lg">Login</button>
        </div>
      </nav>
      
      {/* Map Section */}
      <div className="flex-grow p-4 -mt-4 relative">
        <div ref={mapRef} className="w-full h-full rounded-4xl overflow-hidden">
          <MapContainer
            center={INITIAL_CENTER as LatLngExpression}
            zoom={INITIAL_ZOOM}
            className="w-full h-full">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapController setShowText={setShowText} />
          </MapContainer>
          
          {/* Text overlay */}
          {showText && (
            <div className="absolute bottom-10 left-10 z-[1000]">
              <p className="text-base font-medium">Check and read the values of substances in water</p>
              <p className="text-base font-medium">from strip photography</p>
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-3xl font-bold">AQUA,</p>
                  <p className="text-3xl font-bold">Quality</p>
                </div>
                {/* ปุ่มวงกลมสีน้ำเงินที่มีลูกศร > */}
                <button 
                  className="w-10 h-10 bg-black hover:bg-white rounded-full flex items-center justify-center text-white hover:text-black ml-3"
                  onClick={() => navigate("/pantee")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FirstPage;
