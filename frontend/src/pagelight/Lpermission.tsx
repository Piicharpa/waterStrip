import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Wave from "../component/wave";
import { IoIosWarning } from "react-icons/io";
import { FaCheck } from "react-icons/fa6";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

export default function PermissionPage() {
  const [name, setName] = useState("");
  const [uid, setUid] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [checked, setChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/"); // ยังไม่ได้ login จริง ๆ
        return;
      }

      const userId = user.uid;
      setUid(userId);

      try {
        const response = await fetch(`/api/users/${userId}`, { method: "GET" });
        if (!response.ok) throw new Error("Failed to fetch user");

        const userData = await response.json();
        console.log(userData);

        if (userData.u_name) {
          setName(userData.u_name);
          setSubmitted(true);
          sessionStorage.setItem("username", userData.u_name);
          sessionStorage.setItem("userId", userId);
          navigate("/home"); // ✅ Redirect ไป home ทันทีถ้ามีชื่อแล้ว
        } else {
          // ไม่มีชื่อ ก็ให้รอให้ผู้ใช้กรอกชื่อ → ไม่ redirect
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("* Please enter your name *");
      return;
    }
    setError("");

    try {
      const response = await fetch(`/api/users/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ u_name: name }),
      });

      if (!response.ok) throw new Error("Failed to update name");

      setSubmitted(true);
      sessionStorage.setItem("username", name);
    } catch (error) {
      console.error("Error updating name:", error);
    }
  };

  const handleContinue = () => {
    if (!checked) return;

    // ✅ เซ็ตซ้ำให้แน่ใจว่า `userId` อยู่ใน sessionStorage ก่อนเปลี่ยนหน้า
    sessionStorage.setItem("username", name);
    sessionStorage.setItem("userId", uid);

    console.log("✅ Navigating to /home");
    navigate("/home");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 -mt-10 relative overflow-hidden">
      <div className="fixed top-3 left-6 flex items-center gap-2">
        <img src="/image/logo2.png" alt="Logo" className="h-10" />
        <span className="text-lg font-bold">AQUAlity</span>
      </div>

      {!submitted && (
        <div className="transition-opacity duration-500 opacity-100">
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
                className="w-12 h-10 bg-black hover:bg-[#dcdcdc] hover:text-gray-400 rounded-full flex items-center justify-center text-white ml-3"
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
            <p className="text-gray-400 text-sm mt-2">{error}</p>
          </div>
        </div>
      )}

      {submitted && (
        <div className="transition-opacity duration-500 opacity-100 animate-slide-up flex flex-col items-center text-center max-w-lg">
          <p className="text-4xl font-semibold mb-6">Hello, {name}</p>

          <div className="bg-white border border-black rounded-lg p-6 mb-6 w-full">
            <div className="flex items-start gap-2">
              <IoIosWarning className="text-black text-xl flex-shrink-0 mt-1" />
              <div className="text-left">
                <p className="text-base ">We would like to inform you that</p>
                <p className="text-base mt-2">
                  All recorded photos and data will be permanently retained,
                  even if removed from the website, to be used for future
                  research.
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <div
                className="w-6 h-6 border border-black rounded flex items-center justify-center cursor-pointer"
                onClick={() => setChecked(!checked)}
              >
                {checked && <FaCheck className="text-black" />}
              </div>
            </div>
          </div>

          <button
            className={`mt-2 px-6 py-2 rounded-lg ${
              checked
                ? "bg-black text-white cursor-pointer"
                : "bg-[#f1f1f1] text-gray-400 cursor-not-allowed"
            }`}
            onClick={handleContinue}
            disabled={!checked}
          >
            Accept & Continue
          </button>
        </div>
      )}

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
