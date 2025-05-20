import React from "react";
import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

interface AppUser {
  u_id: string;
  u_email: string | null;
  u_name?: string;
  u_role?: "researcher" | "regular";
}

interface NavbarProps {
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
}

const UserNav = ({ user, handleLogout }: { user: AppUser; handleLogout: () => Promise<void> }) => (
  <div className="flex items-center gap-2">
    <span className="text-sm">{user.u_name}</span>
    <button onClick={handleLogout} className="bg-black text-white px-4 py-1 rounded-lg hover:opacity-80">
      Logout
    </button>
  </div>
);

const AuthButtons = ({
  onLoginClick,
  onSignupClick,
  showLoginPopup,
  showSignupPopup,
  loginPopupRef,
  signupPopupRef,
  activeButton,
  userType,
  setUserType,
  handleGoogleSignIn,
  handleGoogleSignupWithType,
}: Omit<NavbarProps, 'user' | 'activeButton' | 'handleLogout'> & { activeButton: string | null }) => (
  <>
    {/* Signup */}
    <div className="relative">
      <button
        onClick={onSignupClick}
        className={`px-4 py-1 rounded-lg border ${
          activeButton === "signup"
            ? "bg-black text-white border-black"
            : "bg-white text-black border-transparent hover:bg-black hover:text-white hover:border-black"
        }`}
      >
        Sign up
      </button>

      {showSignupPopup && (
        <div
          ref={signupPopupRef}
          className="absolute right-0 mt-5 bg-white shadow-lg rounded-lg p-4 z-[2000] w-80 border border-gray-200"
        >
          <h3 className="text-lg font-semibold mb-3 text-center">SIGN UP FOR A NEW ACCOUNT</h3>
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
                <span className="capitalize">{type}</span>
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

          <button
            onClick={() => handleGoogleSignupWithType(userType || "regular")}
            disabled={!userType}
            aria-disabled={!userType}
            title={!userType ? "Please select user type first" : ""}
            className={`py-2 px-4 rounded flex items-center justify-center gap-2 w-full ${
              !userType
                ? "bg-[#f1f1f1] text-gray-400 cursor-not-allowed border border-[#f1f1f1]"
                : "bg-white hover:bg-gray-100 text-gray-700 border border-[#d6d6d6]"
            }`}
          >
            <FcGoogle className="text-lg" />
            Sign up with Google
          </button>
        </div>
      )}
    </div>

    {/* Login */}
    <div className="relative">
      <button
        onClick={onLoginClick}
        className={`px-4 py-1 rounded-lg border ${
          activeButton === "login"
            ? "bg-black text-white border-black"
            : "bg-white text-black border-transparent hover:bg-black hover:text-white hover:border-black"
        }`}
      >
        Login
      </button>

      {showLoginPopup && (
        <div
          ref={loginPopupRef}
          className="absolute right-0 mt-5 bg-white shadow-lg rounded-lg p-4 z-[2000] w-80 border border-gray-200"
        >
          <h3 className="text-lg font-semibold mb-3 text-center">LOG IN TO YOUR USER ACCOUNT</h3>
          <button
            onClick={handleGoogleSignIn}
            className="bg-white hover:bg-gray-100 text-gray-700 py-2 px-4 rounded border border-gray-300 flex items-center justify-center gap-2 w-full"
            aria-label="Login with Google"
          >
            <FcGoogle className="text-lg" />
            Log in with Google
          </button>
        </div>
      )}
    </div>
  </>
);

const Navbar: React.FC<NavbarProps> = (props) => {
  const {
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
  } = props;

  return (
    <nav className="flex flex-col md:flex-row md:items-center justify-between px-6 py-3 gap-9">
      <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <img src="/image/logo2.png" alt="Logo" className="h-10" />
        <span className="text-xl font-bold text-gray-800">AQUAlity</span>
      </Link>

      <div className="flex flex-col md:flex-row items-center gap-6 w-full">
        {user && (
          <>
            <Link
              to="/home"
              className={`text-xl font-bold px-4 py-2 rounded-lg transition-colors ${
                activeButton === "home"
                  ? "bg-gray-200 text-black"
                  : "text-gray-800 hover:bg-gray-100"
              }`}
            >
              Home
            </Link>
            <Link
              to="/pantee"
              className={`text-xl font-bold px-4 py-2 rounded-lg transition-colors ${
                activeButton === "map"
                  ? "bg-gray-200 text-black"
                  : "text-gray-800 hover:bg-gray-100"
              }`}
            >
              Map
            </Link>
          </>
        )}

        <div className="flex flex-col md:flex-row items-center gap-4 md:ml-auto">
          {user ? (
            <UserNav user={user} handleLogout={handleLogout} />
          ) : (
            <AuthButtons
              onLoginClick={onLoginClick}
              onSignupClick={onSignupClick}
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
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
