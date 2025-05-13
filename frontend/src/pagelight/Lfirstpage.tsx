import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
  
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useRef, useEffect, FC } from "react";
import { useNavigate, Link } from "react-router-dom";
import { logout, auth } from "../firebase";
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import axios from "axios";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";


const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface AppUser {
  u_id: string;
  u_email: string | null;
  u_name?: string;
  u_role?: "researcher" | "regular";
}

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
  brand?: string;
}

const INITIAL_CENTER: Location = { lat: 18.7883, lng: 98.9853 };
const INITIAL_ZOOM = 14;

declare global {
  interface Window {
    resetMap?: () => void;
  }
}

const ChangeView: FC<{ center: Location }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], INITIAL_ZOOM);
  }, [center, map]);
  return null;
};

const PlaceMarker: FC<{
  place: Place;
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

const Navbar: FC<{
  user: AppUser | null;
  activeButton: string | null;
  onLoginClick: () => void;
  onSignupClick: () => void;
  showLoginPopup: boolean;
  showSignupPopup: boolean;
  loginPopupRef: React.RefObject<HTMLDivElement>;
  signupPopupRef: React.RefObject<HTMLDivElement>;
  userType: "researcher" | "regular" | null;
  setUserType: React.Dispatch<React.SetStateAction<"researcher" | "regular" | null>>;
  handleGoogleSignIn: () => Promise<void>;
  handleGoogleSignupWithType: (type: "researcher" | "regular") => Promise<void>;
  handleLogout: () => Promise<void>;
}> = ({
  user,
  activeButton,
  onLoginClick,
  onSignupClick,
  showLoginPopup,
  showSignupPopup,
  loginPopupRef,
  signupPopupRef,
  userType,
  setUserType,
  handleGoogleSignIn,
  handleGoogleSignupWithType,
  handleLogout,
}) => (
  <nav className="flex flex-col md:flex-row md:items-center justify-between px-6 py-3 gap-9">
    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
      <img src="/image/logo2.png" alt="Logo" className="h-10" />
      <span className="text-xl font-bold text-gray-800">AQUAlity</span>
    </Link>
    <div className="flex md:flex-row md:flex items-center gap-6 w-full md:!flex">
      {user && (
        <>
          <Link
            to="/home"
            className="text-gray-800 text-xl font-bold hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
          >
            Home
          </Link>
          <Link
            to="/pantee"
            className="text-gray-800 text-xl font-bold hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
          >
            Map
          </Link>
        </>
      )}
      <div className="flex flex-col md:flex-row items-center gap-4 md:ml-auto">
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">{user.u_name}</span>
            <button onClick={handleLogout} className="bg-black text-white px-4 py-1 rounded-lg">
              Logout
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              <button
                className={`px-4 py-1 rounded-lg border ${
                  activeButton === "signup"
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-transparent hover:bg-black hover:text-white hover:border-black"
                }`}
                onClick={onSignupClick}
              >
                Sign up
              </button>
              {showSignupPopup && (
                <div
                  ref={signupPopupRef}
                  className="absolute right-0 mt-5 bg-white shadow-lg rounded-lg p-4 z-[2000] w-100 border border-gray-200"
                >
                  <h3 className="text-lg font-semibold mb-3 text-center">SIGN UP FOR A NEW ACCOUNT</h3>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2 text-center">User type:</p>
                    <div className="flex gap-4 justify-center mb-3">
                      {["researcher", "regular"].map((type) => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              userType === type ? "border-black bg-black" : "border-gray-300"
                            }`}
                          >
                            {userType === type && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <span className={`${userType === type ? "font-base" : ""}`} style={{ textTransform: "capitalize" }}>
                            {type}
                          </span>
                          <input
                            type="radio"
                            name="userType"
                            value={type}
                            className="sr-only"
                            checked={userType === type}
                            onChange={() => setUserType(type as "researcher" | "regular")}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleGoogleSignupWithType(userType || "regular")}
                      disabled={!userType}
                      className={`py-2 px-4 rounded flex items-center justify-center gap-2 ${
                        !userType
                          ? "bg-[#f1f1f1] text-gray-400 cursor-not-allowed border border-[#f1f1f1]"
                          : "bg-white hover:bg-gray-100 text-gray-700 border border-[#d6d6d6]"
                      }`}
                    >
                      {/* Google icon */}
                      <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                          <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L..." />
                          <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L..." />
                          <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C..." />
                          <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L..." />
                        </g>
                      </svg>
                      Sign up with Google
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                className={`px-4 py-1 rounded-lg border ${
                  activeButton === "login"
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-transparent hover:bg-black hover:text-white hover:border-black"
                }`}
                onClick={onLoginClick}
              >
                Login
              </button>
              {showLoginPopup && (
                <div
                  ref={loginPopupRef}
                  className="absolute right-0 mt-5 bg-white shadow-lg rounded-lg p-4 z-[2000] w-100 border border-gray-200"
                >
                  <h3 className="text-lg font-semibold mb-3 text-center">LOG IN TO YOUR USER ACCOUNT</h3>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleGoogleSignIn}
                      className="bg-white hover:bg-gray-100 text-gray-700 py-2 px-4 rounded border border-gray-300 flex items-center justify-center gap-2"
                    >
                      {/* Google icon */}
                      <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                          <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L..." />
                          <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L..." />
                          <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C..." />
                          <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L..." />
                        </g>
                      </svg>
                      Log in with Google
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  </nav>
);

const FirstPage = () => {
  const [showText, setShowText] = useState(true);
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

  const [currentLocation, setCurrentLocation] = useState<Location>(INITIAL_CENTER);
  const [viewLocation, setViewLocation] = useState<Location>(INITIAL_CENTER);
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
        const response = await fetch("http://localhost:3003/strip-status/public");
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
          const response = await fetch(`http://localhost:3003/users/${currentUser.uid}`);
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
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const response = await axios.post("http://localhost:3003/users/check-user", { u_id: user.uid });
      if ((response.data as { exists: boolean }).exists) {
        navigate("/home");
      } else {
        alert("please Sign Up");
        navigate("/");
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const handleGoogleSignupWithType = async (type: "researcher" | "regular") => {
    if (!type) return;
    setUserType(type);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user) {
        const response = await fetch("http://localhost:3003/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            u_id: user.uid,
            u_name: "",
            u_email: user.email,
            u_role: type,
          }),
        });

        if (!response.ok) throw new Error("Failed to create user");

        const userData = await response.json();
        setUser(userData);
        navigate("/permission");
      }
    } catch (error) {
      console.error("Error signing up with Google:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
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
