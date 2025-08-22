import React, { useEffect, useRef, useState } from "react";

interface ImageModalProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  src,
  alt,
  isOpen,
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPinchDistance, setInitialPinchDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  const imageRef = useRef<HTMLImageElement>(null);
  const modalRef = useRef<HTMLDialogElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Get distance between two touch points
  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(5, scale * delta));
    setScale(newScale);
  };

  // Handle mouse drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  // Handle mouse drag
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  // Handle mouse drag end
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 2) {
      // Pinch zoom
      const distance = getDistance(e.touches[0], e.touches[1]);
      setInitialPinchDistance(distance);
      setInitialScale(scale);
    } else if (e.touches.length === 1 && scale > 1) {
      // Single touch drag
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 2) {
      // Pinch zoom
      const distance = getDistance(e.touches[0], e.touches[1]);
      const newScale = Math.max(
        0.5,
        Math.min(5, initialScale * (distance / initialPinchDistance)),
      );
      setScale(newScale);
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      // Single touch drag
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    setIsDragging(false);
    setInitialPinchDistance(0);
  };

  // Handle double tap to zoom
  const handleDoubleClick = () => {
    if (scale === 1) {
      setScale(2);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  // Handle background click to close
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      onClick={handleBackgroundClick}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
        aria-label="Close image"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {/* Zoom controls */}
      <nav className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => setScale(Math.min(5, scale * 1.2))}
          className="w-10 h-10 flex items-center justify-center bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
          aria-label="Zoom in"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </button>
        <button
          onClick={() => setScale(Math.max(0.5, scale * 0.8))}
          className="w-10 h-10 flex items-center justify-center bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
          aria-label="Zoom out"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </button>
        <button
          onClick={() => {
            setScale(1);
            setPosition({ x: 0, y: 0 });
          }}
          className="w-10 h-10 flex items-center justify-center bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
          aria-label="Reset zoom"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
        </button>
      </nav>

      {/* Image container */}
      <section
        className="relative max-w-full max-h-full overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        style={{
          cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
        }}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className="block max-w-none"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: "0 0",
            transition: isDragging ? "none" : "transform 0.2s ease",
            maxWidth: scale === 1 ? "90vw" : "none",
            maxHeight: scale === 1 ? "90vh" : "none",
          }}
          draggable={false}
        />
      </section>

      {/* Instructions */}
      <article className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm text-center bg-black bg-opacity-50 px-4 py-2 rounded">
        <span className="hidden md:block">
          Scroll to zoom • Drag to pan • Double-click to toggle zoom • ESC to
          close
        </span>
        <span className="md:hidden">
          Pinch to zoom • Drag to pan • Double-tap to toggle zoom
        </span>
      </article>
    </dialog>
  );
};
