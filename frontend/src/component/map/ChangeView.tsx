import { useMap } from "react-leaflet";
import { useEffect } from "react";

interface ChangeViewProps {
  center: [number, number]; 
}

const ChangeView = ({ center }: ChangeViewProps) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center);
  }, [center, map]);

  return null;
};

export default ChangeView;
