import React from "react";
import { FaLocationCrosshairs } from "react-icons/fa6";
import FilterDropdowns from "../../FilterDropdowns";

interface Props {
  selectedQuality: string;
  setSelectedQuality: (value: string) => void;
  selectedBrand: string;
  setSelectedBrand: (value: string) => void;
  brands: string[];
  handleLocate: () => void;
}
const MapNavControls: React.FC<Props> = ({
  selectedQuality,
  setSelectedQuality,
  selectedBrand,
  setSelectedBrand,
  brands,
  handleLocate,
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

      {/* Locate Button */}
      <button
        onClick={handleLocate}
        className="bg-white hover:bg-black text-black hover:text-white p-2 rounded-full transition-colors"
        title="Find my location"
      >
        <FaLocationCrosshairs size={20} />
      </button>
    </div>
  );
};

export default MapNavControls;
