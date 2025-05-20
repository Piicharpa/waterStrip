import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Card from "../component/card";
import { BiArrowToLeft } from "react-icons/bi";
import {
  MdKeyboardArrowLeft,
  MdOutlineChevronRight,
  MdClose,
  MdUndo,
} from "react-icons/md";
import axios from "axios";
import { logout } from "../oauth/auth"; // Adjust the import path as necessary

type User = {
  u_id: string;
  u_name: string;
};

type DeletedCardInfo = {
  card: any;
  index: number;
};

const Lhome: React.FC = () => {
  const [username, setUsername] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedQuality, setSelectedQuality] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [scrollIndex, setScrollIndex] = useState(0);
  const [zoomedCardIndex, setZoomedCardIndex] = useState<number | null>(null);
  const [cards, setCards] = useState<any[]>([]); // Store API data
  const [allCards, setAllCards] = useState<any[]>([]); // Keep original cards for filtering
  const [brands, setBrands] = useState<string[]>([]);
  const navigate = useNavigate();

  // Dropdown state
  const [isWaterQualityDropdownOpen, setIsWaterQualityDropdownOpen] =
    useState(false);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const waterQualityDropdownRef = useRef<HTMLDivElement>(null);
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  // For handling deleted cards and toast notification
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const [deletedCardInfo, setDeletedCardInfo] =
    useState<DeletedCardInfo | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Water quality options
  const waterQualityOptions = [
    { value: "", label: "All", color: "" },
    { value: "#00FF00", label: "Good", color: "green" },
    { value: "#FFFF00", label: "Fair", color: "yellow" },
    { value: "#FF0000", label: "Bad", color: "red" },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        waterQualityDropdownRef.current &&
        !waterQualityDropdownRef.current.contains(event.target as Node)
      ) {
        setIsWaterQualityDropdownOpen(false);
      }

      if (
        brandDropdownRef.current &&
        !brandDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBrandDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch username
  useEffect(() => {
    const storedUserId = sessionStorage.getItem("userId");

    if (!storedUserId) {
      navigate("/");
      return;
    }

    const fetchUsername = async () => {
      try {
        const response = await axios.get<User>(`/api/users/${storedUserId}`);
        const userData = response.data;
        if (userData?.u_name) {
          setUsername(userData.u_name);
        } else {
          console.error("No username in response");
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    };

    fetchUsername();
  }, [navigate]);

  const fetchData = async () => {
    const storedUserId = sessionStorage.getItem("userId");
    if (!storedUserId) {
      console.error("User ID not found in sessionStorage");
      return;
    }

    try {
      const queryParams = new URLSearchParams();
      if (selectedBrand) queryParams.append("brand", selectedBrand);
      if (selectedQuality) queryParams.append("quality", selectedQuality);

      console.log("Query params:", queryParams.toString());

      const stripsUrl = `/api/strips/card/${storedUserId}?${queryParams.toString()}`;
      const [stripsRes, brandsRes] = await Promise.all([
        axios.get<any[]>(stripsUrl),
        axios.get<any[]>("/api/brands"),
      ]);

      const bandsMap = new Map(
        brandsRes.data.map((band) => [band.b_id, band.b_name])
      );

      const updatedCards = stripsRes.data.map((strip) => ({
        ...strip,
        b_name: strip.brandName || bandsMap.get(strip.b_id) || "Unknown",
      }));

      setCards(updatedCards);
      setAllCards(updatedCards);

      const uniqueBrands = Array.from(
        new Set(updatedCards.map((card) => card.b_name))
      ).sort();

      setBrands(uniqueBrands);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBrand, selectedQuality]);

  // Filter cards when brand or quality selection changes
  useEffect(() => {
    let filtered = allCards;

    if (selectedBrand !== "") {
      filtered = filtered.filter((card) => card.b_name === selectedBrand);
    }

    if (selectedQuality !== "") {
      filtered = filtered.filter((card) => card.s_qualitycolor === selectedQuality);
    }

    setCards(filtered);

    // Reset scroll and zoomed state
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
    setZoomedCardIndex(null);
  }, [selectedBrand, selectedQuality, allCards]);

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

  // Handle card deletion
  const handleDeleteCard = (index: number) => {
    // Store the deleted card info for potential undo
    const deletedCard = cards[index];
    setDeletedCardInfo({ card: deletedCard, index });

    // Remove the card from the UI
    const newCards = [...cards];
    newCards.splice(index, 1);
    setCards(newCards);
    setAllCards(allCards.filter((card) => card.s_id !== deletedCard.s_id));

    // Show toast notification
    setShowDeleteToast(true);

    // Auto-hide toast after 3 seconds
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setShowDeleteToast(false);
      // Permanently delete the card from backend after toast disappears
      if (deletedCard && deletedCard.s_id) {
        deleteCardFromBackend(deletedCard.s_id);
      }
    }, 3000);
  };

  // Function to delete card from backend
  const deleteCardFromBackend = async (cardId: string) => {
    try {
      // Here you would normally call your API to delete the card
      await axios.delete(`/api/strips/${cardId}`);
      console.log(`Card ${cardId} permanently deleted`);
    } catch (error) {
      console.error("Error deleting card:", error);
    }
  };

  // Handle undo delete
  const handleUndoDelete = () => {
    if (deletedCardInfo) {
      const { card, index } = deletedCardInfo;
      const newCards = [...cards];
      newCards.splice(index, 0, card);
      setCards(newCards);
      setAllCards([...allCards, card]);
      setShowDeleteToast(false);

      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    }
  };

  // Handle close toast
  const handleCloseToast = () => {
    setShowDeleteToast(false);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    // Permanently delete the card from backend when toast is closed
    if (deletedCardInfo && deletedCardInfo.card && deletedCardInfo.card.s_id) {
      deleteCardFromBackend(deletedCardInfo.card.s_id);
    }
  };

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollLeft = scrollRef.current.scrollLeft;
        const maxScrollLeft =
          scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
        const index = Math.round(
          (scrollLeft / maxScrollLeft) * Math.max(cards.length - 1, 0)
        );
        setScrollIndex(isNaN(index) ? 0 : index);
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
      const scrollTo = (scrollWidth / (cards.length - 1)) * dotIndex; // Scroll to specific dot
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
        newScroll = Math.min(
          currentScroll + containerWidth,
          scrollWidth - containerWidth
        );
      } else if (direction === "front") {
        newScroll = 0;
      }

      scrollRef.current.scrollTo({
        left: newScroll,
        behavior: "smooth",
      });
    }
  };

  // Handle water quality selection
  const handleQualitySelect = (quality: string) => {
    setSelectedQuality(quality);
    setIsWaterQualityDropdownOpen(false);
  };

  // Handle brand selection
  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand);
    setIsBrandDropdownOpen(false);
  };


   const [showLogout, setShowLogout] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/"); // or redirect to login if needed
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="fixed top-0 bg-white border-gray-200 px-6 py-3 gap-8 z-50">
          <nav className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <img src="/image/logo2.png" alt="Logo" className="h-10" />
                <span className="text-xl font-bold text-gray-800">
                  AQUAlity
                </span>
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
        </div>

        {/* User Greeting */}

        <div className="relative">
          {showLogout && (
            <button
              onClick={handleLogout}
              className="absolute top-14 right-0 bg-white border border-gray-300 px-4 py-2 rounded shadow text-sm"
            >
              Logout
            </button>
          )}
         </div>


        <div className="flex-grow flex justify-end mr-3 mt-3 gap-4">
          {/* Water Quality Dropdown */}
          <div
            ref={waterQualityDropdownRef}
            className="relative w-14 z-[10000]"
          >
            {/* Dropdown Trigger */}
            <div
              onClick={() => {
                setIsWaterQualityDropdownOpen(!isWaterQualityDropdownOpen);
                // Close brand dropdown if open
                setIsBrandDropdownOpen(false);
              }}
              className="flex items-center justify-between w-15 h-10 p-2 bg-white border border-black rounded-l-full cursor-pointer"
            >
              <div className="flex items-center">
                {selectedQuality === "" ? (
                  <>
                    <div className="w-5 h-5 mr-2 rounded-full bg-gradient-to-tr from-green-500 via-yellow-500 to-red-500"></div>
                  </>
                ) : (
                  <>
                    <div
                      className={`w-5 h-5 mr-2 rounded-full ${
                        selectedQuality === "#00FF00"
                          ? "bg-green-500"
                          : selectedQuality === "#FFFF00"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                  </>
                )}
              </div>
              <svg
                className="w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>

            {/* Dropdown Menu */}
            {isWaterQualityDropdownOpen && (
              <div className="absolute top-full left-0 w-25 mt-2 border border-gray-200 bg-white rounded-lg  z-[10001]">
                {waterQualityOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleQualitySelect(option.value)}
                    className="flex items-center p-2 hover:bg-gray-100 hover:rounded-lg cursor-pointer"
                  >
                    <div
                      className={`w-5 h-5 mr-2 rounded-full ${
                        option.value === ""
                          ? "bg-gradient-to-tr from-green-500 via-yellow-500 to-red-500"
                          : option.value === "#00FF00"
                          ? "bg-green-500"
                          : option.value === "#FFFF00"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                    <span>{option.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Brand Dropdown */}
          <div ref={brandDropdownRef} className="relative w-64 z-[10000]">
            {/* Dropdown Trigger */}
            <div
              onClick={() => {
                setIsBrandDropdownOpen(!isBrandDropdownOpen);
                // Close water quality dropdown if open
                setIsWaterQualityDropdownOpen(false);
              }}
              className="flex items-center justify-between w-full h-10 p-2 bg-white border rounded-r-full border-black cursor-pointer"
            >
              <span>{selectedBrand || "Select Brand"}</span>
              <svg
                className="w-4 h-4 ml-2"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>

            {/* Dropdown Menu */}
            {isBrandDropdownOpen && (
              <div className="absolute top-full left-0 w-full mt-2 border border-gray-200 bg-white rounded-lg  z-[10001] max-h-60 overflow-y-auto">
                <div
                  key="all-brands"
                  onClick={() => handleBrandSelect("")}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                >
                  All Brands
                </div>
                {brands.map((brand) => (
                  <div
                    key={brand}
                    onClick={() => handleBrandSelect(brand)}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {brand}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* <div className="w-10 h-10 mt-3 bg-black text-white flex items-center justify-center rounded-full font-bold mr-6">
          {username.charAt(0)}
        </div> */}
        <div className="relative">
      <div
        className="w-10 h-10 mt-3 bg-black text-white flex items-center justify-center rounded-full font-bold mr-6 cursor-pointer"
        onClick={() => setShowLogout(!showLogout)}
      >
        {username.charAt(0)}
      </div>

      {showLogout && (
        <button
          onClick={handleLogout}
          className="absolute top-14 right-0 bg-white border border-gray-300 px-4 py-2 rounded shadow text-sm"
        >
          Logout
        </button>
      )}
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
              {cards.length === 0
                ? null
                : cards.map((card, index) => (
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
                        dateTime={formatDate(card.s_date)}
                        location={`${card.s_latitude}, ${card.s_longitude}`}
                        waterQualityColor={card.s_qualitycolor}
                        onClick={() => {
                          if (card.s_id) {
                            navigate(`/cardinfo/${card.s_id}`);
                          } else {
                            console.error("Card ID is missing");
                          }
                        }}
                        onDelete={() => handleDeleteCard(index)}
                      />
                    </div>
                  ))}
            </div>
          </div>

          {cards.length > 0 && (
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
          )}
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

      {/* Delete Toast Notification */}
      {showDeleteToast && (
        <div className="fixed bottom-20 left-8 bg-white border border-black text-black px-4 py-3 rounded-lg shadow-lg flex items-center gap-6 z-50">
          <span>deleted</span>
          <button
            onClick={handleUndoDelete}
            className="flex items-center bg-black border text-white border-black rounded-md px-2 py-1 text-sm "
          >
            <MdUndo className="mr-1 text-white" />
            undo
          </button>
          <button
            onClick={handleCloseToast}
            className="-ml-2 text-gray-300 hover:text-black"
          >
            <MdClose size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Lhome;
