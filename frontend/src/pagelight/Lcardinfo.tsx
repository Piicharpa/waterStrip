import React, { useEffect, useState, useRef } from "react";
// import PicScale from "../component/picscale";
import Scale from "../component/subscale";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { Link } from "react-router-dom";
// import axios from "axios";

interface ColorScaleSet {
  colors: string[];
  values: number[];
}

interface Measurement {
  name: string;
  unit: string;
  value: number;
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
        const patchResponse = await fetch(
          `/api/strips/quality/${stripId}`,
          {
            method: "PATCH",
          }
        );
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
          }));
        setMeasurements(measurements);
      } catch (error) {
        console.error("Error fetching strip data:", error);
      }
    };

    fetchData();
  }, [stripId]);

  // useEffect(() => {
  //   const fetchPhPrediction = async () => {
  //     if (!stripId) return; // Check if stripId is available

  //     try {
  //       const response = await fetch(
  //         `/api/strips/predict/${stripId}`
  //       );
  //       if (!response.ok) throw new Error("Failed to fetch prediction data");
  //       const data = await response.json();
  //       setPrediction(data.prediction);
  //       console.log("Prediction Data:", data); // Log the prediction data

  //       // Post the prediction data to the server
  //       const postResponse = await fetch(
  //         `/api/strips_parameter`,
  //         {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify({
  //             s_id: stripId,
  //             p_id: 1, // pH p_id is 1
  //             sp_value: data.prediction,
  //           }),
  //         }
  //       );
  //       if (!postResponse.ok) throw new Error("Failed to post prediction data");
  //       const postResult = await postResponse.json();
  //       console.log("Prediction data posted successfully:", postResult);
  //     } catch (error) {
  //       console.error("Error fetching prediction data:", error);
  //     } finally {
  //       setLoading(false); // Set loading to false after fetching
  //     }
  //   };

  //   fetchPhPrediction();
  // }, [stripId]);

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
          const postResponse = await fetch(
            `/api/strip-status`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                u_id,
                s_id: stripId,
                status: "private",
              }),
            }
          );

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
      <div className="flex flex-col flex-grow overflow-hidden ">
        <nav className="flex items-center justify-between  px-6 py-3 gap-8 z-50">
          {/* Logo Section */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
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
                            className="text-gray-800 text-base  hover:underline px-2 py-2 rounded-lg transition-colors"
                          >
                            Map
                          </Link>
          </div>
        </nav>

        {/* Top section with Strip Brand and Date */}
        <div className="flex justify-between items-center p-4">
          <div>
            <h2 className="text-3xl font-bold text-black mt-4 ml-45">
              {stripBrand}
            </h2>
            <p className="text-gray-400 ml-45 mt-2 text-sm">
              {formatDate(analyzeDate)}
            </p>
            <p
              className="absolute  top-18.5 right-50  text-black text-base hover:underline cursor-pointer"
              onClick={() => navigate("/pantee")}
            >
              {location}
            </p>

            {/* Water Quality Indicator - Moved to left side */}
            <div className="flex items-center space-x-3 mt-6 ml-45">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: qualityColor }}
              ></div>
              <div className="flex flex-col">
                <span className="text-black text-lg font-semibold">
                  Water Quality:
                </span>
                <span className="text-gray-900 font-bold"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Image, Measurements, and Color Scale Section */}
        <div className="flex flex-grow">
          {/* Container ครอบ Scroll Frame + Pagination */}
          <div className="flex flex-col items-center mt-4">
            {/* Horizontal Scrollable Frame */}
            <div
              ref={scrollContainerRef}
              className="ml-50 w-120  flex overflow-x-auto snap-x snap-mandatory scroll-container scrollbar-hide -mt-1"
              style={{
                scrollbarWidth: "none", // For Firefox
                msOverflowStyle: "none", // For Internet Explorer and Edge
                WebkitOverflowScrolling: "touch", // Smooth scrolling for iOS
              }}
            >
              {paginatedMeasurements.map((page, index) => (
                <div
                  key={index}
                  className="w-120 h-120 bg-transparent mt-3 flex-shrink-0 snap-cente "
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
                        value={measurement.value}
                        scaleColors={scaleSet.colors}
                        scaleValues={scaleSet.values}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Pagination Dots */}
            <div className="flex space-x-2 mt-4 ml-30">
              {paginatedMeasurements.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full cursor-pointer  ${
                    index === currentPage ? "bg-black " : "bg-gray-300"
                  }`}
                  onClick={() => handleDotClick(index)}
                />
              ))}
            </div>
          </div>

          {/* Image and Color Scale Section */}
          <div className="flex space-x-6 ml-auto mr-35 -mt-18 h-126">
            {/* Gray box for uploaded image */}
            <div className="h-30 w-150 bg-gray-200 rounded-lg overflow-hidden ml-auto mr-15">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Uploaded water test strip"
                  className="w-full h-full object-contain bg-gray-200"
                />
              ) : (
                <p>กำลังโหลดรูปภาพ..</p>
              )}
            </div>
          </div>
        </div>

        <div className="scroll-container absolute -right-100 bg-transparent top-130 transform -translate-x-1/2 w-145 h-30 overflow-y-auto break-words whitespace-pre-wrap">
          {qualityMessage}
        </div>

        <div className="fixed bottom-12 right-45 flex items-center space-x-4">
          <span className="text-gray-700">
            {isPrivate ? "ส่วนตัว" : "สาธารณะ"}
          </span>

          <button
            onClick={handleToggle}
            className={`relative inline-flex items-center h-7 rounded-full w-11 transition-colors duration-300 ${
              isPrivate ? "bg-gray-400" : "bg-black"
            }`}
          >
            <span
              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
                isPrivate ? "translate-x-1" : "translate-x-6"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lcardinfo;