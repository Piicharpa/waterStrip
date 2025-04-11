import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../component/card";
import { BiArrowToLeft } from "react-icons/bi";
import { MdKeyboardArrowLeft, MdOutlineChevronRight } from "react-icons/md";
import axios from "axios"; // Import axios for API requests

const Lhome: React.FC = () => {
  const [username, setUsername] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [scrollIndex, setScrollIndex] = useState(0);
  const [zoomedCardIndex, setZoomedCardIndex] = useState<number | null>(null);
  const [cards, setCards] = useState<any[]>([]); // Store API data
  const navigate = useNavigate();

  // Fetch data from API
  useEffect(() => {
    // ดึงข้อมูล userId จาก sessionStorage ก่อน
    const storedUserId = sessionStorage.getItem("userId");
    // console.log("Stored userId:", storedUserId);
    // ตรวจสอบว่า storedUserId มีค่าแล้วหรือยัง
    if (!storedUserId) {
      console.error("User ID not found in sessionStorage");
      return;
    }
  
    const fetchData = async () => {
      try {
        const userId = encodeURIComponent(storedUserId || "");
        const [stripsRes, bandsRes] = await Promise.all([
          axios.get<any[]>(`http://localhost:3003/strips/card/${userId}`),
          axios.get<any[]>("http://localhost:3003/brands"),
        ]);
  
        const bandsMap = new Map(bandsRes.data.map((band) => [band.b_id, band.b_name]));
        
        // กรอง strips ตาม u_id
        const filteredStrips = stripsRes.data.filter((strip) => strip.u_id === storedUserId);
        const updatedCards = filteredStrips.map((strip) => ({
          ...strip,
          b_name: bandsMap.get(strip.b_id) || "Unknown",
        }));
  
        setCards(updatedCards);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchData();
  }, []);

  
  useEffect(() => {
    const storedUsername = sessionStorage.getItem("username");
    // console.log("Stored username:", sessionStorage);
    if (!storedUsername) {
      navigate("/");
      return;
    }
    setUsername(storedUsername);
  }, [navigate]);

  const formatDate = (isoString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    }).format(new Date(isoString));
  };
  

  // Handle search functionality
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);

    if (newSearchTerm === "") {
      scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
      setZoomedCardIndex(null);
      return;
    }

    const foundIndex = cards.findIndex((card) =>
      card.b_name.toLowerCase().includes(newSearchTerm.toLowerCase())
    );

    if (foundIndex !== -1 && cardRefs.current[foundIndex]) {
      cardRefs.current[foundIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
      setZoomedCardIndex(foundIndex);
    }
  };

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollLeft = scrollRef.current.scrollLeft;
        const maxScrollLeft =
          scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
        const index = Math.floor((scrollLeft / maxScrollLeft) * (cards.length -1)); // Use cards.length for number of dots
        setScrollIndex(index);
      }
    };

    const scrollElement = scrollRef.current;
    scrollElement?.addEventListener("scroll", handleScroll);

    return () => {
      scrollElement?.removeEventListener("scroll", handleScroll);
    };
  }, [cards.length]);

  

  const handleDotClick = (dotIndex: number) => {
    if (scrollRef.current) {
      const scrollWidth = scrollRef.current.scrollWidth;
      // const containerWidth = scrollRef.current.clientWidth;
      const scrollTo = (scrollWidth / (cards.length -1)) * dotIndex; // Scroll to specific dot
      scrollRef.current.scrollTo({
        left: scrollTo,
        behavior: "smooth",
      });
    }
  };

  const handleScroll = (direction: "left" | "right" | "front") => {
    if (scrollRef.current) {
      const scrollWidth = scrollRef.current.scrollWidth;
      const containerWidth = scrollRef.current.clientWidth;
      const currentScroll = scrollRef.current.scrollLeft;
      let newScroll;

      if (direction === "left") {
        newScroll = Math.max(currentScroll - containerWidth, 0);
      } else if (direction === "right") {
        newScroll = Math.min(currentScroll + containerWidth, scrollWidth - containerWidth);
      } else if (direction === "front") {
        newScroll = 0;
      }

      scrollRef.current.scrollTo({
        left: newScroll,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="fixed top-3 left-6 flex items-center gap-2">
          <img src="/image/logo2.png" alt="Logo" className="h-10" />
          <span className="text-lg font-bold">AQUAlity</span>
        </div>

        <div className="flex-grow flex justify-center mt-3">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={handleSearch}
            className="border outline-none rounded-full px-6 py-3 w-120 h-10"
          />
        </div>

        <div className="w-10 h-10 mt-3 bg-black text-white flex items-center justify-center rounded-full font-bold mr-6">
          {username.charAt(0)}
        </div>
      </div>

      <div className="flex flex-col items-center flex-grow">
        <div className="relative w-full flex-grow flex mt-10 flex-col justify-center">
          <div
            className="scroll-container flex overflow-x-auto w-full scroll-smooth py-4"
            ref={scrollRef}
          >
            <div className="flex gap-4 px-4 mx-auto">
              <button
                onClick={() => navigate("/add")}
                className="w-40 h-70 bg-[#dbdbdb] hover:bg-[#d2d2d2] hover:text-gray-200 hover:scale-110 hover:z-10 transition text-gray-400 flex items-center justify-center rounded-lg text-4xl"
              >
                +
              </button>
              {cards.map((card, index) => (
                  <div
                    key={index}
                    ref={(el) => (cardRefs.current[index] = el)}
                    className={`transition-transform transform ${
                      zoomedCardIndex === index
                        ? "scale-110 z-10"
                        : zoomedCardIndex === null
                        ? "hover:scale-110 hover:z-10"
                        : "opacity-60"
                    } min-w-[250px]`}
                    
                  >
                  <Card
                    imageUrl={card.s_url}
                    brand={card.b_name}
                    dateTime={formatDate(card.s_date)} // Adjust based on API response
                    location={`${card.s_latitude}, ${card.s_longitude}`}
                    waterQualityColor={card.s_qualitycolor}
                    onClick={() => {
                      if (card.s_id) {
                        // console.log(`Navigating to /cardinfo/${card.s_id}`);
                        navigate(`/cardinfo/${card.s_id}`);
                      } else {
                        console.error("Card ID is missing");
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center mt-10 space-x-2">
            {[...Array(cards.length)].map((_, dotIndex) => (
              <button
                key={dotIndex}
                onClick={() => handleDotClick(dotIndex)}
                className={`w-3 h-3 rounded-full ${
                  scrollIndex === dotIndex ? "bg-black" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-between w-full mt-6 mb-8 px-4 md:px-8">
          <button
            onClick={() => handleScroll("front")}
            className="flex items-center px-4 py-2 bg-black rounded-lg text-white"
          >
            <BiArrowToLeft className="mr-2" size={20} />
            <span className="relative mr-0.5 text-white">Front</span>
          </button>

          <div className="flex gap-4">
            <button
              onClick={() => handleScroll("left")}
              className="flex items-center text-white px-4 py-2 bg-black rounded-lg"
            >
              <MdKeyboardArrowLeft className="mr-2" size={20} />
              <span className="relative -top-0.1 mr-2">Prev</span>
            </button>

            <button
              onClick={() => handleScroll("right")}
              className="flex items-center text-white px-4 py-2 bg-black rounded-lg"
            >
              <span className="relative -top-0.1 ml-2">Next</span>
              <MdOutlineChevronRight className="ml-2 text-white" size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
    
  );
};

export default Lhome;  // ✅ Default Export
