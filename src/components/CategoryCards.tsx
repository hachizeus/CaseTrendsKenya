// @ts-nocheck
import { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { MAIN_CATEGORIES } from "@/lib/categoryData";
import { motion } from "framer-motion";

// Category Image Mapping using local images from public folder
const categoryImages: Record<string, string> = {
  protectors: "/Iphonescreenprotectors.webp",
  "phone cases": "/covers.jpg",
  "android phones (protectors)": "/androidscreenprotector.jpg",
  "iphone model (protectors)": "/Iphonescreenprotectors.webp",
  audio: "/Audio.png",
  "smart watch": "/smartwatch.jpg",
  "charging devices": "/charging-devices.jpg",
  "power banks": "/powerbanks.png",
  "camera lens protectors": "/cameralens.jpg",
  accessories: "/Accessories.jpg",
  "phone holders": "/phone-holder.webp",
  gaming: "https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=300&q=80",
  "magsafe cases": "/covers.jpg",
  stickers: "/Accessories.jpg",
  smartphones: "/Accessories.jpg",
  "smart phones": "/Accessories.jpg",
  phones: "/Accessories.jpg",
  cases: "/covers.jpg",
  "screen protectors": "/androidscreenprotector.jpg",
  tablets: "/Accessories.jpg",
  "tablets & ipads": "/Accessories.jpg",
  ipads: "/Accessories.jpg",
  headphones: "/Audio.png",
  earbuds: "/Audio.png",
  "audio & earbuds": "/Audio.png",
  chargers: "/charging-devices.jpg",
  "phone accessories": "/Accessories.jpg",
  smartwatches: "/smartwatch.jpg",
  wearables: "/smartwatch.jpg",
  watches: "/smartwatch.jpg",
  cameras: "/cameralens.jpg",
  speakers: "/Audio.png",
};

const getImage = (name: string) =>
  categoryImages[name.toLowerCase()] ||
  `https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=300&q=80`;

const CategoryCards = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const [isPaused, setIsPaused] = useState(false);
  const isInteracting = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const moved = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Different speed for mobile vs desktop
  const autoplaySpeed = isMobile ? 0.8 : 0.5;

  // Duplicating the array to ensure seamless loop (only once for performance)
  const scrollItems = MAIN_CATEGORIES;

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const autoScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (!isPaused && !isInteracting.current) {
      el.scrollLeft += autoplaySpeed;

      // Reset to beginning when reaching the end
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
    
    // Don't prevent default on mobile to allow native scrolling
    if (!isMobile) {
      e.preventDefault();
    }
    
    isInteracting.current = true;
    moved.current = false;
    startX.current = e.clientX;
    startScrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.scrollBehavior = 'auto';
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isInteracting.current || !scrollRef.current) return;
    
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 5) {
      moved.current = true;
      scrollRef.current.scrollLeft = startScrollLeft.current - delta;
    }
  };

  const onPointerUp = () => {
    isInteracting.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.scrollBehavior = 'smooth';
    }
  };

  const wasDragged = () => moved.current;

  return (
    <section className="py-6 sm:py-10 border-b border-white/5 bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)] overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
            Shop by Category
          </h2>
          <Link 
            to="/products" 
            className="text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-all duration-300 hover:gap-2 flex items-center gap-1 group"
          >
            View All Categories 
            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
          </Link>
        </div>
      </div>

      {/* Auto-scrolling Container */}
      <div className="relative w-full">
        <div 
          ref={scrollRef}
          onMouseEnter={() => !isMobile && setIsPaused(true)}
          onMouseLeave={() => !isMobile && setIsPaused(false)}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
          onPointerDown={!isMobile ? onPointerDown : undefined}
          onPointerMove={!isMobile ? onPointerMove : undefined}
          onPointerUp={!isMobile ? onPointerUp : undefined}
          className={`overflow-x-auto whitespace-nowrap relative ${!isMobile ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="inline-flex gap-3 sm:gap-6 md:gap-10 px-4">
            {scrollItems.map((cat, i) => (
              <Link
                key={`${cat.slug}-${i}`}
                to={`/products?category=${encodeURIComponent(cat.slug)}`}
                className="flex flex-col items-center gap-2 sm:gap-3 flex-shrink-0 w-20 xs:w-24 sm:w-28 md:w-36 group/card"
                onClick={(e) => {
                  if (wasDragged()) {
                    e.preventDefault();
                  }
                }}
              >
                <motion.div 
                  className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-br from-[hsl(240,10%,8%)] to-[hsl(240,10%,6%)] overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 group-hover/card:border-primary/50 transition-all duration-300 shadow-lg shadow-black/20 group-hover/card:shadow-primary/10 group-hover/card:-translate-y-1"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    src={getImage(cat.name)}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500"
                    loading="lazy"
                    draggable={false}
                  />
                </motion.div>
                <div className="text-center px-1 sm:px-2">
                  <p className="text-[9px] xs:text-[10px] sm:text-[11px] md:text-xs font-semibold text-white/80 uppercase tracking-wider leading-tight group-hover/card:text-primary transition-colors break-words max-w-[80px] xs:max-w-[90px] sm:max-w-[100px] md:max-w-none">
                    {cat.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Gradient Fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-20 bg-gradient-to-r from-[hsl(240,10%,3.9%)] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-20 bg-gradient-to-l from-[hsl(240,10%,3.9%)] to-transparent z-10" />
      </div>
      
      {/* Mobile hint text */}
      <p className="text-white/40 text-[10px] xs:text-xs text-center mt-3 md:hidden px-4">
        ← Drag to explore more categories →
      </p>
    </section>
  );
};

export default CategoryCards;