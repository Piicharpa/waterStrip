import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Dwave from "../component/Dwave";
import { IoIosWarning } from "react-icons/io";
import { FaCheck } from "react-icons/fa6";

export default function Dpermission() {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [checked, setChecked] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("* Please enter your name *");
      return;
    }
    setError("");
    setSubmitted(true);
  };

  

  const handleContinue = () => {
    // Add navigation or next step logic here
    localStorage.setItem('username', name);
      navigate('/dhome');
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen p-6 -mt-10 overflow-hidden bg-black text-white fixed top-0 left-0">
      {/* Prevent scrolling and remove white borders */}
      <style>{`
        body, html { overflow: hidden; margin: 0; padding: 0; background-color: black; }
      `}</style>

      {/* Logo */}
      <div className="fixed top-3 left-6 flex items-center gap-2">
        <img src="/image/logo3.png" alt="Logo" className="h-10" />
        <span className="text-lg font-bold">AQUAlity</span>
      </div>

      {/* Form Section */}
      <div className={`transition-opacity duration-500 ${submitted ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <h1 className="text-4xl font-semibold mb-6">Hello !</h1>
        <div className="relative w-80 flex flex-col items-center">
          <div className="w-full flex items-center">
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none bg-white focus:ring-0 text-black"
            />
            <button
              onClick={handleSubmit}
              className="w-12 h-10 bg-white hover:bg-gray-300 rounded-full flex items-center justify-center text-black ml-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          {/* Error Message */}
          <p className="text-gray-400 text-sm mr-29 mt-2 h-5 w-50">{error}</p>
        </div>
      </div>

      {/* Success Section */}
      {submitted && (
        <div className="absolute transition-opacity duration-500 opacity-0 animate-slide-up flex flex-col items-center text-center max-w-lg">
          <p className="text-4xl font-semibold mb-6">Hello, {name}</p>
          
          <div className="bg-black border border-white rounded-lg p-6 mb-6 w-full">
            <div className="flex items-start gap-2">
              <IoIosWarning className="text-white text-xl flex-shrink-0 mt-1" />
              <div className="text-left">
                <p className="text-base">We would like to inform you that</p>
                <p className="text-base mt-2">
                  All recorded photos and data will be permanently retained, even if removed from the website, to be used for future research.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <div 
                className="w-6 h-6 border border-white rounded flex items-center justify-center cursor-pointer"
                onClick={() => setChecked(!checked)}
              >
                {checked && <FaCheck className="text-white" />}
              </div>
            </div>
          </div>
          
          <button 
            className={`mt-2 px-6 py-2 rounded-lg ${
              checked 
                ? "bg-white text-black cursor-pointer" 
                : "bg-[#f1f1f1] text-gray-400  cursor-not-allowed"
            }`}
            onClick={() => checked && handleContinue()}
            disabled={!checked}
          >
            Accept & Continue
          </button>
        </div>
      )}

      {/* Add Wave component at the bottom */}
      <Dwave 
        lineCount={40}
        lineWeight={10}
        lineColor="#fff"
        waveSpeed={1}
        waveHeight={50}
      />

      <style>
        {`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }
        `}
      </style>
    </div>
  );
}