import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useRef, useEffect } from "react";
import { LatLngExpression } from "leaflet";
import { useNavigate, Link } from "react-router-dom";
import { logout, auth } from "../firebase";
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import axios from "axios";

interface AppUser {
  u_id: string;
  u_email: string | null;
  u_name?: string;
  u_role?: "researcher" | "regular";
}

// กำหนดค่าตำแหน่งเริ่มต้น
const INITIAL_CENTER: [number, number] = [18.7883, 98.9853]; // เชียงใหม่
const INITIAL_ZOOM = 14;
// กำหนด interface สำหรับ props
interface MapControllerProps {
  setShowText: React.Dispatch<React.SetStateAction<boolean>>;
  navigateToNextPage: () => void; // เพิ่ม prop สำหรับการนำทาง
}
// เพิ่ม type ให้กับ window object
declare global {
  interface Window {
    resetMap?: () => void;
  }
}
function MapController({ setShowText, navigateToNextPage }: MapControllerProps) {
  const map = useMap();

  // เพิ่ม event listener สำหรับการคลิกที่แผนที่
  useEffect(() => {
    const handleMapClick = () => {
      setShowText(false);
      navigateToNextPage(); // เรียกใช้ฟังก์ชันนำทางเมื่อคลิกที่แผนที่
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, setShowText, navigateToNextPage]);

  // ปรับปรุง window.resetMap เพื่อให้แสดง showText ด้วย
  useEffect(() => {
    window.resetMap = () => {
      map.flyTo(INITIAL_CENTER, INITIAL_ZOOM);
      setShowText(true);
    };
    return () => {
      window.resetMap = undefined;
    };
  }, [map, setShowText]);

  return null;
}
function FirstPage() {
  const [showText, setShowText] = useState(true);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [userType, setUserType] = useState<"researcher" | "regular" | null>(
    null
  );
  const [mobileMenuOpen] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const loginPopupRef = useRef<HTMLDivElement>(null);
  const signupPopupRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // สร้างฟังก์ชันสำหรับการนำทางไปยังหน้า panteefirstpage
  const navigateToNextPage = () => {
    navigate("/panteefirstpage");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // console.log("Current User:", currentUser);
      if (currentUser) {
        try {
          const response = await fetch(
            `http://localhost:3003/users/${currentUser.uid}`
          );
          if (response.ok) {
            const userData = await response.json();
            sessionStorage.setItem("userId", userData.u_id);
            // console.log("User Data:", userData);
            setUser(userData);
          } else {
            console.error("User not found in backend");
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        // console.log("No user logged in");
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;
      const isMapClick = mapRef.current && mapRef.current.contains(e.target);
      const isLeafletControl =
        e.target.className &&
        typeof e.target.className === "string" &&
        (e.target.className.includes("leaflet-control") ||
          e.target.className.includes("leaflet-zoom"));
      const isLoginPopup =
        loginPopupRef.current && loginPopupRef.current.contains(e.target);
      const isSignupPopup =
        signupPopupRef.current && signupPopupRef.current.contains(e.target);

      // แก้ไขตรงนี้: ใช้ includes แทน === เพื่อให้ตรวจจับได้ทั้ง "Login" และ "Sign up"
      const isLoginButton = e.target
        .closest("button")
        ?.innerText?.includes("Login");
      const isSignupButton = e.target
        .closest("button")
        ?.innerText?.includes("Sign up");

      // Close login popup when clicking outside
      if (showLoginPopup && !isLoginPopup && !isLoginButton) {
        setShowLoginPopup(false);
      }
      // Close signup popup when clicking outside
      if (showSignupPopup && !isSignupPopup && !isSignupButton) {
        setShowSignupPopup(false);
      }

      // เพิ่มเงื่อนไขสำหรับการรีเซ็ตแผนที่และแสดง text overlay เมื่อคลิกที่อื่นนอกเหนือจากแผนที่
      if (
        !isMapClick &&
        !isLeafletControl &&
        !isLoginPopup &&
        !isSignupPopup &&
        !isLoginButton &&
        !isSignupButton
      ) {
        window.resetMap?.();
      }

      // แก้ไขตรงนี้: ให้รีเซ็ต activeButton เฉพาะเมื่อคลิกนอกทั้งหมด และไม่ใช่ภายในป๊อปอัพ
      if (
        !isLoginButton &&
        !isSignupButton &&
        !isLoginPopup &&
        !isSignupPopup
      ) {
        setActiveButton(null);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showLoginPopup, showSignupPopup]);

  const handleLoginClick = () => {
    setActiveButton("login");
    setShowLoginPopup(!showLoginPopup);
    setShowSignupPopup(false);
  };

  const handleSignupClick = () => {
    setActiveButton("signup");
    setShowSignupPopup(!showSignupPopup);
    setShowLoginPopup(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const googleId = user.uid;

      // console.log("Google UID:", googleId);

      // เช็คว่าผู้ใช้มีบัญชีหรือไม่
      const response = await axios.post(
        "http://localhost:3003/users/check-user",
        { u_id: googleId }
      );
      // console.log("Check-user response:", response.data);

      const data = response.data as { exists: boolean };

      if (data.exists) {
        // console.log("User exists — navigating to /home");
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

        if (!response.ok) {
          throw new Error("Failed to create user");
        }

        // ดึงข้อมูล user ที่สมัครสำเร็จจาก API response ทันที
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
    <div
      ref={pageRef}
      className="w-full h-screen flex flex-col"
      style={{ position: "fixed" }}
    >
      {/* Navbar */}
      <nav className="flex flex-col md:flex-row md:items-center justify-between px-6 py-3 gap-9 ">
        <Link
          to="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <img src="/image/logo2.png" alt="Logo" className="h-10" />
          <span className="text-xl font-bold text-gray-800">AQUAlity</span>
        </Link>
        {/* Nav Links */}
        <div
          className={`flex-col md:flex-row md:flex items-center gap-6 w-full ${
            mobileMenuOpen ? "flex" : "hidden"
          } md:!flex`}
        >
          {user && (
            <div className="ml-0.5">
              <Link
                to="/home"
                className="text-black text-base hover:underline px-4 py-2 rounded-lg transition-colors"
              >
                Home
              </Link>
              <Link
                to="/pantee"
                className="text-black text-base hover:underline px-8 py-2 rounded-lg transition-colors"
              >
                Map
              </Link>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center gap-4 md:ml-auto">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-base">{user.u_name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-black text-white  px-4 py-1 rounded-lg"
                >
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
                    onClick={handleSignupClick}
                  >
                    Sign up
                  </button>

                  {showSignupPopup && (
                    <div
                      ref={signupPopupRef}
                      className="absolute right-0 mt-5 bg-white shadow-lg rounded-lg p-4 z-[2000] w-100 border border-gray-200"
                    >
                      <h3 className="text-lg font-semibold mb-3 text-center">
                        SIGN UP FOR A NEW ACCOUNT
                      </h3>

                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-2 text-center">
                          User type:
                        </p>
                        <div className="flex gap-4 justify-center mb-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                userType === "researcher"
                                  ? "border-black bg-black"
                                  : "border-gray-300"
                              }`}
                            >
                              {userType === "researcher" && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <span
                              className={`${
                                userType === "researcher" ? "font-base" : ""
                              }`}
                            >
                              Researcher
                            </span>
                            <input
                              type="radio"
                              name="userType"
                              value="researcher"
                              className="sr-only"
                              checked={userType === "researcher"}
                              onChange={() => setUserType("researcher")}
                            />
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                userType === "regular"
                                  ? "border-black bg-black"
                                  : "border-gray-300"
                              }`}
                            >
                              {userType === "regular" && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <span
                              className={`${
                                userType === "regular" ? "font-base" : ""
                              }`}
                            >
                              General
                            </span>
                            <input
                              type="radio"
                              name="userType"
                              value="regular"
                              className="sr-only"
                              checked={userType === "regular"}
                              onChange={() => setUserType("regular")}
                            />
                          </label>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() =>
                            handleGoogleSignupWithType(userType || "regular")
                          }
                          disabled={!userType}
                          className={`py-2 px-4 rounded flex items-center justify-center gap-2 ${
                            !userType
                              ? "bg-[#f1f1f1] text-gray-400  cursor-not-allowed border border-[#f1f1f1]"
                              : "bg-white hover:bg-gray-100 text-gray-700 border border-[#d6d6d6]"
                          }`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                              <path
                                fill="#4285F4"
                                d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                              />
                              <path
                                fill="#34A853"
                                d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                              />
                              <path
                                fill="#EA4335"
                                d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                              />
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
                    onClick={handleLoginClick}
                  >
                    Login
                  </button>
                  {showLoginPopup && (
                    <div
                      ref={loginPopupRef}
                      className="absolute right-0 mt-5 bg-white shadow-lg rounded-lg  p-4 z-[2000] w-100 border border-gray-200"
                    >
                      <h3 className="text-lg font-semibold mb-3 text-center">
                        LOG IN TO YOUR USER ACCOUNT
                      </h3>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={handleGoogleSignIn}
                          className="bg-white hover:bg-gray-100 text-gray-700 py-2 px-4 rounded border border-gray-300 flex items-center justify-center gap-2"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                              <path
                                fill="#4285F4"
                                d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                              />
                              <path
                                fill="#34A853"
                                d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                              />
                              <path
                                fill="#EA4335"
                                d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                              />
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
      {/* Map Section */}
      <div className="flex-grow p-4 -mt-4 relative">
        <div ref={mapRef} className="w-full h-full rounded-4xl overflow-hidden">
          <MapContainer
            center={INITIAL_CENTER as LatLngExpression}
            zoom={INITIAL_ZOOM}
            className="w-full h-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapController setShowText={setShowText} navigateToNextPage={navigateToNextPage} />
          </MapContainer>
          {/* Text overlay */}
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
                  onClick={navigateToNextPage}
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
      </div>
    </div>
  );
}
export default FirstPage;