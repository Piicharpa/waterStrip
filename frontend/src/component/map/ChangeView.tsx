import { useMap } from "react-leaflet";
import { useEffect } from "react";

interface ChangeViewProps {
  center: [number, number]; // เปลี่ยนจาก `Location` เป็นแบบ array
}

const ChangeView = ({ center }: ChangeViewProps) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center);
  }, [center, map]);

  return null;
};

export default ChangeView;
