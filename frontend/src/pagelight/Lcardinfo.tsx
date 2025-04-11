import React, { useEffect, useState, useRef } from "react";
// import PicScale from "../component/picscale";
import Scale from "../component/subscale";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";




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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
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

  const formatDate = (isoString?: string) => {
    if (!isoString) return "N/A"; // ถ้าไม่มีค่าวันที่ ให้แสดง "N/A"
    return format(new Date(isoString), "d MMM. yyyy");
  };


  // const getQualityMessage = (quality: string) => {
  //   switch (quality.trim().toLowerCase()) {
  //     case "very good":
  //       return "✨ น้ำดีมากจ้า!";
  //     case "good":
  //       return "💧 น้ำคุณภาพดีนะ";
  //     case "moderate":
  //       return "😐 พอใช้ได้อยู่นะ";
  //     case "bad":
  //       return "⚠️ น้ำไม่ค่อยโอเคเลย";
  //     case "very bad":
  //       return "🚨 น้ำแย่มาก ระวัง!";
  //     default:
  //       return "ไม่พบข้อมูลคุณภาพน้ำ";
  //   }
  // };


  
  // const waterQuality = 13;


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
        // 1️⃣ PATCH เพื่ออัปเดตค่าคุณภาพก่อน
        const patchResponse = await fetch(`http://localhost:3003/strips/quality/${stripId}`, {
          method: "PATCH",
        });
        if (!patchResponse.ok) throw new Error("Failed to PATCH data");
  
        console.log("PATCH Request Successful");  // Log here to see if PATCH was successful
  
        // 2️⃣ จากนั้นค่อย GET ข้อมูลใหม่
        const response = await fetch(`http://localhost:3003/strips/${stripId}`);
        if (!response.ok) throw new Error("Failed to fetch data");
  
        const data = await response.json();

        console.log("Fetched Data:", data);  // Log the fetched data to see if updated correctly

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
          .filter((param: any) => param.p_name && param.p_unit && param.sp_value)
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

  // const picScaleColors = [
  //   "#BE4C19",
  //   "#AEA360",
  //   "#0CA2C3",
  //   "#FAE8F9",
  //   "#FBE5EC",
  //   "#BF89C0",
  //   "#CC95CF",
  //   "#ED8D69",
  //   "#FFD2B2",
  //   "#77B3BC",
  //   "#FFBC76",
  //   "#0B90C0",
  //   "#D16DB1",
  //   "#C9A10B",
  //   "#FFA9A6",
  //   "#FE91C6",
  // ];


  const totalPages = Math.ceil(measurements.length / ITEMS_PER_PAGE);
  const paginatedMeasurements = Array.from({ length: totalPages }, (_, i) =>
    measurements.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE)
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);
  const handleSave = async () => {
    const status = isPrivate ? "private" : "public";

    try {
      const response = await fetch(
        `http://localhost:3003/strips/strip-status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            u_id,
            s_id: stripId,
            status,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log("Saved successfully:", result);
        setIsOpen(false); // ปิด popup หลังบันทึกสำเร็จ
      } else {
        console.error("Save failed:", result.error);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  return (
    <div className="fixed flex flex-col h-screen w-screen overflow-hidden">
      <div className="flex flex-col flex-grow overflow-hidden ">
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
                {/* <span className="text-gray-900 font-bold">{waterQuality}%</span> */}
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
            <div className="h-80 w-80 bg-gray-200 rounded-lg overflow-hidden ml-auto mr-15">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Uploaded water test strip"
                  className="w-full h-full object-cover"
                />
              ) : (
                <p>กำลังโหลดรูปภาพ..</p>
              )}
            </div>

            {/* Color bar from picscale.tsx */}
            {/* <div className="flex flex-col items-center -mt-8">
              <h2 className="text-xl font-bold mb-2">Scale</h2>
              <PicScale scaleColors={picScaleColors} />
            </div> */}
          </div>


        </div>

        <div className="scroll-container absolute -right-23 bg-transparent top-116 transform -translate-x-1/2 w-145 h-30 overflow-y-auto break-words whitespace-pre-wrap">
          {qualityMessage}
        </div>

        {/* Detail Button - Moved to bottom right */}
        <div className="fixed bottom-12 right-50">
          <button
            className="bg-black text-white px-4 py-2 rounded-lg border-2 border-transparent hover:bg-gray-700"
            onClick={() => setIsOpen(true)}
          >
            save
          </button>
        </div>

        {/* Modal */}
        {isOpen && (
          <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
          >
            <div className="bg-white p-6 rounded-lg  w-96">
              <h2 className="text-lg font-semibold mb-4">บันทึกเป็นแบบไหน?</h2>

              {/* ตัวเลือก Private/Public */}
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isPrivate
                        ? "border-black bg-black"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {isPrivate && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span>ส่วนตัว</span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isPrivate}
                    onChange={() => setIsPrivate(true)}
                  />
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      !isPrivate
                        ? "border-black bg-black"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {!isPrivate && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span>สาธารณะ</span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={!isPrivate}
                    onChange={() => setIsPrivate(false)}
                  />
                </label>
              </div>

              {/* ปุ่มยืนยัน */}
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  className="px-4 py-2 rounded-lg border border-black hover:bg-gray-200"
                  onClick={() => setIsOpen(false)} // ปิด Popup เมื่อกด "ยกเลิก"
                >
                  ยกเลิก
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-700"
                  onClick={handleSave} // กดบันทึกแล้วปิด Popup ทันที
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lcardinfo;
