import React from "react";
import Card from "../component/card";

const Test: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <Card 
        imageUrl="https://via.placeholder.com/150"
        brand="Nike"
        dateTime="24 Aug. 2021, 14:30"
        location="34.4566, 23.2345"
      />
    </div>
  );
};

export default Test;
