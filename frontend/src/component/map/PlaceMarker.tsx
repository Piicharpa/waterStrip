// components/map/PlaceMarker.tsx
import { FC } from "react";
import { CircleMarker } from "react-leaflet";
import L from "leaflet";

export interface Location {
  lat: number;
  lng: number;
}

export interface Place {
  id: number;
  title?: string;
  date?: string;
  location: Location;
  color: string;
  quality?: string;
  brand?: string;
}

const PlaceMarker: FC<{
  place: Place;
  refCallback: (ref: L.CircleMarker | null) => void;
}> = ({ place, refCallback }) => (
  <CircleMarker
    center={[place.location.lat, place.location.lng]}
    radius={7}
    fillColor={place.color}
    fillOpacity={1}
    stroke={false}
    ref={refCallback}
  />
);

export default PlaceMarker;
