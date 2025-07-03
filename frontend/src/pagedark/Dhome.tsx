import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../component/Card";
import { BiArrowToLeft } from "react-icons/bi";
import { MdKeyboardArrowLeft, MdOutlineChevronRight } from "react-icons/md";

const Dhome: React.FC = () => {
  const [username, setUsername] = useState(" ");
  const [searchTerm, setSearchTerm] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [scrollIndex, setScrollIndex] = useState(0);
  const [zoomedCardIndex, setZoomedCardIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  // Add this useEffect to retrieve username from localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");

    // If no username is found, redirect back to permission page
    if (!storedUsername) {
      navigate("/");
      return;
    }

    setUsername(storedUsername);
  }, [navigate]);

  // จำลองข้อมูลการ์ด
  const cards = [
    {
      imageUrl: "/cardimage/1.jpeg",
      brand: "A",
      dateTime: "14:30, 12 Mar. 2025",
      location: "13°45'22.7\"N 100°30'06.5\"E",
      waterQuality: 4,
    },
    {
      imageUrl: "/cardimage/2.jpg",
      brand: "B",
      dateTime: "08:45, 18 Feb. 2025",
      location: "35°41'22.2\"N 139°41'30.1\"E",
      waterQuality: 80,
    },
    {
      imageUrl: "/cardimage/3.jpg",
      brand: "C",
      dateTime: "19:10, 25 Jan. 2025",
      location: "37°33'59.4\"N 126°58'40.8\"E",
      waterQuality: 45,
    },
    {
      imageUrl: "/cardimage/4.webp",
      brand: "D",
      dateTime: "22:50, 30 Dec. 2024",
      location: "51°30'26.6\"N 0°07'40.1\"W",
      waterQuality: 31,
    },
    {
      imageUrl: "/cardimage/5.jpg",
      brand: "E",
      dateTime: "11:20, 10 Nov. 2024",
      location: "48°51'23.8\"N 2°21'07.9\"E",
      waterQuality: 68,
    },
    {
      imageUrl: "/cardimage/6.jpg",
      brand: "F",
      dateTime: "06:55, 5 Oct. 2024",
      location: "52°31'12.0\"N 13°24'18.0\"E",
      waterQuality: 2,
    },
    {
      imageUrl: "/cardimage/7.jpg",
      brand: "G",
      dateTime: "17:40, 21 Sep. 2024",
      location: "1°21'07.6\"N 103°49'11.3\"E",
      waterQuality: 99,
    },
    {
      imageUrl: "/cardimage/8.jpeg",
      brand: "Hello",
      dateTime: "09:15, 14 Aug. 2024",
      location: "40°42'46.1\"N 74°00'21.6\"W",
      waterQuality: 57,
    },
    {
      imageUrl: "/cardimage/9.jpeg",
      brand: "I",
      dateTime: "15:05, 7 Jul. 2024",
      location: "34°03'08.0\"N 118°14'37.3\"W",
      waterQuality: 34,
    },
    {
      imageUrl: "/cardimage/10.jpg",
      brand: "Hi",
      dateTime: "23:14, 1 Jun. 2024",
      location: "33°52'07.7\"S 151°12'33.5\"E",
      waterQuality: 81,
    },
  ];

  const NUM_DOTS = 4;

  const handleScroll = (direction: "front" | "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      if (direction === "front") {
        scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        setZoomedCardIndex(null); // Reset zoomed card when scrolling to front
      } else {
        scrollRef.current.scrollBy({
          left: direction === "left" ? -scrollAmount : scrollAmount,
          behavior: "smooth",
        });
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollLeft = scrollRef.current.scrollLeft;
        const maxScrollLeft =
          scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
        const index = Math.floor((scrollLeft / maxScrollLeft) * (NUM_DOTS - 1));
        setScrollIndex(index);
      }
    };

    const scrollElement = scrollRef.current;
    scrollElement?.addEventListener("scroll", handleScroll);

    return () => {
      scrollElement?.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleDotClick = (dotIndex: number) => {
    if (scrollRef.current) {
      const maxScrollLeft =
        scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
      const scrollPosition = (dotIndex / (NUM_DOTS - 1)) * maxScrollLeft;
      scrollRef.current.scrollTo({ left: scrollPosition, behavior: "smooth" });
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);

    if (newSearchTerm === "") {
      // If search is cleared, scroll to the first card and reset zoom
      scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
      setZoomedCardIndex(null);
      return;
    }

    const foundIndex = cards.findIndex((card) =>
      card.brand.toLowerCase().includes(newSearchTerm.toLowerCase())
    );

    if (foundIndex !== -1 && cardRefs.current[foundIndex]) {
      // Scroll to the found card and set it as permanently zoomed
      cardRefs.current[foundIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
      setZoomedCardIndex(foundIndex);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="fixed top-3 left-6 flex items-center gap-2">
          <img src="/image/logo3.png" alt="Logo" className="h-10" />
          <span className="text-lg font-bold text-white">AQUAlity</span>
        </div>

        <div className="flex-grow flex justify-center mt-3 ">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={handleSearch}
            className="border outline-none bg-white rounded-full px-6 py-3 w-120 h-10 text-black"
          />
        </div>

        <div className="w-10 h-10 mt-3 bg-white text-black flex items-center justify-center rounded-full font-bold mr-6">
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
              <button className="w-40 h-70 bg-[#d1d1d1] hover:bg-[#d0d0d0] hover:text-[#eae9e9] hover:scale-110 hover:z-10 transition text-[#8e8d8d] flex items-center justify-center rounded-lg text-4xl">
                +
              </button>
              {cards.map((card, index) => (
                <div
                  key={index}
                  ref={(el) => (cardRefs.current[index] = el)}
                  className={`transition-transform transform ${
                    zoomedCardIndex === index || zoomedCardIndex === index
                      ? "scale-110 z-10"
                      : zoomedCardIndex === null && searchTerm === ""
                      ? "hover:scale-110 hover:z-10"
                      : "opacity-60"
                  } min-w-[250px] `}
                >
                  <Card
                    {...card}
                    cardColor="bg-white" // กำหนดสีพื้นหลังการ์ดที่ต้องการ
                    textColor="text-black" // กำหนดสีข้อความของแบรนด์
                    textColorDateTime="text-black" // กำหนดสีข้อความของ dateTime
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center mt-10 space-x-2">
            {[...Array(NUM_DOTS)].map((_, dotIndex) => (
              <button
                key={dotIndex}
                onClick={() => handleDotClick(dotIndex)}
                className={`w-3 h-3 rounded-full ${
                  scrollIndex === dotIndex ? "bg-white" : "bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-between w-full mt-6 mb-8 px-4 md:px-8">
          <button
            onClick={() => handleScroll("front")}
            className="flex items-center px-4 py-2 bg-white rounded-lg text-black"
          >
            <BiArrowToLeft className="mr-2" size={20} />
            <span className="relative mr-0.5 text-black">Front</span>
          </button>
          <div className="flex gap-4">
            <button
              onClick={() => handleScroll("left")}
              className="flex items-center text-black px-4 py-2 bg-white rounded-lg"
            >
              <MdKeyboardArrowLeft className="mr-2" size={20} />
              <span className="relative -top-0.1 mr-2">Prev</span>
            </button>
            <button
              onClick={() => handleScroll("right")}
              className="flex items-center text-black px-4 py-2 bg-white rounded-lg"
            >
              <span className="relative -top-0.1 ml-2">Next</span>
              <MdOutlineChevronRight className="ml-2 text-black" size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dhome;
