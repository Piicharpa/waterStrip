import React from "react";
import { FaTrash } from "react-icons/fa6";

interface CardProps {
  imageUrl: string;
  brand: string;
  dateTime: string;
  location: string;
  waterQualityColor?: string; // สีของคุณภาพน้ำ
  cardColor?: string; // สีพื้นหลังของการ์ด
  textColor?: string; // สีข้อความของแบรนด์
  textColorLocation?: string; // สีข้อความสำหรับ location
  textColorDateTime?: string; // สีข้อความสำหรับ dateTime
  onClick?: () => void; // ฟังก์ชันที่เรียกเมื่อการ์ดถูกคลิก
  onDelete?: () => void; // ฟังก์ชันสำหรับจัดการการกดปุ่มลบ
}

const Card: React.FC<CardProps> = ({
  imageUrl,
  brand,
  dateTime,
  location,
  waterQualityColor,
  onClick,
  onDelete,
  cardColor = "bg-black",
  textColor = "text-white",
  textColorLocation = "text-gray-400",
  textColorDateTime = "text-white",
}) => {
  // จัดการการคลิกปุ่มลบโดยไม่ให้กระจายไปยัง onClick ของการ์ด
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // ป้องกันไม่ให้ event กระจายไปยัง parent (card)
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div
      className={`w-60 h-70 ${cardColor} text-white p-4 rounded-2xl shadow-lg relative`}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {/* ปุ่มถังขยะที่มุมบนขวา */}
      {onDelete && (
        <div 
          className="absolute top-2 right-2 z-10 p-2 rounded-full bg-transparent bg-opacity-30 hover:bg-opacity-50 transition"
          onClick={handleDeleteClick}
        >
          <FaTrash size={16} className="text-white" />
        </div>
      )}

      <div className="w-full h-32 bg-transparent overflow-hidden flex items-center justify-center">
        <img
          src={imageUrl}
          alt="Brand"
          className="h-52 object-cover"
          style={{ transform: "rotate(90deg)" }}
        />
      </div>
      
      <div className="mt-3">
        <h2 className={`text-lg font-bold ${textColor}`}>{brand}</h2>
        <p className={`text-sm mt-1 ${textColorLocation}`}>{location}</p>
        <p className={`text-base ${textColorDateTime}`}>{dateTime}</p>
      </div>
      <div className="mt-3 flex justify-end">
        <div
          className="w-6 h-6 rounded-full"
          style={{ backgroundColor: waterQualityColor }}
        ></div>
      </div>
    </div>
  );
};

export default Card;