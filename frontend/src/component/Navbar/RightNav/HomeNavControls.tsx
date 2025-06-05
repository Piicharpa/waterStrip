import React from "react";
import { RxCross2 } from "react-icons/rx";
import FilterDropdowns from "../../FilterDropdowns";

interface Props {
  selectedQuality: string;
  setSelectedQuality: (value: string) => void;
  selectedBrand: string;
  setSelectedBrand: (value: string) => void;
  brands: string[];
  username: string;
  userEmail: string;
  showUserPopup: boolean;
  setShowUserPopup: (value: boolean) => void;
  handleLogout: () => void;
  userPopupRef: React.RefObject<HTMLDivElement>;
}

const HomeNavControls: React.FC<Props> = ({
  selectedQuality,
  setSelectedQuality,
  selectedBrand,
  setSelectedBrand,
  brands,
  username,
  userEmail,
  showUserPopup,
  setShowUserPopup,
  handleLogout,
  userPopupRef,
}) => {
  return (
    <div className="flex items-center gap-4">
      <FilterDropdowns
        selectedQuality={selectedQuality}
        setSelectedQuality={setSelectedQuality}
        selectedBrand={selectedBrand}
        setSelectedBrand={setSelectedBrand}
        brands={brands}
      />

      {/* User Profile Circle with Popup */}
      <div className="relative" ref={userPopupRef}>
        <div
          className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-full font-bold cursor-pointer"
          onClick={() => setShowUserPopup(!showUserPopup)}
        >
          {username.charAt(0)}
        </div>

        {showUserPopup && (
          <div className="absolute top-full right-0 mt-2 w-70 bg-white border border-gray-200 rounded-lg shadow-lg z-[10001]">
            <div className="flex items-center justify-between p-3 border-gray-200">
              <div></div>
              <div className="text-sm text-black truncate">{userEmail}</div>
              <button
                onClick={() => setShowUserPopup(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                <RxCross2 />
              </button>
            </div>

            <div className="flex flex-col items-center -mt-2 p-4">
              <div className="w-15 h-15 bg-black text-white flex items-center justify-center rounded-full font-bold text-2xl mb-3">
                {username.charAt(0)}
              </div>
              <div className="text-center text-gray-800 mb-4">
                <span className="text-base">Hi, </span>
                <span className="text-base">{username}</span>
              </div>
            </div>

            <div className="p-3 -mt-6 border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full bg-black text-white py-2 px-4 rounded-lg text-base cursor-pointer hover:bg-gray-800 transition"
              >
                log out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeNavControls;
