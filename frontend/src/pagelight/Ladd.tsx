import React, { useState, useRef, useEffect } from "react";
import { FaLocationCrosshairs } from "react-icons/fa6";
import { FaPaperclip } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// Utility function to convert decimal to DMS
const toDMS = (decimal: number, isLat: boolean = true) => {
  const degrees = Math.floor(Math.abs(decimal));
  const minutes = Math.floor((Math.abs(decimal) - degrees) * 60);
  const seconds = ((Math.abs(decimal) - degrees - minutes / 60) * 3600).toFixed(1);

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
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLocationSelected, setIsLocationSelected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate(); 

  useEffect(() => {
    // Clear location when page is refreshed
    window.addEventListener('beforeunload', resetState);
    
    // Check for location in localStorage and sessionStorage
    const storedLocation = localStorage.getItem('selectedLocation') || 
                           sessionStorage.getItem('selectedLocation');
    
    if (storedLocation) {
      try {
        const parsedLocation = JSON.parse(storedLocation);
        
        // Ensure the location object has lat and lng
        if (parsedLocation && parsedLocation.lat !== undefined && parsedLocation.lng !== undefined) {
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
      window.removeEventListener('beforeunload', resetState);
    };
  }, []);

  // Reset state to initial values
  const resetState = () => {
    localStorage.removeItem('selectedLocation');
    sessionStorage.removeItem('selectedLocation');
    setLocation("Please specify your location");
    setIsLocationSelected(false);
    setSelectedFile(null);
    setImagePreview(null);
    setSelectedBrand("");
  };

  const handleLocate = () => {
    // Get the current stored location to pass as previous location
    const currentLocation = localStorage.getItem('selectedLocation');
    const parsedLocation = currentLocation ? JSON.parse(currentLocation) : null;

    navigate("/addmap", { 
      state: { 
        previousLocation: parsedLocation,
        selectedLocation: parsedLocation
      } 
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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

  const handleAnalyze = () => {
    if (isLocationSelected && selectedFile && selectedBrand) {
      const analyzeDate = new Date().toISOString(); // เก็บวันที่ปัจจุบัน
      localStorage.setItem("stripBrand", selectedBrand);
      localStorage.setItem("analyzeDate", analyzeDate);
      localStorage.setItem("location", location);
  
      if (imagePreview) {
        localStorage.setItem("uploadedImage", imagePreview);
      }
  
      navigate("/cardinfo");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md mx-auto space-y-6 text-center">
        <div className="flex w-full justify-center">
          <div className="border h-11 w-70 rounded-full p-2 flex items-center justify-between">
            <span className={`text-black pl-3 ${isLocationSelected ? '' : 'text-black'}`}>
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
        onClick={triggerFileInput}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`w-171 h-30 -ml-29 p-6 ${selectedFile ? '' : (isLocationSelected ? 'cursor-pointer hover:bg-gray-100 transition' : 'opacity-50 cursor-not-allowed')} relative`}
          style={{
            backgroundImage: imagePreview ? 'none' : 
              "url('data:image/svg+xml,%3csvg width=%22100%25%22 height=%22100%25%22 xmlns=%22http://www.w3.org/2000/svg%22%3e%3crect width=%22100%25%22 height=%22100%25%22 fill=%22none%22 rx=%2211%22 ry=%2211%22 stroke=%22black%22 stroke-width=%224%22 stroke-dasharray=%228%2c12%22 stroke-dashoffset=%2221%22 stroke-linecap=%22square%22/%3e%3c/svg%3e')",
            borderRadius: "11px",
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
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
              <p className={`text-bold text-2xl ${isLocationSelected ? 'text-[#a3a2a2]' : 'text-gray-400'} mt-5 mb-5`}>
                Drag the photo or Upload file
              </p>
              {/* {isLocationSelected && !selectedFile && (
                <button
                  onClick={triggerFileInput}
                  className="absolute top-4 right-4 text-gray-400 hover:text-black"
                >
                  <FaPaperclip />
                </button>
              )} */}
            </>
          )}
        </div>

        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Enter your strip brand"
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className={`w-full sm:w-100 px-5 py-2 border rounded-l-full outline-none focus:ring-0 ${isLocationSelected && selectedFile ? 'text-black border-black' : ' text-gray-400 border-[#f1f1f1] cursor-not-allowed'}`}
            disabled={!(isLocationSelected && selectedFile)}
          />

          <button
            onClick={handleAnalyze}
            disabled={!(isLocationSelected && selectedFile && selectedBrand)}
            className={`w-full sm:w-32 py-3 rounded-r-full transition ${
              isLocationSelected && selectedFile && selectedBrand 
              ? 'bg-black text-white hover:bg-gray-800' 
              : 'bg-[#f1f1f1] text-gray-400 cursor-not-allowed'
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