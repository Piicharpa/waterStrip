import { useState, useEffect } from "react";
import rawGeoJson from "./thailand-provinces.json";
import { getProvinceFromLatLng } from "../Convertor/ProvinceAnalyzer";
import { useStripData } from "../../contexts/StripDataContext.tsx";
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
  const [userProvince, setUserProvince] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);

  // ฟังก์ชันหาตำแหน่งผู้ใช้
  const getUserLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const province = getProvinceFromLatLng(latitude, longitude);
        setUserProvince(province);
        setLocationPermission(true);
        console.log("User location:", { latitude, longitude, province });
      },
      (error) => {
        console.log("Error getting location:", error);
        setLocationPermission(false);
        setUserProvince(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    let cleanupFn: (() => void) | undefined;

    const setup = async () => {
      if (!navigator.geolocation) {
        console.log("Geolocation is not supported by this browser.");
        setLocationPermission(false);
        return;
      }

      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: "geolocation" });

          const handlePermissionChange = () => {
            if (permission.state === "granted") {
              getUserLocation();
            } else {
              setLocationPermission(false);
              setUserProvince(null);
            }
          };

          // เรียกทันทีสำหรับสถานะเริ่มต้น
          handlePermissionChange();

          // ฟังการเปลี่ยนแปลง permission
          permission.addEventListener("change", handlePermissionChange);

          // เซ็ตฟังก์ชัน cleanup
          cleanupFn = () => {
            permission.removeEventListener("change", handlePermissionChange);
          };
        } catch (error) {
          console.log("Permission API not supported, falling back to direct geolocation");
          getUserLocation();
        }
      } else {
        getUserLocation();
      }
    };

    setup();

    // fallback ตรวจสอบสิทธิ์ทุก 2 วินาที
    const intervalId = setInterval(() => {
      if (navigator.permissions) {
        navigator.permissions.query({ name: "geolocation" }).then((permission) => {
          if (permission.state === "granted" && !locationPermission) {
            getUserLocation();
          } else if (permission.state !== "granted" && locationPermission) {
            setLocationPermission(false);
            setUserProvince(null);
          }
        });
      }
    }, 2000);

    return () => {
      if (typeof cleanupFn === "function") {
        cleanupFn();
      }
      clearInterval(intervalId);
    };
  }, [locationPermission]);

  useEffect(() => {
    if (!stripData || stripData.length === 0) {
      setProvinceStatuses([]);
      return;
    }

    const stripsThisMonth = DateAnalyzer(stripData);
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

  const getTitle = () => {
  if (locationPermission && userProvince) {
    return (
      <>
        pH Quality in {userProvince}{" "}
        <span className="text-sm font-normal text-black">(This Month)</span>
      </>
    );
  } else {
    return (
      <>
        pH Quality in Thailand{" "}
        <span className="text-sm font-normal text-black">(This Month)</span>
      </>
    );
  }
};

  const statusColors = {
    Good: "text-green-600",
    Bad: "text-red-600",
  };

  return (
  <div className="fixed top-17.5 right-5 max-h-[80vh] overflow-auto bg-white p-4 rounded-lg border border-gray-200 shadow-lg z-50 inline-block">
    <h2 className="text-lg font-semibold mb-3 whitespace-nowrap">{getTitle()}</h2>
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
