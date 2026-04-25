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

  // Smooth autoplay
  const autoScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (!isPaused && !isDragging) {
      el.scrollLeft += autoplaySpeed;

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

  // Touch-only drag
  const onPointerDown = (e: React.PointerEvent) => {
    if (!isTouchDevice()) return;

    const el = scrollRef.current;
    if (!el) return;

    pointerDown.current = true;
    moved.current = false;
    setIsDragging(false);
    setIsPaused(true);

    startX.current = e.clientX;
    startScrollLeft.current = el.scrollLeft;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isTouchDevice()) return;
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
    if (!isTouchDevice()) return;

    pointerDown.current = false;
    setIsDragging(false);
    setIsPaused(false);
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