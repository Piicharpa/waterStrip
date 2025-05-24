import React, { useState, useRef, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { FaArrowsRotate } from "react-icons/fa6";
import { MdOutlineGridOn } from "react-icons/md";
import { HiZoomIn, HiZoomOut } from "react-icons/hi";
import { Crop, Check, AlertTriangle } from "lucide-react";

interface ImageEditorProps {
  imageUrl: string;
  onClose: () => void;
  onSave: (editedImageDataUrl: string) => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({
  imageUrl,
  onClose,
  onSave,
}) => {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cornerPoints, setCornerPoints] = useState([
    { x: 20, y: 20 },
    { x: 280, y: 20 },
    { x: 280, y: 180 },
    { x: 20, y: 180 },
  ]);
  const [activeCorner, setActiveCorner] = useState<number | null>(null);
  const [mode, setMode] = useState("transform"); // transform or crop
  const [showGrid, setShowGrid] = useState(true); // Add grid state
  const [validationError, setValidationError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [showTooltip, setShowTooltip] = useState(false);

  // Load and draw image
  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      imgRef.current = img;

      // Initialize canvas size based on image
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        // const ctx = canvas.getContext("2d");

        // Set initial corner points based on canvas size
        setCornerPoints([
          { x: canvas.width * 0.25, y: canvas.height * 0.25 },
          { x: canvas.width * 0.75, y: canvas.height * 0.25 },
          { x: canvas.width * 0.75, y: canvas.height * 0.75 },
          { x: canvas.width * 0.25, y: canvas.height * 0.75 },
        ]);

        drawImage();
      }
    };
  }, [imageUrl]);

  // Redraw when transform parameters change
  useEffect(() => {
    if (imgRef.current) {
      drawImage();
    }
  }, [rotation, scale, position, cornerPoints, mode, showGrid, validationError]);

  const drawImage = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx || !imgRef.current) return;

    const img = imgRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Move to center, rotate, scale, then move back
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(
      -img.width / 2 + position.x / scale,
      -img.height / 2 + position.y / scale
    );

    // Draw image
    ctx.drawImage(img, 0, 0);

    // Restore context state
    ctx.restore();

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, canvas.width, canvas.height);
    }

    // Draw crop area if in crop mode
    if (mode === "crop") {
      // Draw semi-transparent overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw crop area
      ctx.beginPath();
      ctx.moveTo(cornerPoints[0].x, cornerPoints[0].y);
      cornerPoints.forEach((_, i) => {
        const nextPoint = cornerPoints[(i + 1) % 4];
        ctx.lineTo(nextPoint.x, nextPoint.y);
      });
      ctx.closePath();

      // Create clipping path and clear the crop area
      ctx.save();
      ctx.clip();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Redraw the image in the clipped area
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);
      ctx.translate(
        -img.width / 2 + position.x / scale,
        -img.height / 2 + position.y / scale
      );
      ctx.drawImage(img, 0, 0);

      // Draw grid inside crop area if enabled
      if (showGrid) {
        drawGrid(ctx, canvas.width, canvas.height);
      }

      ctx.restore();

      // Draw corner handles
      cornerPoints.forEach((point, _) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw lines connecting corners
      ctx.beginPath();
      ctx.moveTo(cornerPoints[0].x, cornerPoints[0].y);
      cornerPoints.forEach((_, i) => {
        const nextPoint = cornerPoints[(i + 1) % 4];
        ctx.lineTo(nextPoint.x, nextPoint.y);
      });
      ctx.closePath();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  // Function to draw 3x3 grid
  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 1;

    // Draw vertical lines for 3x3 grid (dividing into 3 equal parts)
    const cellWidth = width / 3;
    for (let i = 1; i < 3; i++) {
      const x = cellWidth * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw horizontal lines for 3x3 grid (dividing into 3 equal parts)
    const cellHeight = height / 3;
    for (let i = 1; i < 3; i++) {
      const y = cellHeight * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === "crop") {
      // Check if we're clicking on a corner point
      for (let i = 0; i < cornerPoints.length; i++) {
        const point = cornerPoints[i];
        const dx = point.x - x;
        const dy = point.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 10) {
          setActiveCorner(i);
          return;
        }
      }
    }

    // Otherwise start dragging the image
    setIsDragging(true);
    setDragStart({ x, y });
  };

  // Modified to make image movement after rotation more stable
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging && activeCorner === null) return;
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeCorner !== null) {
      // Update corner position
      const newCornerPoints = [...cornerPoints];
      newCornerPoints[activeCorner] = { x, y };
      setCornerPoints(newCornerPoints);
      
      // Clear any validation errors when adjusting corners
      if (validationError) setValidationError(null);
    } else if (isDragging) {
      // Calculate movement considering rotation
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      // Transform movement according to rotation
      const radians = (rotation * Math.PI) / 180;
      const adjustedDx = dx * Math.cos(radians) + dy * Math.sin(radians);
      const adjustedDy = -dx * Math.sin(radians) + dy * Math.cos(radians);

      setPosition({
        x: position.x + adjustedDx,
        y: position.y + adjustedDy,
      });

      setDragStart({ x, y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setActiveCorner(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale(Math.max(0.1, scale * scaleFactor));
  };

  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRotation(parseInt(e.target.value, 10));
    // Clear any validation errors when adjusting rotation
    if (validationError) setValidationError(null);
  };

  // Function to check if the shape is a horizontal rectangle
  const isHorizontalRectangle = (): boolean => {
    if (mode !== "crop") return true; // Only validate in crop mode
    
    // Sort points by y-coordinate to identify top and bottom pairs
    const sortedByY = [...cornerPoints].sort((a, b) => a.y - b.y);
    
    // Top two points and bottom two points
    const topPoints = sortedByY.slice(0, 2);
    const bottomPoints = sortedByY.slice(2, 4);
    
    // Sort top points by x-coordinate
    topPoints.sort((a, b) => a.x - b.x);
    // Sort bottom points by x-coordinate
    bottomPoints.sort((a, b) => a.x - b.x);
    
    // Check if the shape is approximately a rectangle
    const topWidth = Math.abs(topPoints[1].x - topPoints[0].x);
    const bottomWidth = Math.abs(bottomPoints[1].x - bottomPoints[0].x);
    const leftHeight = Math.abs(bottomPoints[0].y - topPoints[0].y);
    const rightHeight = Math.abs(bottomPoints[1].y - topPoints[1].y);
    
    // Calculate aspect ratio (width to height)
    const avgWidth = (topWidth + bottomWidth) / 2;
    const avgHeight = (leftHeight + rightHeight) / 2;
    const aspectRatio = avgWidth / avgHeight;
    
    // Check if sides are roughly parallel (allowing for some tolerance)
    const isRoughlyRectangular = 
      Math.abs(topWidth - bottomWidth) < 20 && 
      Math.abs(leftHeight - rightHeight) < 20;
    
    // Check if it's horizontal (width > height)
    const isHorizontal = aspectRatio > 1;
    
    return isRoughlyRectangular && isHorizontal;
  };

  const handleSave = () => {
    if (!canvasRef.current || !imgRef.current) return;

    // Validate shape before saving
    if (!isHorizontalRectangle()) {
      setValidationError("Please adjust to form a horizontal rectangle before saving.");
      return;
    }

    // Create a fresh canvas for the final image without overlays
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (mode === "crop") {
      // For perspective crop, we would need more complex transformations
      // For simplicity, we'll do a rectangular crop based on the bounding box
      const minX = Math.min(...cornerPoints.map((p) => p.x));
      const maxX = Math.max(...cornerPoints.map((p) => p.x));
      const minY = Math.min(...cornerPoints.map((p) => p.y));
      const maxY = Math.max(...cornerPoints.map((p) => p.y));

      const width = maxX - minX;
      const height = maxY - minY;

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Create a temporary canvas to render the image without overlays
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvasRef.current.width;
      tempCanvas.height = canvasRef.current.height;
      const tempCtx = tempCanvas.getContext("2d");

      if (tempCtx) {
        // Draw only the image with transformations (no overlay, no grid)
        tempCtx.save();
        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        tempCtx.rotate((rotation * Math.PI) / 180);
        tempCtx.scale(scale, scale);
        tempCtx.translate(
          -imgRef.current.width / 2 + position.x / scale,
          -imgRef.current.height / 2 + position.y / scale
        );
        tempCtx.drawImage(imgRef.current, 0, 0);
        tempCtx.restore();

        // Now crop from this clean canvas
        ctx.drawImage(
          tempCanvas,
          minX,
          minY,
          width,
          height,
          0,
          0,
          width,
          height
        );
      }
    } else {
      // Just use the current transform without overlays
      canvas.width = canvasRef.current.width;
      canvas.height = canvasRef.current.height;

      // Draw only the image with transformations (no grid)
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);
      ctx.translate(
        -imgRef.current.width / 2 + position.x / scale,
        -imgRef.current.height / 2 + position.y / scale
      );
      ctx.drawImage(imgRef.current, 0, 0);
      ctx.restore();
    }

    const dataUrl = canvas.toDataURL("image/jpeg");
    setValidationError(null);
    onSave(dataUrl);
  };

  const switchMode = () => {
    setMode(mode === "transform" ? "crop" : "transform");
    setValidationError(null);

    // Reset corner points when switching to crop mode
    if (mode === "transform" && canvasRef.current) {
      const canvas = canvasRef.current;
      setCornerPoints([
        { x: canvas.width * 0.25, y: canvas.height * 0.25 },
        { x: canvas.width * 0.75, y: canvas.height * 0.25 },
        { x: canvas.width * 0.75, y: canvas.height * 0.75 },
        { x: canvas.width * 0.25, y: canvas.height * 0.75 },
      ]);
    }
  };

  const toggleGrid = () => {
    setShowGrid(!showGrid);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div
        ref={containerRef}
        className="bg-white rounded-lg p-6 flex flex-col max-w-4xl w-full max-h-full"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col relative group">
            <h2 className="text-xl font-bold">Edit Image</h2>
            <h2 className="text-base">
              Rotate the image so the strip's top edge is on the left, then crop
              by placing circles at each corner as{" "}
              <span
                className="relative cursor-pointer text-black underline"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                example
                {showTooltip && (
                  <div className="absolute z-10 left-0 -bottom-32 w-64">
                    <div className="bg-white p-1.5 rounded-md shadow-lg border border-gray-300">
                      <img
                        src="/image/examplepic.png"
                        alt="Example crop"
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </span>
            </h2>
          </div>

          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Canvas container */}
        <div
          className="relative flex-grow overflow-hidden bg-gray-100 rounded-lg"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="max-w-full max-h-full mx-auto"
          />
        </div>

        {/* Validation error message */}
        {validationError && (
          <div className="mt-4 flex items-center text-red-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Controls */}
        <div className="mt-4 flex flex-col gap-4">
          {/* Rotation control */}
          <div className="flex items-center gap-2.5">
            <FaArrowsRotate className="text-black" />
            <input
              type="range"
              min="-360"
              max="360"
              value={rotation}
              onChange={handleRotationChange}
              className="flex-grow"
            />
            <span className="w-12 text-center">{rotation}°</span>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <HiZoomOut className="text-black text-xl" />
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-grow"
            />
            <HiZoomIn className="text-black text-xl" />
            <span className="w-12 text-center">{Math.round(scale * 100)}%</span>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  mode === "crop"
                    ? "bg-gray-300 text-black"
                    : "bg-gray-100 text-black"
                }`}
                onClick={switchMode}
              >
                <Crop className="w-4" strokeWidth={2.2} />{" "}
                {mode === "crop" ? "Crop" : "Crop"}
              </button>

              <button
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  showGrid
                    ? "bg-gray-300 text-black"
                    : "bg-gray-100 text-black"
                }`}
                onClick={toggleGrid}
              >
                <MdOutlineGridOn />
                Grid
              </button>
            </div>

            <button
              className="px-4 py-2 bg-black text-white rounded-lg flex items-center gap-2"
              onClick={handleSave}
            >
              <Check className="text-xs" strokeWidth={2} /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;