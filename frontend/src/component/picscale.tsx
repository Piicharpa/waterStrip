import React from "react";

interface PicScaleProps {
  scaleColors: string[];
}

const MAX_SLOTS = 16;

const PicScale: React.FC<PicScaleProps> = ({ scaleColors }) => {
  const filledColors = [...scaleColors, ...Array(MAX_SLOTS - scaleColors.length).fill("transparent")];

  return (
    <div className="flex flex-col items-center space-y-1">
      {filledColors.map((color, index) => (
    
        <div
          key={index}
          className={'w-6 h-6 ${color !== "transparent" ? "border-2" : ""}'}
          style={{ backgroundColor: color }}
        ></div>
      ))}
    </div>
  );
};

export default PicScale;
