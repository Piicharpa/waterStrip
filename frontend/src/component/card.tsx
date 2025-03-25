import React from "react";

interface CardProps {
  imageUrl: string;
  brand: string;
  dateTime: string;
  location: string;
  waterQuality: number;
}

const getWaterQualityColor = (quality: number) => {
  if (quality >= 0 && quality <= 24) return "#e74c3c";
  if (quality >= 25 && quality <= 49) return "#FF8A24";
  if (quality >= 50 && quality <= 74) return "#FFE521";
  return "#7ECF1B";
};

const Card: React.FC<CardProps> = ({ imageUrl, brand, dateTime, location, waterQuality }) => {
  return (
    <div className="w-60 h-70 bg-black text-white p-4 rounded-2xl shadow-lg">
      <div className="w-full h-32 bg-blue-400 rounded-xl overflow-hidden">
        <img src={imageUrl} alt="Brand" className="w-full h-full object-cover" />
      </div>
      <div className="mt-3">
        <h2 className="text-lg font-bold">{brand}</h2>
        <p className="text-sm mt-1 text-[#bfbfbf]">{location}</p>
        <p className="text-base  text-white">{dateTime}</p>
      </div>
      <div className="mt-3 flex justify-end">
        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: getWaterQualityColor(waterQuality) }}></div>
      </div>
    </div>
  );
};

export default Card;
