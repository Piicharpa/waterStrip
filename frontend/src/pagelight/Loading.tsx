// import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

function Loading() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (!videoElement) return;
    
    // เริ่มเล่นวิดีโอทันทีเมื่อโหลดหน้า
    videoElement.play().catch(error => {
      console.error("วิดีโอไม่สามารถเล่นได้:", error);
    });
    
    // เมื่อวิดีโอเล่นจบ (แต่ละรอบ)
    const handleEnded = () => {
      videoElement.pause();
      
      // ซ่อนวิดีโอ (แสดงเป็นพื้นหลังสีดำ)
      setIsVisible(false);
      
      // รอ 2 วินาทีแล้วค่อยเล่นวิดีโออีกครั้ง
      setTimeout(() => {
        videoElement.currentTime = 0; // กลับไปที่จุดเริ่มต้นของวิดีโอ
        setIsVisible(true); // แสดงวิดีโออีกครั้ง
        
        videoElement.play().catch(error => {
          console.error("วิดีโอไม่สามารถเล่นได้:", error);
        });
      }, 500); 
    };
    
    videoElement.addEventListener('ended', handleEnded);
    
    // Cleanup function
    return () => {
      if (videoElement) {
        videoElement.removeEventListener('ended', handleEnded);
      }
    };
  }, []);
  
  return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <video 
        ref={videoRef}
        className={`h-40 object-contain ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        src="/loading.mov"
        muted
        playsInline
      />
    </div>
  );
}

export default Loading;