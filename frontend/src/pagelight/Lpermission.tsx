import { useState } from "react";
import Wave from "../component/wave"; 

export default function PermissionPage() {
    const [name, setName] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");
  
    const handleSubmit = () => {
      if (!name.trim()) {
        setError("Please enter your name.");
        return;
      }
      setError("");
      setSubmitted(true);
    };
  
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 -mt-10 relative overflow-hidden">
        {/* Logo */}
        <div className="fixed top-3 left-6 flex items-center gap-2">
          <img src="/image/logo2.png" alt="Logo" className="h-10" />
          <span className="text-lg font-bold">AQUAlity</span>
        </div>
  
        <div className={`absolute transition-transform duration-500 ${submitted ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"}`}>
          <h1 className="text-4xl font-semibold mb-6">Hello,</h1>
          <div className="relative w-80 flex items-center">
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-0"
            />
            <button
              onClick={handleSubmit}
              className="w-12 h-10 bg-black hover:bg-white rounded-full flex items-center justify-center text-white hover:text-black ml-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
  
        {submitted && (
          <div className="absolute transition-transform duration-500 opacity-0 animate-slide-up flex flex-col items-center text-center">
            <p className="text-4xl font-semibold mb-4">Hello, {name}</p>
            <p className="text-base mt-2">We would like to inform you that</p>
            <p className="text-base mt-2">All recorded photos and data will be permanently retained, even if removed from the website, to be used for future research.</p>
            <button className="mt-8 bg-black text-white px-6 py-2 rounded-lg">Accept & Continue</button>
          </div>
        )}
  
        {/* Add Wave component at the bottom */}
        <Wave 
          lineCount={40}
          lineWeight={10}
          lineColor="#000"
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