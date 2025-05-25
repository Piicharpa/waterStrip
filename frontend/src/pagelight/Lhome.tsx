import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Card from "../component/card";
import { BiArrowToLeft } from "react-icons/bi";
import { MdKeyboardArrowLeft, MdOutlineChevronRight } from "react-icons/md";
import axios from "axios";
import { RxCross2 } from "react-icons/rx";
import { logout } from "../oauth/auth";

type User = {
  u_email: string;
  u_id: string;
  u_name: string;
};

const Lhome: React.FC = () => {
  const [username, setUsername] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedQuality, setSelectedQuality] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [scrollIndex, setScrollIndex] = useState(0);
  const [zoomedCardIndex, setZoomedCardIndex] = useState<number | null>(null);
  const [cards, setCards] = useState<any[]>([]); // Store API data
  const [allCards, setAllCards] = useState<any[]>([]); // Keep original cards for filtering
  const [brands, setBrands] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  // User profile popup states
  const [showUserPopup, setShowUserPopup] = useState(false);
  const userPopupRef = useRef<HTMLDivElement>(null);

  // Dropdown state
  const [isWaterQualityDropdownOpen, setIsWaterQualityDropdownOpen] =
    useState(false);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const waterQualityDropdownRef = useRef<HTMLDivElement>(null);
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  // Water quality options
  const waterQualityOptions = [
    { value: "", label: "All", color: "" },
    { value: "#00c951", label: "Good", color: "green" },
    { value: "#f0b100", label: "Fair", color: "yellow" },
    { value: "#fb2c36", label: "Bad", color: "red" },
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

      if (
        userPopupRef.current &&
        !userPopupRef.current.contains(event.target as Node)
      ) {
        setShowUserPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch username and email
  useEffect(() => {
    const storedUserId = sessionStorage.getItem("userId");

    if (!storedUserId) {
      navigate("/");
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await axios.get<User>(`/api/users/${storedUserId}`);
        const userData = response.data;
        if (userData?.u_name) {
          setUsername(userData.u_name);
        } else {
          console.error("No username in response");
        }

        if (userData?.u_email) {
          setUserEmail(userData.u_email);
        } else {
          const storedEmail = sessionStorage.getItem("userEmail");
          setUserEmail(storedEmail || "user@example.com");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
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
      filtered = filtered.filter(
        (card) => card.s_qualitycolor === selectedQuality
      );
    }

    setCards(filtered);

    // Reset scroll and zoomed state
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
    setZoomedCardIndex(null);
  }, [selectedBrand, selectedQuality, allCards]);

  // Handle card deletion - show confirmation modal
  const handleDeleteCard = (cardId: string) => {
    setCardToDelete(cardId);
    setShowDeleteModal(true);
  };

  // Confirm deletion
  const confirmDelete = async () => {
    if (!cardToDelete) return;

    try {
      // Call your API to delete the card
      await axios.delete(`/api/strips/${cardToDelete}`);

      // Update the state by removing the deleted card
      const updatedCards = allCards.filter(
        (card) => card.s_id !== cardToDelete
      );
      setAllCards(updatedCards);

      // Apply current filters to the updated cards
      let filtered = updatedCards;

      if (selectedBrand !== "") {
        filtered = filtered.filter((card) => card.b_name === selectedBrand);
      }

      if (selectedQuality !== "") {
        filtered = filtered.filter(
          (card) => card.s_quality === selectedQuality
        );
      }

      setCards(filtered);

      // Update brands list if necessary
      const updatedBrands = Array.from(
        new Set(updatedCards.map((card) => card.b_name))
      ).sort();
      setBrands(updatedBrands);

      console.log("Card deleted successfully");
    } catch (error) {
      console.error("Error deleting card:", error);
      alert("Error deleting card. Please try again.");
    } finally {
      setShowDeleteModal(false);
      setCardToDelete(null);
    }
  };

  // Cancel deletion
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCardToDelete(null);
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate("/"); // or redirect to login if needed
  };

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

        <div className="flex-grow flex justify-end mr-3 mt-3 gap-4">
          {/* Water Quality Dropdown */}
          <div ref={waterQualityDropdownRef} className="relative w-14 z-[10]">
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
                        selectedQuality === "#00c951"
                          ? "bg-green-500"
                          : selectedQuality === "#f0b100"
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
                          : option.value === "#00c951"
                          ? "bg-green-500"
                          : option.value === "#f0b100"
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
          <div ref={brandDropdownRef} className="relative w-64 z-[10]">
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

        {/* User Profile Circle with Popup */}
        <div className="relative" ref={userPopupRef}>
          <div
            className="w-10 h-10 mt-3 bg-black text-white flex items-center justify-center rounded-full font-bold mr-6 cursor-pointer "
            onClick={() => setShowUserPopup(!showUserPopup)}
          >
            {username.charAt(0)}
          </div>

          {/* User Profile Popup */}
          {showUserPopup && (
            <div className="absolute top-full right-0 mt-2 w-70 bg-white border border-gray-200 rounded-lg shadow-lg z-[10001] mr-6">
              {/* Header with email and close button */}
              <div className="flex items-center justify-between p-3 border-gray-200">
                <div></div> {/* spacer ด้านซ้าย */}
                <div className="text-sm text-black truncate">{userEmail}</div>
                <button
                  onClick={() => setShowUserPopup(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                >
                  <RxCross2 />
                </button>
              </div>
              {/* User Info Section */}
              <div className="flex flex-col items-center -mt-2 p-4">
                {/* User Avatar */}
                <div className="w-15 h-15 bg-black text-white flex items-center justify-center rounded-full font-bold text-2xl mb-3">
                  {username.charAt(0)}
                </div>

                {/* Greeting */}
                <div className="text-center text-gray-800 mb-4">
                  <span className="text-base">Hi, </span>
                  <span className="text-base">{username}</span>
                </div>
              </div>

              {/* Logout Button */}
              <div className="p-3 -mt-6 border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full bg-black text-white py-2 px-4 rounded-lg text-base cursor-pointer hover:bg-gray-800 transition"
                >
                  log out
                </button>
              </div>
            </div>
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
                className="w-40 h-70 text-gray-400 bg-gray-200 hover:bg-gray-300 hover:scale-110 hover:z-10 transition  flex items-center justify-center rounded-lg text-4xl"
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
                        onDelete={() => handleDeleteCard(card.s_id)}
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

      {/* Delete Confirmation Modal - Positioned in the center of Lhome */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[60]"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <div className="bg-white w-100 rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-black mb-4">
              Would you like to delete this card?
            </h3>
            <h6 className="text-sm text-black mb-4">
              This will delete this card permanently. You can not undo this
              action.
            </h6>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lhome;
