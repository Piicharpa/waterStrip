import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../component/Card";
import { BiArrowToLeft } from "react-icons/bi";
import { MdKeyboardArrowLeft, MdOutlineChevronRight } from "react-icons/md";
import axios from "axios";
import { logout } from "../oauth/auth";
import Navbar from "../component/Navbar/Navbar";
import HomeNavControls from "../component/Navbar/RightNav/HomeNavControls";
import AppUser from "../component/Types/AppUser";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

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
  const [, setIsWaterQualityDropdownOpen] = useState(false);
  const [, setIsBrandDropdownOpen] = useState(false);
  const waterQualityDropdownRef = useRef<HTMLDivElement>(null);
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  // Calculate number of dots (max 4)
  const getDotsCount = () => {
    if (cards.length <= 4) return cards.length;
    return 4;
  };

  // Calculate current dot index based on scroll position
  const getCurrentDotIndex = (scrollLeft: number, maxScrollLeft: number) => {
    if (cards.length <= 4) {
      return Math.round(
        (scrollLeft / maxScrollLeft) * Math.max(cards.length - 1, 0)
      );
    }

    // For more than 4 cards, divide scroll into 4 sections
    const sectionSize = maxScrollLeft / 3; // 4 sections = 3 dividers
    let dotIndex = Math.floor(scrollLeft / sectionSize);

    // Ensure we don't exceed 3 (for 4 dots: 0, 1, 2, 3)
    dotIndex = Math.min(dotIndex, 3);

    return dotIndex;
  };

  // Handle dot click for navigation
  const handleDotClick = (dotIndex: number) => {
    if (!scrollRef.current) return;

    const maxScrollLeft =
      scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
    let scrollTo: number;

    if (cards.length <= 4) {
      // Direct mapping for 4 or fewer cards
      scrollTo = (maxScrollLeft / Math.max(cards.length - 1, 1)) * dotIndex;
    } else {
      // For more than 4 cards, divide scroll area into 4 sections
      scrollTo = (maxScrollLeft / 3) * dotIndex;
    }

    scrollRef.current.scrollTo({
      left: scrollTo,
      behavior: "smooth",
    });
  };

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
        new Set(brandsRes.data.map((brand) => brand.b_name))
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

  // Handle scroll event - Updated to use new dot calculation
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollLeft = scrollRef.current.scrollLeft;
        const maxScrollLeft =
          scrollRef.current.scrollWidth - scrollRef.current.clientWidth;

        const index = getCurrentDotIndex(scrollLeft, maxScrollLeft);
        setScrollIndex(isNaN(index) ? 0 : index);
      }
    };

    const scrollElement = scrollRef.current;
    scrollElement?.addEventListener("scroll", handleScroll);

    return () => {
      scrollElement?.removeEventListener("scroll", handleScroll);
    };
  }, [cards.length]);

  const handleScroll = (direction: "left" | "right" | "front") => {
    if (scrollRef.current) {
      const scrollWidth = scrollRef.current.scrollWidth;
      const containerWidth = scrollRef.current.clientWidth;
      const currentScroll = scrollRef.current.scrollLeft;
      const maxScrollLeft = scrollWidth - containerWidth;
      let newScroll;

      if (direction === "left") {
        // เลื่อนไปทีละการ์ด (ประมาณ 270px = card width + gap)
        const cardScrollDistance = 270;
        newScroll = Math.max(currentScroll - cardScrollDistance, 0);
      } else if (direction === "right") {
        // เลื่อนไปทีละการ์ด (ประมาณ 270px = card width + gap)
        const cardScrollDistance = 270;
        newScroll = Math.min(currentScroll + cardScrollDistance, maxScrollLeft);
      } else if (direction === "front") {
        // เลื่อนกลับไปที่หน้าสุด
        newScroll = 0;
      }

      scrollRef.current.scrollTo({
        left: newScroll,
        behavior: "smooth",
      });
    }
  };

  const [user, setUser] = useState<AppUser | null>(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const res = await fetch(`/api/users/${currentUser.uid}`);
          if (res.ok) {
            const userData = await res.json();
            sessionStorage.setItem("userId", userData.u_id);
            setUser(userData);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="fixed inset-0 bg-white flex flex-col overflow-hidden">
      <Navbar
        user={user}
        RightComponent={
          <HomeNavControls
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            selectedQuality={selectedQuality}
            setSelectedQuality={setSelectedQuality}
            brands={brands}
            username={username}
            userEmail={userEmail}
            showUserPopup={showUserPopup}
            setShowUserPopup={setShowUserPopup}
            handleLogout={handleLogout}
            userPopupRef={userPopupRef}
          />
        }
      />

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

          {/* Updated dots section - Show maximum 4 dots */}
          {cards.length > 0 && (
            <div className="flex justify-center mt-10 space-x-2">
              {[...Array(getDotsCount())].map((_, dotIndex) => (
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
