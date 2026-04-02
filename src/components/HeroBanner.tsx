import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import heroBannerFallback from "@/assets/hero-banner.jpg";

const HeroBanner = () => {
  const [slides, setSlides] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("hero_slides").select("*").eq("is_active", true).order("display_order");
      setSlides(data || []);
    };
    load();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setCurrent(c => (c + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Fallback to static banner if no slides
  if (slides.length === 0) {
    return (
      <section className="relative overflow-hidden">
        <div className="relative w-full h-[200px] sm:h-[300px] md:h-[380px]">
          <img src={heroBannerFallback} alt="Latest smartphones" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-foreground/20 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="container">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md text-primary-foreground">
                <span className="inline-block bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full mb-3">🔥 HOT DEALS</span>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-2">Latest Smartphones at Unbeatable Prices</h1>
                <p className="text-sm sm:text-base opacity-90 mb-4">Free delivery across Nairobi. Genuine products with warranty.</p>
                <a href="#products" className="inline-block bg-accent text-accent-foreground px-6 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">Shop Now</a>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const slide = slides[current];

  return (
    <section className="relative overflow-hidden">
      <div className="relative w-full h-[200px] sm:h-[300px] md:h-[380px]">
        <AnimatePresence mode="wait">
          <motion.img
            key={slide.id}
            src={slide.image_url}
            alt={slide.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full object-cover absolute inset-0"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-foreground/20 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="container">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="max-w-md text-primary-foreground"
              >
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-2">{slide.title}</h1>
                {slide.subtitle && <p className="text-sm sm:text-base opacity-90 mb-4">{slide.subtitle}</p>}
                {slide.cta_text && (
                  <a href={slide.cta_link || "#products"} className="inline-block bg-accent text-accent-foreground px-6 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
                    {slide.cta_text}
                  </a>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button onClick={() => setCurrent(c => (c - 1 + slides.length) % slides.length)} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-card/80 rounded-full shadow-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrent(c => (c + 1) % slides.length)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-card/80 rounded-full shadow-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {slides.map((_: any, i: number) => (
                <button key={i} onClick={() => setCurrent(i)} className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-primary-foreground" : "bg-primary-foreground/40"}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default HeroBanner;
