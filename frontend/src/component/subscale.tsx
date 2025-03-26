import React from "react";

interface ScaleProps {
  name: string;
  concentration: string;
  value: number;
  scaleColors: string[];
  scaleValues: number[];
}

const Scale: React.FC<ScaleProps> = ({ 
  name, 
  concentration, 
  value, 
  scaleColors, 
  scaleValues 
}) => {
  // Find the closest index in the scale
  const closestIndex = scaleValues.reduce((prev, curr, index) => 
    Math.abs(curr - value) < Math.abs(scaleValues[prev] - value) ? index : prev, 0
  );

  return (
    <div className="flex items-center space-x-4 mb-4">
      <div className="flex flex-col w-40"> {/* Fixed width to align text */}
        <div className="text-lg font-bold truncate">{name}</div>
        <div className="text-sm text-gray-600 truncate">{concentration}</div>
      </div>
      <div className="flex items-center space-x-2 relative">
        {scaleColors.map((color, index) => (
          <div 
            key={index} 
            className={`w-6 h-6 relative border-2 border-black flex items-center justify-center ${index === closestIndex ? 'scale-130' : ''}`}
            style={{ backgroundColor: color }}
          >
            {index === closestIndex && (
              <div 
              className={`absolute top-[-18px] text-black left-1/2 transform -translate-x-1/2 text-sm 
              ${index === closestIndex ? 'scale-[0.769] origin-top' : ''}`}
            >
                {value}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Scale;