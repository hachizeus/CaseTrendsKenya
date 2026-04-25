import { useRef, useEffect, useState, useCallback } from 'react';

interface UseVideoCarouselProps {
  autoplaySpeed?: number;
  pauseOnHover?: boolean;
}

export const useVideoCarousel = ({
  autoplaySpeed = 0.35,
  pauseOnHover = true,
}: UseVideoCarouselProps = {}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const pointerDown = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const moved = useRef(false);
  const rafRef = useRef<number>();

  // Smooth autoplay
  const autoScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (!isPaused && !isDragging) {
      el.scrollLeft += autoplaySpeed;

      if (el.scrollLeft >= el.scrollWidth - el.clientWidth) {
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
    setIsDragging(false);
    setIsPaused(true);

    startX.current = e.clientX;
    startScrollLeft.current = el.scrollLeft;

    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!el || !pointerDown.current) return;

    const delta = e.clientX - startX.current;

    if (Math.abs(delta) > 5) {
      moved.current = true;
      setIsDragging(true);
    }

    if (moved.current) {
      el.scrollLeft = startScrollLeft.current - delta;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!el) return;

    pointerDown.current = false;
    setIsDragging(false);
    setIsPaused(false);

    try {
      el.releasePointerCapture(e.pointerId);
    } catch {}
  };

  return {
    scrollRef,
    isDragging,
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