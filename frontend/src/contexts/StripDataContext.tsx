import { createContext, useContext, useEffect, useState } from "react";

interface Strip {
  s_date: string;
  s_latitude: string;
  s_longitude: string;
  s_qualitycolor: string;
}

interface StripDataContextType {
  stripData: Strip[];
}

const StripDataContext = createContext<StripDataContextType>({ stripData: [] });

export const useStripData = () => useContext(StripDataContext);

export const StripDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [stripData, setStripData] = useState<Strip[]>([]);

  useEffect(() => {
     console.log("useEffect: Fetching strips...");
    const fetchStripData = async () => {
      try {
        const res = await fetch("/api/strips");
        const data = await res.json();
        console.log("Fetched strip data:", data);
        setStripData(data);
      } catch (err) {
        console.error("Error fetching strip data:", err);
      }
    };

    fetchStripData();
  }, []);

  return (
    <StripDataContext.Provider value={{ stripData }}>
      {children}
    </StripDataContext.Provider>
  );
};
