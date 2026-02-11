import React, { useState, useRef } from 'react';

interface SwipeableItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  onClick?: () => void;
  className?: string;
}

const SwipeableItem: React.FC<SwipeableItemProps> = ({ children, onDelete, onClick, className }) => {
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  
  // Refs for gesture tracking
  const startX = useRef(0);
  const currentOffset = useRef(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwipingRef = useRef(false);

  // Constants
  const DELETE_BTN_WIDTH = 80;
  const THRESHOLD = DELETE_BTN_WIDTH / 2;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    startX.current = e.touches[0].clientX;
    currentOffset.current = offset;
    isSwipingRef.current = true;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwipingRef.current) return;

    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    
    // Calculate deltas
    const deltaX = touchX - touchStartX.current;
    const deltaY = touchY - touchStartY.current;

    // Check if scrolling vertically
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return; 
    }

    // Determine new offset
    // We want to move from currentOffset
    // But we need to clamp it. 
    // Max right is 0. Max left is -DELETE_BTN_WIDTH (or more if we want elasticity)
    
    let newOffset = currentOffset.current + deltaX;
    
    // Restriction: Cannot swipe right past 0
    if (newOffset > 0) newOffset = 0;
    
    // Restriction: Limit swipe left
    if (newOffset < -DELETE_BTN_WIDTH - 20) newOffset = -DELETE_BTN_WIDTH - 20;

    setOffset(newOffset);
  };

  const handleTouchEnd = () => {
    isSwipingRef.current = false;
    setIsSwiping(false);
    
    // Snap to position
    if (offset < -THRESHOLD) {
      setOffset(-DELETE_BTN_WIDTH);
    } else {
      setOffset(0);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setOffset(0); // Reset after delete
  };

  return (
    <div className={className} style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background Action Layer */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: '100%', // Cover full width but only right side is visible when swiped
          backgroundColor: '#ff3b30', // iOS Red
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          zIndex: 0,
        }}
      >
        <button
          onClick={handleDelete}
          style={{
            width: DELETE_BTN_WIDTH,
            height: '100%',
            border: 'none',
            background: 'transparent',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '15px',
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      </div>

      {/* Foreground Content Layer */}
      <div
        onClick={onClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
          backgroundColor: 'white', // Important to cover the background
          position: 'relative',
          zIndex: 1,
          height: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableItem;
