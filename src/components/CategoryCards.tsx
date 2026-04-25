// @ts-nocheck
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { MAIN_CATEGORIES } from "@/lib/categoryData";
import { motion } from "framer-motion";

// Category Image Mapping
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
  "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=300&q=80";

const CategoryCards = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const moved = useRef(false);

  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Duplicate items for seamless infinite scroll
  const scrollItems = useMemo(() => [...MAIN_CATEGORIES, ...MAIN_CATEGORIES], []);

  const autoplaySpeed = isMobile ? 0.45 : 0.6;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const autoScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (!isPaused && !isDragging.current) {
      el.scrollLeft += autoplaySpeed;

      // seamless reset at midpoint
      if (el.scrollLeft >= el.scrollWidth / 2) {
        el.scrollLeft = 0;
      }
    }

    rafRef.current = requestAnimationFrame(autoScroll);
  }, [isPaused, autoplaySpeed]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(autoScroll);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [autoScroll]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!scrollRef.current) return;

    isDragging.current = true;
    moved.current = false;
    startX.current = e.clientX;
    startScrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.scrollBehavior = "auto";
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !scrollRef.current) return;

    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 4) {
      moved.current = true;
      scrollRef.current.scrollLeft = startScrollLeft.current - delta;
    }
  };

  const onPointerUp = () => {
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.scrollBehavior = "smooth";
    }
  };

  return (
    <section className="py-6 sm:py-10 border-b border-white/5 bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)] overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
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

      <div className="relative w-full">
        <div
          ref={scrollRef}
          onMouseEnter={() => !isMobile && setIsPaused(true)}
          onMouseLeave={() => !isMobile && setIsPaused(false)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="overflow-x-auto whitespace-nowrap no-scrollbar cursor-grab active:cursor-grabbing"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-x",
          }}
        >
          <div className="inline-flex items-start gap-3 sm:gap-5 md:gap-8 px-4">
            {scrollItems.map((cat, i) => (
              <Link
                key={`${cat.slug}-${i}`}
                to={`/products?category=${encodeURIComponent(cat.slug)}`}
                draggable={false}
                onClick={(e) => moved.current && e.preventDefault()}
                className="flex flex-col items-center justify-start flex-shrink-0 w-[78px] xs:w-[90px] sm:w-[110px] md:w-[130px] group/card"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  className="w-[68px] h-[68px] xs:w-[78px] xs:h-[78px] sm:w-[96px] sm:h-[96px] md:w-[118px] md:h-[118px] rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-[hsl(240,10%,8%)] to-[hsl(240,10%,6%)] shadow-lg shadow-black/20 group-hover/card:border-primary/50 group-hover/card:shadow-primary/10 transition-all duration-300"
                >
                  <img
                    src={getImage(cat.name)}
                    alt={cat.name}
                    draggable={false}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500"
                  />
                </motion.div>

                <div className="mt-2 sm:mt-3 px-1 text-center min-h-[34px] sm:min-h-[40px] flex items-start justify-center">
                  <p className="text-[9px] xs:text-[10px] sm:text-[11px] md:text-xs font-semibold text-white/80 uppercase tracking-wide leading-tight group-hover/card:text-primary transition-colors whitespace-normal break-words">
                    {cat.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Gradient fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-16 bg-gradient-to-r from-[hsl(240,10%,3.9%)] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-16 bg-gradient-to-l from-[hsl(240,10%,3.9%)] to-transparent z-10" />
      </div>

      <p className="text-white/40 text-[10px] xs:text-xs text-center mt-3 md:hidden px-4">
        ← Swipe to explore more categories →
      </p>
    </section>
  );
};

export default CategoryCards;