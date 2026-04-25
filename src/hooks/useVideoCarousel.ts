import { useRef, useEffect, useState, useCallback } from 'react';

interface UseVideoCarouselProps {
  autoplaySpeed?: number;
  pauseOnHover?: boolean;
}

export const useVideoCarousel = ({
  autoplaySpeed = 0.4,
  pauseOnHover = true,
}: UseVideoCarouselProps = {}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();

  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const pointerDown = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const moved = useRef(false);

  const isTouchDevice = () =>
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const autoScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Only scroll if not dragging and not paused
    if (!isPaused && !isDragging) {
      el.scrollLeft += autoplaySpeed;

      // Infinite loop reset: if we reach the end, jump back to start
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
        el.scrollLeft = 0;
      }
    }

    rafRef.current = requestAnimationFrame(autoScroll);
  }, [autoplaySpeed, isPaused, isDragging]);

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
    setIsPaused(true);

    startX.current = e.clientX;
    startScrollLeft.current = el.scrollLeft;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointerDown.current || !scrollRef.current) return;

    const delta = e.clientX - startX.current;

    if (Math.abs(delta) > 5) {
      moved.current = true;
      setIsDragging(true);
    }

    if (moved.current) {
      scrollRef.current.scrollLeft = startScrollLeft.current - delta;
    }
  };

  const onPointerUp = () => {
    pointerDown.current = false;
    // Delay setting isDragging to false so the click handler knows it was a drag
    setTimeout(() => setIsDragging(false), 50);
    setIsPaused(false);
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