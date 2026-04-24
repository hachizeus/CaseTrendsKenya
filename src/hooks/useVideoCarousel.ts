import { useRef, useEffect, useState, useCallback } from 'react';

interface UseVideoCarouselProps {
  autoplaySpeed?: number;
  pauseOnHover?: boolean;
}

export const useVideoCarousel = ({
  autoplaySpeed = 0.3, // pixels per frame (VERY smooth)
  pauseOnHover = true
}: UseVideoCarouselProps = {}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const velocity = useRef(0);
  const lastX = useRef(0);

  const animationRef = useRef<number>();

  // 🔥 Smooth RAF auto scroll (no jitter)
  const autoScroll = useCallback(() => {
    if (!scrollRef.current) return;

    if (!isPaused && !isDragging) {
      const el = scrollRef.current;

      el.scrollLeft += autoplaySpeed;

      // Infinite loop
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth) {
        el.scrollLeft = 0;
      }
    }

    animationRef.current = requestAnimationFrame(autoScroll);
  }, [isPaused, isDragging, autoplaySpeed]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(autoScroll);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [autoScroll]);

  // ------------------
  // Desktop Drag
  // ------------------
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;

    setIsDragging(true);
    setIsPaused(true);

    startX.current = e.pageX;
    scrollLeft.current = scrollRef.current.scrollLeft;
    lastX.current = e.pageX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;

    const dx = e.pageX - startX.current;
    scrollRef.current.scrollLeft = scrollLeft.current - dx;

    velocity.current = e.pageX - lastX.current;
    lastX.current = e.pageX;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsPaused(false);
  };

  // ------------------
  // Touch (FIXED)
  // ------------------
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;

    setIsDragging(true);
    setIsPaused(true);

    startX.current = e.touches[0].pageX;
    scrollLeft.current = scrollRef.current.scrollLeft;
    lastX.current = e.touches[0].pageX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;

    // ❌ DO NOT preventDefault → keeps native scrolling smooth

    const x = e.touches[0].pageX;
    const dx = x - startX.current;

    scrollRef.current.scrollLeft = scrollLeft.current - dx;

    velocity.current = x - lastX.current;
    lastX.current = x;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsPaused(false);
  };

  return {
    scrollRef,
    handlers: {
      onMouseEnter: () => pauseOnHover && setIsPaused(true),
      onMouseLeave: () => pauseOnHover && setIsPaused(false),
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeaveCapture: handleMouseUp,

      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};