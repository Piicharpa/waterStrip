import { Link } from "react-router-dom";
import AppUser from "../Types/AppUser";

const LeftNav = ({ user }: { user: AppUser | null }) => (
  <div className="flex items-center gap-6">
    <Link
      to="/"
      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
    >
      <img src="/image/logo2.png" alt="Logo" className="h-10" />
      <span className="text-xl font-bold text-gray-800">AQUAlity</span>
    </Link>

    {user && (
      <>
        <Link
          to="/home"
          className="text-gray-800 text-base hover:underline px-4 py-2 rounded-lg transition-colors"
        >
          Home
        </Link>
        <Link
          to="/pantee"
          className="text-gray-800 text-base hover:underline px-2 py-2 rounded-lg transition-colors"
        >
          Map
        </Link>
      </>
    )}
  </div>
);

export default LeftNav;
