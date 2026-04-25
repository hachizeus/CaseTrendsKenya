import { useRef, useEffect, useState, useCallback } from 'react';

interface UseVideoCarouselProps {
  autoplaySpeed?: number;
  pauseOnHover?: boolean;
  autoScrollLeft?: boolean;
}

export const useVideoCarousel = ({
  autoplaySpeed = 0.8,
  pauseOnHover = true,
  autoScrollLeft = true,
}: UseVideoCarouselProps = {}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const autoScrollDirection = useRef<'left' | 'right'>('right');
  const lastTimestamp = useRef<number>(0);

  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const pointerDown = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const moved = useRef(false);
  const dragStartTime = useRef(0);

  const isTouchDevice = () =>
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Check if we should change direction
  const checkAndChangeDirection = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isDragging) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;

    if (autoScrollLeft) {
      // Auto scroll to left by changing direction
      if (scrollLeft <= 1) {
        autoScrollDirection.current = 'right';
      } else if (scrollLeft >= maxScroll - 1) {
        autoScrollDirection.current = 'left';
      }
    } else {
      // Normal behavior - reset to start when reaching end
      if (scrollLeft >= maxScroll - 1) {
        el.scrollLeft = 0;
      }
    }
  }, [autoScrollLeft, isDragging]);

  // Smooth autoplay with direction change
  const autoScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (!isPaused && !isDragging) {
      if (autoScrollDirection.current === 'right') {
        el.scrollLeft += autoplaySpeed;
      } else {
        el.scrollLeft -= autoplaySpeed;
      }

      checkAndChangeDirection();
    }

    rafRef.current = requestAnimationFrame(autoScroll);
  }, [autoplaySpeed, isPaused, isDragging, checkAndChangeDirection]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(autoScroll);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [autoScroll]);

  // Reset auto-scroll direction after manual scroll
  const resetAutoScrollDirection = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    const isNearStart = scrollLeft < 100;
    const isNearEnd = scrollLeft > maxScroll - 100;

    if (isNearStart) {
      autoScrollDirection.current = 'right';
    } else if (isNearEnd) {
      autoScrollDirection.current = 'left';
    }
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el) return;

    const cards = el.children;
    if (cards[index]) {
      const card = cards[index] as HTMLElement;
      card.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
      
      setTimeout(resetAutoScrollDirection, 500);
    }
  }, [resetAutoScrollDirection]);

  // Touch and mouse drag handlers
  const onPointerDown = (e: React.PointerEvent) => {
    if (!isTouchDevice()) return;

    const el = scrollRef.current;
    if (!el) return;

    pointerDown.current = true;
    moved.current = false;
    setIsDragging(false);
    setIsPaused(true);
    dragStartTime.current = Date.now();

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
    
    // Small delay before resuming autoplay
    setTimeout(() => {
      setIsPaused(false);
      resetAutoScrollDirection();
    }, 100);
  };

  // Mouse wheel handler for horizontal scrolling
  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!scrollRef.current) return;
    
    const delta = e.deltaY;
    if (Math.abs(delta) > 0) {
      e.preventDefault();
      scrollRef.current.scrollLeft += delta;
      
      // Pause autoplay briefly on wheel interaction
      setIsPaused(true);
      setTimeout(() => {
        if (!isDragging) {
          setIsPaused(false);
          resetAutoScrollDirection();
        }
      }, 1000);
    }
  }, [isDragging, resetAutoScrollDirection]);

  return {
    scrollRef,
    wasDragged: () => moved.current,
    scrollToIndex,
    handlers: {
      onMouseEnter: () => pauseOnHover && setIsPaused(true),
      onMouseLeave: () => pauseOnHover && setIsPaused(false),
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onWheel,
    },
  };
};