import React from "react";
import { IoCaretUpCircle, IoCaretDownCircle } from "react-icons/io5";
import { FaCheckCircle } from "react-icons/fa";

interface ScaleProps {
  name: string;
  concentration: string;
  value: number;
  scaleColors: string[];
  scaleValues: number[];
  normalRange?: [number, number];
}

const Scale: React.FC<ScaleProps> = ({
  name,
  concentration,
  value,
  scaleColors,
  scaleValues,
  normalRange = [10, 24],
}) => {
  // Find the closest index in the scale
  const closestIndex = scaleValues.reduce(
    (prev, curr, index) =>
      Math.abs(curr - value) < Math.abs(scaleValues[prev] - value)
        ? index
        : prev,
    0
  );

  const getStatusIcon = () => {
    const [minNormal, maxNormal] = normalRange;

    if (value < minNormal) {
      return <IoCaretDownCircle className="text-red-500 text-xl" />;
    } else if (value > maxNormal) {
      return <IoCaretUpCircle className="text-red-500 text-xl" />;
    } else {
      return <FaCheckCircle className="text-green-500 text-xl" />;
    }
  };

  // กำหนดข้อความสถานะ
  const getStatusText = () => {
    const [minNormal, maxNormal] = normalRange;

    if (value < minNormal) {
      return "Low";
    } else if (value > maxNormal) {
      return "High";
    } else {
      return "OK";
    }
  };

  // Check if a scale value is within normal range
  const isInNormalRange = (scaleValue: number) => {
    const [minNormal, maxNormal] = normalRange;
    return scaleValue >= minNormal && scaleValue <= maxNormal;
  };

  // Find the range of boxes that are in normal range
  const getNormalRangeBoxes = () => {
    const normalBoxes = [];
    for (let i = 0; i < scaleValues.length; i++) {
      if (isInNormalRange(scaleValues[i])) {
        normalBoxes.push(i);
      }
    }
    return normalBoxes;
  };

  const normalBoxes = getNormalRangeBoxes();
  const hasNormalRange = normalBoxes.length > 0;
  const firstNormalBox = hasNormalRange ? normalBoxes[0] : 0;
  const lastNormalBox = hasNormalRange
    ? normalBoxes[normalBoxes.length - 1]
    : 0;

  return (
    <div className="flex items-center -space-x-8 mb-7">
      <div className="flex items-center space-x-5">
        {/* ไอคอนสถานะ */}
        {getStatusIcon()}

        <div className="flex flex-col w-50">
          {" "}
          {/* Fixed width to align text */}
          <div className="text-lg font-bold truncate">{name}</div>
          <div className="text-sm text-gray-600 truncate">{concentration}</div>
        </div>
      </div>

      <div className="flex items-center space-x-2 relative">
        {/* Single green border container for normal range */}
        {hasNormalRange && (
          <>
            <div
              className="absolute border border-green-500/10 bg-green-500/50  pointer-events-none"
              style={{
                left: `${firstNormalBox * 32 - 4}px`,
                width: `${
                  (lastNormalBox - firstNormalBox + 1) * 24 +
                  (lastNormalBox - firstNormalBox) * 8 +
                  8
                }px`,
                height: "31px",
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <div
              className="absolute text-green-500 text-xs pointer-events-none"
              style={{
                left: `${firstNormalBox * 32 - 4}px`,
                width: `${
                  (lastNormalBox - firstNormalBox + 1) * 24 +
                  (lastNormalBox - firstNormalBox) * 8 +
                  8
                }px`,
                top: "calc(50% + 20.5px)",
                textAlign: "center",
              }}
            >
              OK
            </div>
          </>
        )}

        {scaleColors.map((color, index) => (
          <div
            key={index}
            className={`w-6 h-6 relative border-2 border-black flex items-center justify-center z-10 ${
              index === closestIndex ? "scale-130" : ""
            }`}
            style={{ backgroundColor: color }}
          >
            {index === closestIndex && (
              <>
                <div className="absolute top-[-18px] text-black left-1/2 transform -translate-x-1/2 text-sm scale-[0.769] origin-top">
                  {value}
                </div>
                {getStatusText() !== "OK" && (
                  <div className="absolute bottom-[-18px] text-black left-1/2 transform -translate-x-1/2 text-xs scale-[0.769] origin-bottom">
                    {getStatusText()}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Scale;
