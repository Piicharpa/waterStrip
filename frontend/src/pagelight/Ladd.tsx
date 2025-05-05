import React, { useState, useEffect, useRef } from "react";
import { FaLocationCrosshairs } from "react-icons/fa6";
import { FaPaperclip } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import imageCompression from "browser-image-compression";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

// Utility function to convert decimal to DMS
const toDMS = (decimal: number, isLat: boolean = true) => {
  const degrees = Math.floor(Math.abs(decimal));
  const minutes = Math.floor((Math.abs(decimal) - degrees) * 60);
  const seconds = ((Math.abs(decimal) - degrees - minutes / 60) * 3600).toFixed(
    1
  );

  let direction;
  if (isLat) {
    direction = decimal >= 0 ? "N" : "S";
  } else {
    direction = decimal >= 0 ? "E" : "W";
  }

  return `${degrees}°${minutes}'${seconds}"${direction}`;
};

const Ladd: React.FC = () => {
  const [location, setLocation] = useState("Please specify your location");
  const [brands, setBrands] = useState<{ b_id: number; b_name: string }[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLocationSelected, setIsLocationSelected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch brands from API
    axios
      .get<{ b_id: number; b_name: string }[]>("http://localhost:3003/brands")
      .then((response) => {
        setBrands(response.data);
      })
      .catch((error) => {
        console.error("Error fetching brands:", error);
      });

    // Clear location when page is refreshed
    window.addEventListener("beforeunload", resetState);

    // Check for location in localStorage and sessionStorage
    const storedLocation =
      localStorage.getItem("selectedLocation") ||
      sessionStorage.getItem("selectedLocation");

    if (storedLocation) {
      try {
        const parsedLocation = JSON.parse(storedLocation);

        // Ensure the location object has lat and lng
        if (
          parsedLocation &&
          parsedLocation.lat !== undefined &&
          parsedLocation.lng !== undefined
        ) {
          const latDMS = toDMS(parsedLocation.lat, true);
          const lngDMS = toDMS(parsedLocation.lng, false);

          // Update state with stored location
          setLocation(`${latDMS}, ${lngDMS}`);
          setIsLocationSelected(true);
        } else {
          // If stored location is invalid, reset everything
          resetState();
        }
      } catch (error) {
        // If parsing fails, reset everything
        resetState();
      }
    } else {
      // No location stored, reset everything
      resetState();
    }

    // Cleanup event listener
    return () => {
      window.removeEventListener("beforeunload", resetState);
    };
  }, []);

  // Reset state to initial values
  const resetState = () => {
    localStorage.removeItem("selectedLocation");
    sessionStorage.removeItem("selectedLocation");
    setLocation("Please specify your location");
    setIsLocationSelected(false);
    setSelectedFile(null);
    setImagePreview(null);
    setSelectedBrandId(null);
  };

  const handleLocate = () => {
    // Get the current stored location to pass as previous location
    const currentLocation = localStorage.getItem("selectedLocation");
    const parsedLocation = currentLocation ? JSON.parse(currentLocation) : null;

    navigate("/addmap", {
      state: {
        previousLocation: parsedLocation,
        selectedLocation: parsedLocation,
      },
    });
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return; // ป้องกัน Error กรณีไม่มีไฟล์

    if (isLocationSelected) {
      try {
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 0.1,
          maxWidthOrHeight: 800,
          useWebWorker: true,
          initialQuality: 0.7,
          alwaysKeepResolution: true, // คงสัดส่วนเดิม
        });

        // อ่านไฟล์เป็น Base64 เพื่อใช้แสดงรูป preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
          setSelectedFile(compressedFile); // ย้ายมาที่นี่เพื่อให้แน่ใจว่าถูกตั้งค่าหลังจาก compression
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error("Image compression failed:", error);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files[0];
    if (file && isLocationSelected) {
      setSelectedFile(file);

      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    if (isLocationSelected) {
      fileInputRef.current?.click();
    }
  };

  const [userId, setUid] = useState("");

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
  }, [navigate]);

  const handleAnalyze = async () => {
    if (isLocationSelected && selectedFile && selectedBrandId) {
      const locationParts = location.split(", ");
      const latitude = locationParts[0];
      const longitude = locationParts[1];

      if (!userId) {
        console.error("User ID not found. Please log in.");
        return;
      }

      // Save data to localStorage
      localStorage.setItem("stripBrand", selectedBrandId.toString());
      localStorage.setItem("location", location);
      if (imagePreview) {
        localStorage.setItem("uploadedImage", imagePreview);
      }

      // ข้อมูลที่ต้องส่งไปยัง API
      const data = {
        b_id: selectedBrandId,
        s_latitude: latitude,
        s_longitude: longitude,
        u_id: userId,
        s_url: imagePreview,
      };

      try {
        // ส่งข้อมูลไปยัง API
        const response = await axios.post(
          "http://localhost:3003/strips",
          data,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const responseData = response.data as {
          msg: string;
          data: { s_id: number };
        };

        if (response.status === 201 && responseData.data?.s_id) {
          const stripId = responseData.data.s_id;

          try {
            await axios.get(`http://localhost:3003/strips/predict/${stripId}`);
          } catch (predictError) {
            console.error("Prediction failed:", predictError);
            // คุณอาจใส่ alert หรือแสดงข้อความเตือนผู้ใช้ได้ตรงนี้
          }
        
          navigate(`/cardinfo/${stripId}`);
        }
         else {
          console.error("Error: s_id is undefined", responseData);
        }
      } catch (error) {
        console.error("Error in API request:", error);
        console.log("data : ", data);
      }
    }
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md mx-auto space-y-6 text-center">
        <div className="flex w-full justify-center">
          <div className="border h-11 w-70 rounded-full p-2 flex items-center justify-between">
            <span
              className={`text-black pl-3 ${
                isLocationSelected ? "" : "text-black"
              }`}
            >
              {location}
            </span>
            <button
              onClick={handleLocate}
              className="bg-transparent hover:bg-black text-black p-2 hover:text-white rounded-full outline-none focus:ring-0"
            >
              <FaLocationCrosshairs />
            </button>
          </div>
        </div>

        <div className="flex justify-center items-center">
          <h2 className="text-7xl font-bold whitespace-nowrap">
            Add your information
          </h2>
        </div>

        <p className="text-sm text-black -mt-6 mb-12">
          Add location, Upload image, Enter brand
        </p>

        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`w-171 h-30 -ml-29 p-6 ${
            selectedFile
              ? ""
              : isLocationSelected
              ? "cursor-pointer hover:bg-gray-100 transition"
              : "opacity-50 cursor-not-allowed"
          } relative`}
          style={{
            backgroundImage: imagePreview
              ? "none"
              : "url('data:image/svg+xml,%3csvg width=%22100%25%22 height=%22100%25%22 xmlns=%22http://www.w3.org/2000/svg%22%3e%3crect width=%22100%25%22 height=%22100%25%22 fill=%22none%22 rx=%2211%22 ry=%2211%22 stroke=%22black%22 stroke-width=%224%22 stroke-dasharray=%228%2c12%22 stroke-dashoffset=%2221%22 stroke-linecap=%22square%22/%3e%3c/svg%3e')",
            borderRadius: "11px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*"
            disabled={!isLocationSelected}
          />
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Preview"
              className="w-30 h-30 object-cover rounded-lg"
            />
          ) : (
            <>
              <p
                className={`text-bold text-2xl ${
                  isLocationSelected ? "text-[#a3a2a2]" : "text-gray-400"
                } mt-5 mb-5`}
              >
                Drag your photo here
              </p>
              {isLocationSelected && !selectedFile && (
                <button
                  onClick={triggerFileInput}
                  className="absolute top-4 right-4 text-gray-400 hover:text-black"
                >
                  <FaPaperclip />
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex space-x-2">
          <select
            value={selectedBrandId || ""}
            onChange={(e) => setSelectedBrandId(Number(e.target.value))}
            className="w-full px-5 py-2 border rounded-l-full outline-none focus:ring-0"
            disabled={!isLocationSelected}
          >
            <option value="">Select a Brand</option>
            {brands.map((brand) => (
              <option key={brand.b_id} value={brand.b_id}>
                {brand.b_name}
              </option>
            ))}
          </select>

          <button
            onClick={handleAnalyze}
            disabled={!(isLocationSelected && selectedFile && selectedBrandId)}
            className={`w-full sm:w-32 py-3 rounded-r-full transition ${
              isLocationSelected && selectedFile && selectedBrandId
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-[#f1f1f1] text-gray-400 cursor-not-allowed"
            }`}
          >
            Analyze
          </button>
        </div>
      </div>
    </div>
  );
};

export default Ladd;
