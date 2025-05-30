import React, { useEffect, useState, useRef } from "react";
// import PicScale from "../component/picscale";
import Scale from "../component/subscale";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { Link } from "react-router-dom";
import { FaLockOpen, FaLock } from "react-icons/fa";
// import axios from "axios";

interface ColorScaleSet {
  colors: string[];
  values: number[];
}

interface Measurement {
  name: string;
  unit: string;
  value: number;
  normalRange?: [number, number];
}

const ITEMS_PER_PAGE = 8;

const Lcardinfo: React.FC = () => {
  const { stripId } = useParams<{ stripId: string }>();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [qualityMessage, setQualityMessage] = useState<string>("");
  const [qualityColor, setQualityColor] = useState<string>("#000000");
  const [stripBrand, setStripBrand] = useState<string>("");
  const [analyzeDate, setAnalyzeDate] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [u_id, setUid] = useState("");
  const [scaleColorSets, setScaleColorSets] = useState<ColorScaleSet[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  // const [prediction, setPrediction] = useState<string>("");
  // const [loading, setLoading] = useState<boolean>(false);
  // const [error, setError] = useState<string>("");

  const formatDate = (isoString?: string) => {
    if (!isoString) return "N/A"; // ถ้าไม่มีค่าวันที่ ให้แสดง "N/A"
    return format(new Date(isoString), "d MMM. yyyy");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userId = user.uid;
        setUid(userId);
      } else {
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // PATCH เพื่ออัปเดตค่าคุณภาพก่อน
        const patchResponse = await fetch(`/api/strips/quality/${stripId}`, {
          method: "PATCH",
        });
        if (!patchResponse.ok) throw new Error("Failed to PATCH data");

        console.log("PATCH Request Successful"); // Log here to see if PATCH was successful

        // จากนั้นค่อย GET ข้อมูลใหม่
        const response = await fetch(`/api/strips/${stripId}`);
        if (!response.ok) throw new Error("Failed to fetch data");

        const data = await response.json();

        console.log("Fetched Data:", data); // Log the fetched data to see if updated correctly

        setStripBrand(data.b_name);
        setAnalyzeDate(data.s_date);
        setImageUrl(data.s_url);
        setLocation(data.s_latitude + "," + data.s_longitude);
        setQualityColor(data.s_qualitycolor);
        setQualityMessage(data.s_quality);

        const colorScales = data.parameters
          .filter((param: any) => param.colors && param.values)
          .map((param: any) => ({
            colors: param.colors,
            values: param.values,
          }));
        setScaleColorSets(colorScales);

        const measurements = data.parameters
          .filter(
            (param: any) => param.p_name && param.p_unit && param.sp_value
          )
          .map((param: any) => ({
            name: param.p_name,
            unit: param.p_unit,
            value: param.sp_value,
            normalRange: [param.p_min, param.p_max], // ใช้ค่าที่มาจาก backend หรือ default
          }));
        setMeasurements(measurements);
      } catch (error) {
        console.error("Error fetching strip data:", error);
      }
    };

    fetchData();
  }, [stripId]);

  const handleDotClick = (index: number) => {
    setCurrentPage(index);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: index * 480,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const pageWidth = 480;
        const newPage = Math.round(scrollLeft / pageWidth);
        setCurrentPage(newPage);
      }
    };

    const scrollContainer = scrollContainerRef.current;
    scrollContainer?.addEventListener("scroll", handleScroll);

    return () => {
      scrollContainer?.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const totalPages = Math.ceil(measurements.length / ITEMS_PER_PAGE);
  const paginatedMeasurements = Array.from({ length: totalPages }, (_, i) =>
    measurements.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE)
  );

  useEffect(() => {
    if (u_id && stripId) {
      const checkAndPostInitialStatus = async () => {
        try {
          // ลอง GET status ก่อน
          const getResponse = await fetch(
            `/api/strip-status/${u_id}/${stripId}`
          );
          const getResult = await getResponse.json();

          if (getResponse.ok && getResult.status) {
            console.log("Status already exists:", getResult.status);
            setIsPrivate(getResult.status === "private"); // ตั้งค่าตามสถานะที่ดึงมา
            return; // ไม่ต้อง post ซ้ำ
          }

          // ถ้ายังไม่มี status นี้ → POST เพื่อสร้างใหม่
          const postResponse = await fetch(`/api/strip-status`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              u_id,
              s_id: stripId,
              status: "private",
            }),
          });

          const postResult = await postResponse.json();

          if (postResponse.ok) {
            console.log("Initial private status saved:", postResult);
            setIsPrivate(true); // ตั้งค่าเริ่มต้นเป็น private
          } else {
            console.error("Initial save failed:", postResult.error);
          }
        } catch (error) {
          console.error("Unexpected error checking/setting status:", error);
        }
      };

      checkAndPostInitialStatus();
    }
  }, [u_id, stripId]);

  const [isPrivate, setIsPrivate] = useState(true);

  const handleToggle = async () => {
    const newStatus = !isPrivate;
    setIsPrivate(newStatus);

    try {
      const response = await fetch(`/api/strip-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          u_id,
          s_id: stripId,
          status: newStatus ? "private" : "public",
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Status updated successfully:", result);
      } else {
        console.error("Status update failed:", result.error);
      }
    } catch (error) {
      console.error("Unexpected error on patch:", error);
    }
  };

  return (
    <div className="fixed flex flex-col h-screen w-screen overflow-hidden">
      <div className="flex flex-col flex-grow overflow-hidden">
        <nav className="flex items-center justify-between px-6 py-3 gap-8 z-50">
          {/* Logo Section */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 ">
              <img src="/image/logo2.png" alt="Logo" className="h-10" />
              <span className="text-xl font-bold text-gray-800">AQUAlity</span>
            </Link>

            {/* Menu Links */}
            <Link
              to="/home"
              className="text-gray-800 text-base hover:underline px-4 py-2 rounded-lg transition-colors"
            >
              Home
            </Link>

            {/*Map Link */}
            <Link
              to="/pantee"
              className="text-gray-800 text-base hover:underline px-2 py-2 rounded-lg transition-colors"
            >
              Map
            </Link>
          </div>
        </nav>

        {/* Main Content - Split into Left and Right */}
        <div className="flex flex-grow p-4 gap-8 mt-8">
          {/* Left Side */}
          <div className="flex-1 flex flex-col space-y-6 ml-45">
            {/* Water Quality Indicator - บนสุด */}
            <div className="flex items-center space-x-3">
              <div
                className="w-13 h-13 rounded-full flex items-center justify-center"
                style={{ backgroundColor: qualityColor }}
              ></div>
              <div className="flex flex-col">
                <h1 className="text-black text-3xl font-semibold -mt-2">
                  Water Quality
                </h1>
                <h6 className="text-black">{qualityMessage}</h6>
              </div>
            </div>

            {/* Image - ย้ายมาอยู่ฝั่งซ้าย หลัง Water Quality */}
            <div className="relative h-15 w-full bg-transparent overflow-hidden flex items-center justify-center mt-4">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Uploaded water test strip"
                  className="absolute h-65 w-auto transform rotate-90 object-contain"
                />
              ) : (
                <p className="text-gray-500">กำลังโหลดรูปภาพ..</p>
              )}
            </div>

            <div className="w-60">
              <h1 className="text-sm text-gray-400 mt-6">Location</h1>
              <p className="text-black text-base">
                <span
                  className="hover:underline cursor-pointer"
                  onClick={() => navigate("/pantee")}
                >
                  {location}
                </span>
              </p>
            </div>

            <div>
              <h1 className="text-sm text-gray-400">Date</h1>
              <h2 className="text-base  text-black">
                {formatDate(analyzeDate)}
              </h2>
            </div>

            {/* Brand - ถัดลงมา */}
            <div>
              <h1 className="text-sm text-gray-400">Brand</h1>
              <h2 className="text-base  text-black">{stripBrand}</h2>
            </div>
          </div>

          {/* Right Side */}
          {/* Toggle Button */}
          <div className="fixed top-26 right-45 flex items-center space-x-4">
            <span className="text-black">
              {isPrivate ? "Private" : "Public"}
            </span>

            <button
              onClick={handleToggle}
              className={`relative inline-flex items-center h-7 rounded-full w-12 transition-colors duration-300 ${
                isPrivate ? "bg-gray-400" : "bg-black"
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-5 h-5 transform bg-white rounded-full transition-transform duration-300 ${
                  isPrivate ? "translate-x-1.5" : "translate-x-5.5"
                }`}
              >
                {isPrivate ? (
                  <FaLock className="text-gray-400 text-sm" />
                ) : (
                  <FaLockOpen className="text-black text-sm" />
                )}
              </span>
            </button>
          </div>

          <div className="mr-41 bg-transparent w-2xl items-start">
            {/* Horizontal Scrollable Frame - ย้ายขึ้นมาด้านบน */}
            <div className="mt-14">
              {/* Scrollable Container */}
              <div
                ref={scrollContainerRef}
                className="w-full max-w-2xl bg-transparent flex overflow-x-auto snap-x snap-mandatory scroll-container scrollbar-hide"
                style={{
                  scrollbarWidth: "none", // For Firefox
                  msOverflowStyle: "none", // For Internet Explorer and Edge
                  WebkitOverflowScrolling: "touch", // Smooth scrolling for iOS
                }}
              >
                {paginatedMeasurements.map((page, pageIndex) => (
                  <div
                    key={pageIndex}
                    className="bg-transparent p-3 flex-shrink-0 snap-center"
                  >
                    {page.map((measurement, index) => {
                      const scaleSetIndex = index % scaleColorSets.length;
                      const scaleSet = scaleColorSets[scaleSetIndex] ?? {
                        colors: [],
                        values: [],
                      };

                      return (
                        <Scale
                          key={index}
                          name={measurement.name}
                          concentration={measurement.unit}
                          value={parseFloat(
                            Number(measurement.value).toFixed(2)
                          )}
                          scaleColors={scaleSet.colors}
                          scaleValues={scaleSet.values}
                          normalRange={measurement.normalRange} // <- เพิ่มตรงนี้!
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Pagination Dots */}
              <div className="flex flex-col items-center space-x-2 mt-4">
                {paginatedMeasurements.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full cursor-pointer ${
                      index === currentPage ? "bg-black" : "bg-gray-300"
                    }`}
                    onClick={() => handleDotClick(index)}
                  />
                ))}
              </div>
            </div>

            {/* Quality Message - ย้ายมาอยู่ฝั่งขวาล่าง หลัง Horizontal Scrollable Frame */}
            {/* <div className="bg-transparent mt-8 rounded-lg max-h-64 overflow-y-auto">
              <div className="text-base text-black whitespace-pre-wrap break-words">
                {qualityMessage}
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lcardinfo;
