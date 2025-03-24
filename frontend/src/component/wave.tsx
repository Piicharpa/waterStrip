import React, { useEffect, useRef, useState } from 'react';

interface WaveProps {
  lineCount?: number;
  lineWeight?: number;
  lineColor?: string;
  waveSpeed?: number;
  waveHeight?: number;
}

const Wave: React.FC<WaveProps> = ({
  lineCount = 40,
  lineWeight = 10,
  lineColor = '#000',
  waveSpeed = 1,
  waveHeight = 50,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Update container width when window resizes
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    // Initial width
    updateWidth();
    
    // Add resize listener
    window.addEventListener('resize', updateWidth);
    
    // Clean up
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    if (!containerWidth) return;
    
    // Calculate spacing based on container width
    const spacing = containerWidth / lineCount;
    
    const container = containerRef.current;
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create a style element for the pointed line style
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .pointed-line {
        position: absolute;
        bottom: 0;
        width: ${lineWeight}px;
        background-color: ${lineColor};
        transform-origin: bottom center;
        clip-path: polygon(0% 0%, 100% 0%, 50% 100%);
      }
    `;
    container.appendChild(styleElement);
    
    // Create lines with pointed bottoms
    const lines = Array.from({ length: lineCount }).map((_, index) => {
      const line = document.createElement('div');
      line.classList.add('pointed-line');
      line.style.left = `${index * spacing}px`;
      line.style.height = '100px';
      return line;
    });
    
    // Add lines to container
    lines.forEach(line => container.appendChild(line));
    
    // Animation function
    const animate = () => {
      lines.forEach((line, index) => {
        const time = Date.now() / (1000 / waveSpeed);
        const offset = index / lineCount * Math.PI * 2;
        const height = 100 + Math.sin(time + offset) * waveHeight;
        line.style.height = `${height}px`;
      });
      requestAnimationFrame(animate);
    };
    
    const animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [lineCount, lineWeight, lineColor, waveSpeed, waveHeight, containerWidth]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 13,
        right: 0,
        width: '100%',
        height: 200,
        overflow: 'hidden',
        background: 'transparent'
      }}
    />
  );
};

export default Wave;