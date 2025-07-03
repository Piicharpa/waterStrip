import { useState, useEffect } from "react";
import rawGeoJson from "./thailand-provinces.json";
import { getProvinceFromLatLng } from "../Convertor/ProvinceAnalyzer";
import { useStripData } from "../../contexts/StripDataContext.tsx"; // Adjust path if needed
import { dmsToDecimal } from "../../utils/dmsToDecimal.ts";
import { DateAnalyzer } from "../Convertor/DateAnalyzer";

interface GeoJsonFeature {
  properties: { [key: string]: any };
}

interface GeoJson {
  features: GeoJsonFeature[];
}

interface ProvinceStatus {
  province: string;
  status: "Good" | "Bad";
}

const geoJson = rawGeoJson as GeoJson;

const ProvinceStatus = () => {
  const { stripData } = useStripData();
  const [provinceStatuses, setProvinceStatuses] = useState<ProvinceStatus[]>([]);

  useEffect(() => {
    if (!stripData || stripData.length === 0) {
      setProvinceStatuses([]);
      return;
    }

    // Filter strips for this month using your DateAnalyzer
    const stripsThisMonth = DateAnalyzer(stripData);

    // Map: province => { Good: count, Bad: count }
    const provinceStatusCount = new Map<string, { Good: number; Bad: number }>();

    stripsThisMonth.forEach((strip) => {
      const lat = dmsToDecimal(strip.s_latitude || "");
      const lng = dmsToDecimal(strip.s_longitude || "");
      if (isNaN(lat) || isNaN(lng)) return;

      const province = getProvinceFromLatLng(lat, lng);
      if (!province) return;

      const status = strip.s_qualitycolor === "#00c951" ? "Good" : "Bad";

      if (!provinceStatusCount.has(province)) {
        provinceStatusCount.set(province, { Good: 0, Bad: 0 });
      }

      const counts = provinceStatusCount.get(province)!;
      counts[status] = (counts[status] || 0) + 1;
    });

    const provincesAll = geoJson.features.map(
      (feat) => (feat.properties as any).NAME_1 as string
    );

    const statuses = provincesAll
      .map((prov) => {
        const counts = provinceStatusCount.get(prov);
        if (!counts) return null;
        const status = counts.Good >= counts.Bad ? "Good" : "Bad";
        return {
          province: prov,
          status,
        };
      })
      .filter((s): s is ProvinceStatus => s !== null);

    setProvinceStatuses(statuses);
    console.log("Province statuses:", statuses);
  }, [stripData]);

  const statusColors = {
    Good: "text-green-600",
    Bad: "text-red-600",
    // Unknown: "text-gray-400",
  };

  return (
    <div className="fixed top-20 right-5 max-h-[80vh] w-80 overflow-auto bg-white p-4 rounded-lg shadow-lg z-50">
      <h2 className="text-xl font-bold mb-4">Province Water ph Quality Status (This Month)</h2>
      <ul className="space-y-2">
        {provinceStatuses.map(({ province, status }) => (
          <li key={province} className={`font-semibold ${statusColors[status]}`}>
            {province}: {status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProvinceStatus;
