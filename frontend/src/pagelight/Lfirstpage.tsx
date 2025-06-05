import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import MapView from "../component/map/MapView";
import { auth } from "../firebase";
import { loginWithGoogle, signupWithGoogle, logout } from "../oauth/auth";
import ProvinceStatus from "../component/map/ProvinceStatus";
import { StripDataProvider } from "../contexts/StripDataContext";
import Navbar from "../component/Navbar/Navbar";
import { UserNav, AuthButtons } from "../component/Navbar/RightNav/UserNavAuth";
import AppUser from "../component/Types/AppUser";

const FirstPage = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [userType, setUserType] = useState<"researcher" | "regular" | null>(
    null
  );
  // const [stripData, setStripData] = useState<any[]>([]);

  const loginPopupRef = useRef<HTMLDivElement>(null);
  const signupPopupRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const res = await fetch(`/api/users/${currentUser.uid}`);
          if (res.ok) {
            const userData = await res.json();
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

  // Handle login/signup popup
  useEffect(() => {
    // Global click handler to close popups and reset map/view states
    const handleClick = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;

      const isLoginPopup = loginPopupRef.current?.contains(e.target) ?? false;
      const isSignupPopup = signupPopupRef.current?.contains(e.target) ?? false;
      const isLoginButton =
        e.target.closest("button")?.textContent?.includes("Login") ?? false;
      const isSignupButton =
        e.target.closest("button")?.textContent?.includes("Sign up") ?? false;

      if (showLoginPopup && !isLoginPopup && !isLoginButton)
        setShowLoginPopup(false);
      if (showSignupPopup && !isSignupPopup && !isSignupButton)
        setShowSignupPopup(false);

      if (
        !isLoginPopup &&
        !isSignupPopup &&
        !isLoginButton &&
        !isSignupButton
      ) {
        window.resetMap?.();
      }

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
      const userData = (await loginWithGoogle()) as AppUser;
      if (userData?.u_id && userData?.u_email) {
        setUser(userData);
        navigate("/home");
      } else {
        alert("Please sign up first.");
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
        alert("Signup failed. Please try again.");
        console.error(error);
      }
    }
  };

  useEffect(() => {
    if (user === null) {
      navigate("/");
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate("/");
  };

  return (
    <div className="w-full h-screen flex flex-col fixed">
      <Navbar
        user={user}
        RightComponent={
          user ? (
            <UserNav user={user} handleLogout={handleLogout} />
          ) : (
            <AuthButtons
              onLoginClick={handleLoginClick}
              onSignupClick={handleSignupClick}
              showLoginPopup={showLoginPopup}
              showSignupPopup={showSignupPopup}
              loginPopupRef={loginPopupRef}
              signupPopupRef={signupPopupRef}
              activeButton={activeButton}
              userType={userType}
              setUserType={setUserType}
              handleGoogleSignIn={handleGoogleSignIn}
              handleGoogleSignupWithType={handleGoogleSignupWithType}
            />
          )
        }
      />

      <div className="absolute top-[60px] left-[15px] right-[15px] bottom-[20px]">
        {/* Overlay card */}
        <div className="absolute" style={{ maxWidth: 400, zIndex: 1000 }}>
          <StripDataProvider>
            <ProvinceStatus />
          </StripDataProvider>
        </div>

        {/* Map view behind */}
        <MapView />
      </div>
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
    </div>
  );
};

export default FirstPage;
