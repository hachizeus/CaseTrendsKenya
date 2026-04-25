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
  const isDragging = useRef(false);
  const pointerDown = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const moved = useRef(false);

  const autoScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Only auto-scroll if the user isn't interacting
    if (!isPaused && !pointerDown.current) {
      el.scrollLeft += autoplaySpeed;

      // Infinite loop reset
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
    const el = scrollRef.current;
    if (!el) return;

    pointerDown.current = true;
    moved.current = false;
    startX.current = e.clientX;
    startScrollLeft.current = el.scrollLeft;
    
    // Stop auto-scroll immediately on touch
    setIsPaused(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointerDown.current || !scrollRef.current) return;

    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 5) {
      isDragging.current = true;
      moved.current = true;
      // Manual scroll follow
      scrollRef.current.scrollLeft = startScrollLeft.current - delta;
    }
  };

  const onPointerUp = () => {
    pointerDown.current = false;
    // Resume auto-scroll after a short delay
    setTimeout(() => {
      isDragging.current = false;
      setIsPaused(false);
    }, 50);
  };

  return {
    scrollRef,
    wasDragged: () => moved.current,
    handlers: {
      onMouseEnter: () => pauseOnHover && setIsPaused(true),
      onMouseLeave: () => !pointerDown.current && pauseOnHover && setIsPaused(false),
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
};