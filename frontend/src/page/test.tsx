import React from "react";
import PicScale from "../component/picscale";

const Test: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <PicScale
      scaleColors= {["#F7DC6F", "#F0B825", "#FF9B1E", "#F85208"]}
      />
    </div>
  );
};

export default Test;
