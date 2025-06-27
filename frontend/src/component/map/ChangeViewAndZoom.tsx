import { useMap } from "react-leaflet";
import { useEffect } from "react";

const ChangeViewAndZoom = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
};

export default ChangeViewAndZoom;