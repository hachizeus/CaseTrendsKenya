import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const HeroBanner = () => {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    setLoading(true);
    // Try to fetch section 1 (Main Hero) with type bypass for newly created table
    (supabase
      .from("hero_sections" as any)
      .select("*")
      .eq("section_number", 1)
      .maybeSingle() as any)
      .then(({ data: section, error }: any) => {
        if (error) {
          console.error("HeroBanner - Error fetching hero_sections:", error);
          setSlides([]);
          setLoading(false);
          return;
        }
        
        if (!section) {
          console.warn("HeroBanner - No hero section 1 found. Make sure you've inserted hero_sections data.");
          setSlides([]);
          setLoading(false);
          return;
        }
        
        supabase
          .from("hero_slides")
          .select("*")
          .eq("section_id", section.id)
          .eq("is_active", true)
          .order("display_order")
          .then(({ data }) => {
            setSlides(data || []);
            setLoading(false);
          })
          .catch((err) => {
            console.error("HeroBanner - Error fetching hero slides:", err);
            setSlides([]);
            setLoading(false);
          });
      })
      .catch((err: any) => {
        console.error("HeroBanner - Catch error fetching hero_sections:", err);
        setSlides([]);
        setLoading(false);
      });
  }, []);

  const go = useCallback((idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current]);

  const next = useCallback(() => {
    if (slides.length > 1) go((current + 1) % slides.length);
  }, [current, slides.length, go]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [slides.length, next]);

  // Skip animations on low-end devices
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const slide = slides[current];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: delay,
        duration: 0.6,
        ease: "easeOut",
      },
    }),
    exit: { opacity: 0, y: -30, transition: { duration: 0.3 } },
  };

  return (
    <section className="relative overflow-hidden bg-slate-100">
      <div className="px-4 sm:px-[max(1rem,calc((100vw-1400px)/2))]">
        <div className="relative overflow-hidden" style={{ height: "clamp(260px, 45vw, 480px)" }}>
          {loading ? (
            // Skeleton state
            <div className="w-full h-full bg-gradient-to-r from-slate-200 to-slate-100 animate-pulse" />
          ) : slides.length === 0 ? (
            // Empty state
            <div className="w-full h-full bg-slate-50 flex items-center justify-center border border-dashed border-border">
              <div className="text-center text-muted-foreground">
                <div className="text-lg font-semibold">No Hero Slides</div>
                <div className="text-xs mt-1">Add slides in Admin → Hero Slides to display here</div>
              </div>
            </div>
          ) : (
            // Carousel content
            <>
              <AnimatePresence custom={direction} mode="popLayout">
                <motion.div
                  key={slide.id}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ 
                    type: "tween", 
                    duration: prefersReducedMotion ? 0 : 0.6, 
                    ease: "easeInOut" 
                  }}
                  className="absolute inset-0 flex will-change-transform"
                >
                  {/* Background Image with loading optimization */}
                  <img
                    src={slide.image_url}
                    alt={slide.title || "Hero slide"}
                    width={1400}
                    height={480}
                    className="w-full h-full object-cover object-top"
                    loading="eager"
                    decoding="sync"
                  />
                  
                  {/* Dark Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />

                  {/* Content - Title, Subtitle, Button */}
                  <div className="absolute inset-0 flex items-center">
                    <div className="relative z-10 px-6 sm:px-12 lg:px-20 max-w-2xl">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`content-${slide.id}`}
                          variants={contentVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          custom={0.35}
                        >
                          {/* Badge */}
                          {slide.subtitle && (
                            <motion.span
                              variants={contentVariants}
                              initial="hidden"
                              animate="visible"
                              custom={0.35}
                              className="inline-block bg-primary text-white text-[10px] sm:text-xs font-bold tracking-widest uppercase px-3 sm:px-4 py-1.5 mb-3 sm:mb-4"
                            >
                              Featured
                            </motion.span>
                          )}

                          {/* Title */}
                          {slide.title && (
                            <motion.h1
                              variants={contentVariants}
                              initial="hidden"
                              animate="visible"
                              custom={0.42}
                              className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-2 sm:mb-4 max-w-lg"
                            >
                              {slide.title}
                            </motion.h1>
                          )}

                          {/* Subtitle */}
                          {slide.subtitle && (
                            <motion.p
                              variants={contentVariants}
                              initial="hidden"
                              animate="visible"
                              custom={0.50}
                              className="text-sm sm:text-base text-white/85 mb-4 sm:mb-6 leading-relaxed max-w-md"
                            >
                              {slide.subtitle}
                            </motion.p>
                          )}

                          {/* CTA Button */}
                          {slide.cta_text && (
                            <motion.div
                              variants={contentVariants}
                              initial="hidden"
                              animate="visible"
                              custom={0.58}
                            >
                              <Link
                                to={slide.cta_link || "/products"}
                                className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 sm:px-8 py-3 sm:py-4 font-bold text-sm sm:text-base hover:bg-primary hover:text-white transition-all duration-300 hover:gap-3"
                              >
                                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>{slide.cta_text}</span>
                              </Link>
                            </motion.div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Auto-rotating carousel - no controls */}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
