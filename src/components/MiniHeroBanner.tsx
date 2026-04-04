import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface MiniHeroBannerProps {
  /** Hero section number (1-5) */
  sectionNumber: number;
  fallbackTitle: string;
  fallbackSubtitle: string;
  fallbackBg?: string;
}

const MiniHeroBanner = ({ sectionNumber, fallbackTitle, fallbackSubtitle, fallbackBg = "bg-slate-800" }: MiniHeroBannerProps) => {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    setLoading(true);
    // Try to fetch section by section_number with type bypass for newly created table
    (supabase
      .from("hero_sections" as any)
      .select("*")
      .eq("section_number", sectionNumber)
      .maybeSingle() as any)
      .then(({ data: section, error }: any) => {
        if (error) {
          console.error(`MiniHeroBanner ${sectionNumber} - Error fetching hero_sections:`, error);
          setSlides([]);
          setLoading(false);
          return;
        }
        
        if (!section) {
          console.warn(`MiniHeroBanner ${sectionNumber} - No hero section found. Make sure you've inserted hero_sections data.`);
          setSlides([]);
          setLoading(false);
          return;
        }
        
        // Fetch slides for this section
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
            console.error(`MiniHeroBanner ${sectionNumber} - Error fetching hero slides:`, err);
            setSlides([]);
            setLoading(false);
          });
      })
      .catch((err: any) => {
        console.error(`MiniHeroBanner ${sectionNumber} - Catch error fetching hero_sections:`, err);
        setSlides([]);
        setLoading(false);
      });
  }, [sectionNumber]);

  const go = useCallback((idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current]);

  const prev = () => {
    if (slides.length > 1) go((current - 1 + slides.length) % slides.length);
  };
  const next = useCallback(() => {
    if (slides.length > 1) go((current + 1) % slides.length);
  }, [current, slides.length, go]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [slides.length, next]);

  const slide = slides[current];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <section className="relative overflow-hidden">
      <div className="px-4 sm:px-[max(1rem,calc((100vw-1400px)/2))]">
        <div className="relative overflow-hidden" style={{ height: "clamp(180px, 28vw, 300px)" }}>
          {loading ? (
            // Skeleton state
            <div className="w-full h-full bg-gradient-to-r from-slate-200 to-slate-100 animate-pulse" />
          ) : slides.length === 0 ? (
            // Empty state
            <div className="w-full h-full bg-slate-50 flex items-center justify-center border border-dashed border-border">
              <div className="text-center text-muted-foreground">
                <div className="text-sm font-semibold">No Slides Configured</div>
                <div className="text-xs mt-1">Admin can add slides for this section</div>
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
                  transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
                  className="absolute inset-0 flex"
                >
                  {/* Background */}
                  {slide.image_url ? (
                    <img src={slide.image_url} alt={slide.title} className="absolute inset-0 w-full h-full object-cover object-top" />
                  ) : (
                    <div className={`absolute inset-0 ${fallbackBg}`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col justify-center px-6 sm:px-12 lg:px-20 max-w-xl">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.35 }}
                    >
                      <span className="inline-block bg-primary text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 mb-3">
                        Special Offer
                      </span>
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight mb-2">
                        {slide.title}
                      </h2>
                      {slide.subtitle && (
                        <p className="text-xs sm:text-sm text-white/75 mb-4 leading-relaxed max-w-xs">
                          {slide.subtitle}
                        </p>
                      )}
                      {slide.cta_text && (
                        <Link
                          to={slide.cta_link || "/products"}
                          className="inline-flex items-center gap-2 bg-white text-foreground px-5 py-2.5 text-xs sm:text-sm font-semibold hover:bg-primary hover:text-white transition-colors"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          {slide.cta_text}
                        </Link>
                      )}
                    </motion.div>
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

export default MiniHeroBanner;
