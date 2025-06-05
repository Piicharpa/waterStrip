import React, { useState } from "react";

interface Props {
  selectedQuality: string;
  setSelectedQuality: (value: string) => void;
  selectedBrand: string;
  setSelectedBrand: (value: string) => void;
  brands: string[];
}

const FilterDropdowns: React.FC<Props> = ({
  selectedQuality,
  setSelectedQuality,
  selectedBrand,
  setSelectedBrand,
  brands,
}) => {
  const [openDropdown, setOpenDropdown] = useState<"brand" | "quality" | null>(
    null
  );

  const waterQualityOptions = [
    { value: "", label: "All" },
    { value: "#00c951", label: "Good" },
    { value: "#f0b100", label: "Fair" },
    { value: "#fb2c36", label: "Bad" },
  ];

  const getColorClass = (value: string) => {
    if (value === "")
      return "bg-gradient-to-tr from-green-500 via-yellow-500 to-red-500";
    if (value === "#00c951") return "bg-green-500";
    if (value === "#f0b100") return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center gap-4">
      {/* Water Quality Dropdown */}
      <div className="relative w-14 z-[10000]">
        <div
          onClick={() =>
            setOpenDropdown(openDropdown === "quality" ? null : "quality")
          }
          className="flex items-center justify-between w-15 h-10 p-2 bg-white border border-black rounded-l-full cursor-pointer"
        >
          <div className="flex items-center">
            <div
              className={`w-5 h-5 mr-2 rounded-full ${getColorClass(
                selectedQuality
              )}`}
            />
          </div>
          <svg className="w-4 h-4" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>

        {openDropdown === "quality" && (
          <div className="absolute top-full left-0 w-25 mt-4 border border-gray-200 bg-white rounded-lg z-[10001]">
            {waterQualityOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  setSelectedQuality(option.value);
                  setOpenDropdown(null);
                }}
                className="flex items-center p-2 hover:bg-gray-100 hover:rounded-lg cursor-pointer"
              >
                <div
                  className={`w-5 h-5 mr-2 rounded-full ${getColorClass(
                    option.value
                  )}`}
                />
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Brand Dropdown */}
      <div className="relative w-64 z-[10000]">
        <div
          onClick={() =>
            setOpenDropdown(openDropdown === "brand" ? null : "brand")
          }
          className="flex items-center justify-between w-full h-10 p-2 bg-white border rounded-r-full border-black cursor-pointer"
        >
          <span>{selectedBrand || "Select Brand"}</span>
          <svg className="w-4 h-4 ml-2" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>

        {openDropdown === "brand" && (
          <div className="absolute top-full left-0 w-full mt-4 border border-gray-200 bg-white rounded-lg z-[10001] max-h-60 overflow-y-auto">
            <div
              onClick={() => {
                setSelectedBrand("");
                setOpenDropdown(null);
              }}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              All Brands
            </div>
            {brands.map((brand) => (
              <div
                key={brand}
                onClick={() => {
                  setSelectedBrand(brand);
                  setOpenDropdown(null);
                }}
                className="p-2 hover:bg-gray-100 cursor-pointer"
              >
                {brand}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterDropdowns;
