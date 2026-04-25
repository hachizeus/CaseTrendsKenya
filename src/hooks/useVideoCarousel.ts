import { useRef, useEffect, useState, useCallback } from 'react';

interface UseVideoCarouselProps {
  autoplaySpeed?: number;
  pauseOnHover?: boolean;
}

export const useVideoCarousel = ({
  autoplaySpeed = 0.6,
  pauseOnHover = true,
}: UseVideoCarouselProps = {}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const [isPaused, setIsPaused] = useState(false);
  
  // Using refs for interaction prevents unnecessary re-renders that kill the animation loop
  const isInteracting = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const moved = useRef(false);

  const autoScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Only scroll if the user is NOT touching or hovering
    if (!isPaused && !isInteracting.current) {
      el.scrollLeft += autoplaySpeed;

      // Loop back to start
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
        el.scrollLeft = 0;
      }
    }

    rafRef.current = requestAnimationFrame(autoScroll);
  }, [autoplaySpeed, isPaused]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(autoScroll);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [autoScroll]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!scrollRef.current) return;
    
    // Prevent default to avoid text selection and other browser behaviors
    e.preventDefault();
    
    isInteracting.current = true;
    moved.current = false;
    startX.current = e.clientX;
    startScrollLeft.current = scrollRef.current.scrollLeft;

    // Stop any smooth scrolling immediately
    scrollRef.current.style.scrollBehavior = 'auto';
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isInteracting.current || !scrollRef.current) return;

    // Prevent default for smoother dragging
    e.preventDefault();

    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 5) {
      moved.current = true;
      scrollRef.current.scrollLeft = startScrollLeft.current - delta;
    }
  };

  const onPointerUp = () => {
    isInteracting.current = false;
    if (scrollRef.current) {
      // Re-enable smooth behavior for manual arrow/wheel scrolls if needed
      scrollRef.current.style.scrollBehavior = 'smooth';
    }
  };

  return {
    scrollRef,
    wasDragged: () => moved.current,
    handlers: {
      onMouseEnter: () => pauseOnHover && setIsPaused(true),
      onMouseLeave: () => pauseOnHover && setIsPaused(false),
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
};