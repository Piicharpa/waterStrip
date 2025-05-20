import {
  MapContainer,
  TileLayer,
  CircleMarker,
  
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useRef, useEffect, FC } from "react";
import { useNavigate } from "react-router-dom";
// import { logout, auth } from "../firebase";
import {
  onAuthStateChanged,

} from "firebase/auth";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
// FirstPage.tsx
import {
  loginWithGoogle,
  signupWithGoogle,
  logout,
} from "../oauth/auth";
import { auth } from "../firebase";
import Navbar from "../component/navbar_fp";


//logo
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

//user
interface AppUser {
  u_id: string;
  u_email: string | null;
  u_name?: string;
  u_role?: "researcher" | "regular";
}

//location
interface Location {
  lat: number;
  lng: number;
}

//water data in each location
interface Place {
  id: number;
  title: string;
  date: string;
  location: Location;
  color: string;
  quality: string;
  brand?: string;
}

// Initial map center and zoom level
const INITIAL_CENTER: Location = { lat: 18.7883, lng: 98.9853 };
const INITIAL_ZOOM = 14;

//ตั้งให้แผนที่มีขนาดเต็มจอ
declare global {
  interface Window {
    resetMap?: () => void;
  }
}

//move from dot to dot ไม่ได้ใช้แต่ต้องมี
const ChangeView: FC<{ center: Location }> = ({ }) => {
  return null;
};

//ข้อมูลในdots
const PlaceMarker: FC<{
  place: Place;
  //ใช้ refCallback เพื่อเก็บ reference ของ CircleMarker เพื่อให้สามารถเข้าถึงได้จากภายนอกดูว่าเป็นdotsอันไหน
  refCallback: (ref: L.CircleMarker | null) => void;
}> = ({ place, refCallback }) => (
  <CircleMarker
    center={[place.location.lat, place.location.lng]}
    radius={7}
    fillColor={place.color}
    fillOpacity={1}
    stroke={false}
    ref={refCallback}
  ></CircleMarker>
);

const FirstPage = () => {
  const [showText] = useState(true);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [userType, setUserType] = useState<"researcher" | "regular" | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const loginPopupRef = useRef<HTMLDivElement>(null);
  const signupPopupRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: number]: L.CircleMarker }>({});
  const navigate = useNavigate();

  // const [currentLocation, setCurrentLocation] = useState<Location>(INITIAL_CENTER);
  const [viewLocation] = useState<Location>(INITIAL_CENTER);
  const [places, setPlaces] = useState<Place[]>([]);
 
  const dmsToDecimal = (dms: string): number => {
    const regex = /(\d+)[°](\d+)'(\d+\.\d+)"([NSEW])/;
    const match = dms.match(regex);
    if (!match) throw new Error("Invalid DMS format");

    const degrees = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = parseFloat(match[3]);
    const direction = match[4];

    let decimal = degrees + minutes / 60 + seconds / 3600;
    return direction === "S" || direction === "W" ? -decimal : decimal;
  };

  useEffect(() => {
    const fetchPlacesData = async () => {
      try {
        // เรียก API ใหม่ที่รวมข้อมูลไว้เรียบร้อยแล้ว
        const response = await fetch("/api/strip-status/public");
        const data = await response.json();

        // Map ข้อมูลให้อยู่ในรูปแบบที่ frontend ใช้
        const mappedPlaces = data.map((strip: any) => {
          const lat = dmsToDecimal(strip.s_latitude);
          const lng = dmsToDecimal(strip.s_longitude);

          return {
            id: strip.s_id,
            location: {
              lat,
              lng,
            },
            color: strip.s_qualitycolor
          };
        });

        setPlaces(mappedPlaces);
      } catch (error) {
        console.error("Error fetching public strip data:", error);
      }
    };

    fetchPlacesData();
  }, []);

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const response = await fetch(`/api/users/${currentUser.uid}`);
          if (response.ok) {
            const userData = await response.json();
            sessionStorage.setItem("userId", userData.u_id);
            setUser(userData);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Global click handler to close popups and reset map/view states
    const handleClick = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;

      const isMapClick = mapRef.current?.contains(e.target) ?? false;
      const targetClassName = (e.target as Element).className || "";
      const isLeafletControl =
        typeof targetClassName === "string" &&
        (targetClassName.includes("leaflet-control") || targetClassName.includes("leaflet-zoom"));
      const isLoginPopup = loginPopupRef.current?.contains(e.target) ?? false;
      const isSignupPopup = signupPopupRef.current?.contains(e.target) ?? false;
      const isLoginButton = e.target.closest("button")?.textContent?.includes("Login") ?? false;
      const isSignupButton = e.target.closest("button")?.textContent?.includes("Sign up") ?? false;

      if (showLoginPopup && !isLoginPopup && !isLoginButton) setShowLoginPopup(false);
      if (showSignupPopup && !isSignupPopup && !isSignupButton) setShowSignupPopup(false);

      if (!isMapClick && !isLeafletControl && !isLoginPopup && !isSignupPopup && !isLoginButton && !isSignupButton) {
        window.resetMap?.();
      }

      if (!isLoginButton && !isSignupButton && !isLoginPopup && !isSignupPopup) {
        setActiveButton(null);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showLoginPopup, showSignupPopup]);

  const handleLoginClick = () => {
    setActiveButton("login");
    setShowLoginPopup((prev) => !prev);
    setShowSignupPopup(false);
  };

  const handleSignupClick = () => {
    setActiveButton("signup");
    setShowSignupPopup((prev) => !prev);
    setShowLoginPopup(false);
  };

  const handleGoogleSignIn = async () => {
  try {
    const userData = await loginWithGoogle() as AppUser;
    if (userData && userData.u_id && userData.u_email) {
      setUser(userData);
      navigate("/home");
    } else {
      alert("please Sign Up");
      navigate("/");
    }
  } catch (error) {
    console.error("Login error:", error);
  }
};

const handleGoogleSignupWithType = async (type: "researcher" | "regular") => {
  setUserType(type);

  try {
    const userData = await signupWithGoogle(type);
    setUser(userData);
    navigate("/permission");
  } catch (error: any) {
    if (error.message === "already_registered") {
      alert("This email is already registered. Please log in.");
      await logout();
      setUser(null);
      navigate("/");
    } else {
      console.error("Signup error:", error);
      alert("Signup failed. Please try again.");
    }
  }
};


  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };


  return (
    <div ref={pageRef} className="w-full h-screen flex flex-col" style={{ position: "fixed" }}>
      <Navbar
        user={user}
        activeButton={activeButton}
        onLoginClick={handleLoginClick}
        onSignupClick={handleSignupClick}
        showLoginPopup={showLoginPopup}
        showSignupPopup={showSignupPopup}
        loginPopupRef={loginPopupRef}
        signupPopupRef={signupPopupRef}
        userType={userType}
        setUserType={setUserType}
        handleGoogleSignIn={handleGoogleSignIn}
        handleGoogleSignupWithType={handleGoogleSignupWithType}
        handleLogout={handleLogout}
      />
      <div
        ref={mapRef}
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
          zoom={INITIAL_ZOOM}
          className="mt-1 rounded-4xl"
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {places.map((place) => (
            <PlaceMarker
              key={place.id}
              place={place}
              refCallback={(ref) => {
                if (ref) markersRef.current[place.id] = ref;
              }}
            />
          ))}
          <ChangeView center={viewLocation} />
         
        </MapContainer>
      </div>
      {showText && (
            <div className="absolute bottom-10 left-10 z-[1000]">
              <p className="text-base font-medium">
                Check and read the values of substances in water
              </p>
              <p className="text-base font-medium">from strip photography</p>
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-3xl font-bold">AQUA,</p>
                  <p className="text-3xl font-bold">Quality</p>
                </div>
                {/* ปุ่มวงกลมสีน้ำเงินที่มีลูกศร > */}
                <button
                  className="w-10 h-10 bg-black hover:bg-white rounded-full flex items-center justify-center text-white hover:text-black ml-3"
                  onClick={() => navigate("/panteefirstpage")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
    </div>
  );
};

export default FirstPage;
