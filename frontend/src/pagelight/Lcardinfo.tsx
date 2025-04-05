import React, { useEffect, useState, useRef } from "react";
// import PicScale from "../component/picscale";
import Scale from "../component/subscale";
import { useNavigate } from "react-router-dom";

const getQualityColor = (quality: number): string => {
  if (quality >= 0 && quality <= 24) return "#e74c3c";
  if (quality >= 25 && quality <= 49) return "#FF8A24";
  if (quality >= 50 && quality <= 74) return "#FFE521";
  return "#7ECF1B";
};

const ITEMS_PER_PAGE = 8;

const Lcardinfo: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const [stripBrand, setStripBrand] = useState<string>("");
  const [analyzeDate, setAnalyzeDate] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const waterQuality = 13;
  useEffect(() => {
    // Retrieve values from localStorage
    const storedImage = localStorage.getItem("uploadedImage");
    const storedBrand = localStorage.getItem("stripBrand");
    const storedDate = localStorage.getItem("analyzeDate");
    const storedLocation = localStorage.getItem("location");

    if (storedImage) setUploadedImage(storedImage);
    if (storedBrand) setStripBrand(storedBrand);
    if (storedLocation) setLocation(storedLocation);

    // Format the date if stored
    if (storedDate) {
      const date = new Date(storedDate);
      const formattedDate = date
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .replace(",", ".");
      setAnalyzeDate(formattedDate);
    }

    // Optional: Clear localStorage after retrieving
    localStorage.removeItem("uploadedImage");
    localStorage.removeItem("stripBrand");
    localStorage.removeItem("analyzeDate");
    localStorage.removeItem("location");
  }, []);

  // Add this function to handle dot and scroll interaction
  const handleDotClick = (index: number) => {
    setCurrentPage(index);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: index * 480, // Width of each page
        behavior: "smooth",
      });
    }
  };

  // Add this useEffect to sync scroll position with dots
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

  const scaleColorSets = [
    {
      colors: [
        "#F7DC6F",
        "#F0B827",
        "#FF9B1E",
        "#F9530A",
        "#F8340B",
        "#E51907",
      ],
      values: [6.2, 6.8, 7.2, 7.6, 7.8, 8.4],
    },
    {
      colors: [
        "#F3D866",
        "#BFB468",
        "#959F63",
        "#759765",
        "#298584",
        "#58868D",
      ],
      values: [0, 40, 80, 120, 180, 240],
    },
    {
      colors: [
        "#FFFFFF",
        "#EFF3F6",
        "#C9E9EA",
        "#A3D7DC",
        "#5BC5DA",
        "#06ADD2",
        "#05A9D1",
      ],
      values: [0, 0.5, 1, 3, 5, 10, 20],
    },
    {
      colors: [
        "#FFFFFF",
        "#E6A0E3",
        "#E46BB1",
        "#D53793",
        "#AB2AA1",
        "#771F71",
      ],
      values: [0, 0.5, 1, 3, 5, 10],
    },
    {
      colors: [
        "#FFFFFF",
        "#FEF5F6",
        "#FEE3EC",
        "#F7BFD9",
        "#DD82AC",
        "#BC4E88",
        "#BB4079",
      ],
      values: [0, 10, 25, 50, 100, 250, 500],
    },
    {
      colors: [
        "#FDF6F6",
        "#FFEFF2",
        "#FBE5EC",
        "#F8C7DF",
        "#E79CBA",
        "#DE739B",
        "#BE4D7F",
      ],
      values: [0, 1, 5, 10, 20, 40, 80],
    },
    {
      colors: [
        "#FCE5EA",
        "#DFD0E8",
        "#C6A4CE",
        "#BF89C0",
        "#915FA4",
        "#674599",
        "#3D1E88",
      ],
      values: [0, 0.002, 0.005, 0.01, 0.02, 0.04, 0.08],
    },
    {
      colors: [
        "#FBC971",
        "#FBC26D",
        "#F5A66A",
        "#E2805F",
        "#DE6A78",
        "#BA3466",
      ],
      values: [0, 20, 50, 100, 200, 500],
    },
    {
      colors: [
        "#FFFFFF",
        "#FDEBE6",
        "#FADACA",
        "#F8C4A6",
        "#F3A47A",
        "#F1844C",
        "#F5683C",
        "#EC5401",
      ],
      values: [0, 5, 10, 25, 50, 100, 250, 500],
    },
    {
      colors: [
        "#F9EFC7",
        "#E9E8C2",
        "#A5D0BF",
        "#6CA9B0",
        "#2177BC",
        "#02489B",
      ],
      values: [0, 1, 10, 30, 100, 300],
    },
    {
      colors: ["#F4835E", "#EE856F", "#F49B80", "#F8AF6A", "#F9BF5A"],
      values: [0, 25, 50, 100, 200],
    },
    {
      colors: ["#FFFFFF", "#BBE1E4", "#8BC8CA", "#0584B2", "#3A829E"],
      values: [0, 1, 5, 10, 20],
    },
    {
      colors: [
        "#F3D8E8",
        "#E6ABD1",
        "#D88AB9",
        "#C265A6",
        "#B74C97",
        "#BA3466",
      ],
      values: [2, 5, 10, 30, 50, 100],
    },
    {
      colors: [
        "#86A650",
        "#8B9B38",
        "#A09532",
        "#BC9402",
        "#C38602",
        "#C3720E",
      ],
      values: [2, 25, 50, 125, 250, 425],
    },
    {
      colors: [
        "#FFD475",
        "#FBC173",
        "#F8B882",
        "#F49B99",
        "#D66588",
        "#D66588",
      ],
      values: [0, 20, 40, 80, 120, 180],
    },
    {
      colors: ["#FFEAD8", "#FBCFC5", "#F8BDBA", "#EE87B5", "#EE87B5"],
      values: [0, 30 - 50, 100, 150, 240],
    },
  ];

  const measurements = [
    { name: "pH", concentration: "30S", value: 7.5, colorSetIndex: 0 },
    {
      name: "Total alkalinity",
      concentration: "30S mg/L",
      value: 55,
      colorSetIndex: 1,
    },
    {
      name: "Free Chlorine",
      concentration: "30S mg/L",
      value: 12,
      colorSetIndex: 2,
    },
    {
      name: "Total Chlorine",
      concentration: "30S mg/L",
      value: 0.2,
      colorSetIndex: 3,
    },
    {
      name: "Nitrate",
      concentration: "30S mg/L",
      value: 332,
      colorSetIndex: 4,
    },
    { name: "Nitrite", concentration: "30S mg/L", value: 4, colorSetIndex: 5 },
    {
      name: "Mercury",
      concentration: "30S mg/L",
      value: 0.0015,
      colorSetIndex: 6,
    },
    { name: "Lead", concentration: "30S mg/L", value: 28, colorSetIndex: 7 },
    { name: "Iron", concentration: "30S mg/L", value: 6, colorSetIndex: 8 },
    { name: "Coper", concentration: "30S mg/L", value: 21, colorSetIndex: 9 },
    {
      name: "Fluoride",
      concentration: "30S mg/L",
      value: 124,
      colorSetIndex: 10,
    },
    { name: "Bromine", concentration: "30S mg/L", value: 9, colorSetIndex: 11 },
    {
      name: "Chromium/Cr",
      concentration: "30S mg/L",
      value: 27,
      colorSetIndex: 12,
    },
    {
      name: "Hardness",
      concentration: "30S mg/L",
      value: 136,
      colorSetIndex: 13,
    },
    {
      name: "Carbonate Root",
      concentration: "30S mg/L",
      value: 51,
      colorSetIndex: 14,
    },
    {
      name: "Cyanuric acid",
      concentration: "30S mg/L",
      value: 192,
      colorSetIndex: 15,
    },
  ];
  const totalPages = Math.ceil(measurements.length / ITEMS_PER_PAGE);
  const paginatedMeasurements = Array.from({ length: totalPages }, (_, i) =>
    measurements.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE)
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);
  const handleSave = () => {
    setIsOpen(false); // ปิด Popup ทันที

    // สมมติว่ามีการบันทึกข้อมูล สามารถเพิ่ม API หรือ logic อื่นๆ ตรงนี้ได้
    console.log(`บันทึกเป็นแบบ ${isPrivate ? "ส่วนตัว" : "สาธารณะ"}`);
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
            <p className="text-gray-400 ml-45  text-sm">{analyzeDate}</p>
            <p className="absolute  top-16.5 right-50  text-black text-base hover:underline cursor-pointer">
              {location}
            </p>

            {/* Water Quality Indicator - Moved to left side */}
            <div className="flex items-center space-x-3 mt-4 ml-45">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: getQualityColor(waterQuality) }}
              ></div>
              <div className="flex flex-col">
                <span className="text-black text-lg font-semibold">
                  Water Quality:
                </span>
                <span className="text-gray-900 font-bold">{waterQuality}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Image, Measurements, and Color Scale Section */}
        <div className="flex flex-grow">
          {/* Container ครอบ Scroll Frame + Pagination */}
          <div className="flex flex-col items-center">
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
                  {page.map((measurement, index) => (
                    <Scale
                      key={index}
                      name={measurement.name}
                      concentration={measurement.concentration}
                      value={measurement.value}
                      scaleColors={
                        scaleColorSets[measurement.colorSetIndex].colors
                      }
                      scaleValues={
                        scaleColorSets[measurement.colorSetIndex].values
                      }
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Pagination Dots */}
            <div className="flex space-x-2  ml-30">
              {paginatedMeasurements.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full cursor-pointer  ${
                    index === currentPage ? "bg-black " : "bg-gray-300"
                  }`}
                  onClick={() => handleDotClick(index)}
                />
              ))}
            </div>
          </div>

          {/* Image and Color Scale Section */}
          <div className="flex space-x-6 ml-auto mr-35 -mt-13 h-126">
            {/* Gray box for uploaded image */}
            <div className="h-80 w-80 bg-gray-200 rounded-lg overflow-hidden ml-auto mr-15">
              <img
                src={uploadedImage}
                alt="Uploaded water test strip"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Color bar from picscale.tsx */}
            {/* <div className="flex flex-col items-center -mt-8">
              <h2 className="text-xl font-bold mb-2">Scale</h2>
              <PicScale scaleColors={picScaleColors} />
            </div> */}
          </div>
        </div>

        <div className="absolute -right-15 bg-transparent top-116 transform -translate-x-1/2 w-130   break-words whitespace-pre-wrap">
          เพิ่มข้อความที่นี่ ลองพิมพ์ข้อความยาว ๆ เพื่อดูว่ามันขึ้นบรรทัดใหม่เมื่อเกินขอบกล่อง เพื่อดูว่ามันขึ้นบรรทัดใหม่เมื่อเกินขอบกล่อง เพื่อดูว่ามันขึ้นบรรทัดใหม่เมื่อเกินขอบกล่อง เพื่อดูว่ามันขึ้นบรรทัดใหม่เมื่อเกินขอบกล่อง เพื่อดูว่ามันขึ้นบรรทัดใหม่เมื่อเกินขอบกล่อง เพื่อดูว่ามันขึ้นบรรทัดใหม่เมื่อเกินขอบกล่อง เพื่อดูว่ามันขึ้นบรรทัดใหม่เมื่อเกินขอบกล่อง เพิ่มข้อความที่นี่ ลองพิมพ์ข้อความยาว ๆ เพื่อดูว่ามันขึ้นบรรทัดใหม่เมื่อเกินขอบกล่อง เพิ่มข้อความที่นี่ ลองพิมพ์ข้อความยาว ๆ เพื่อดูว่ามันขึ้นบรรทัดใหม่เมื่อเกินขอบกล่อง เพิ่มข้อความที่นี่ ลองพิมพ์ข้อความยาว ๆ เพื่อดูว่ามันขึ้นบรรทัดใหม่เมื่อเกินขอบกล่อง 
        </div>

        {/* Detail Button - Moved to bottom right */}
        <div className="fixed bottom-12 right-50">
        <button
          className="bg-black text-white px-4 py-2 rounded-lg border-2 border-transparent hover:border-black hover:text-black hover:bg-white"
          onClick={() => setIsOpen(true)}
        >
          save
        </button>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}>
          <div className="bg-white p-6 rounded-lg  w-96">
            <h2 className="text-lg font-semibold mb-4">บันทึกเป็นแบบไหน?</h2>

            {/* ตัวเลือก Private/Public */}
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded-full border border-black checked:bg-black"
                  checked={isPrivate}
                  onChange={() => setIsPrivate(true)}
                />
                <span>ส่วนตัว</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded-sm border border-gray-400 checked:bg-blue-500"
                  checked={!isPrivate}
                  onChange={() => setIsPrivate(false)}
                />
                <span>สาธารณะ</span>
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
                className="px-4 py-2 rounded-lg bg-black text-white hover:bg-black"
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