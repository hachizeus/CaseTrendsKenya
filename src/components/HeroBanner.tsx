import { useEffect, useState, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Award, Truck, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getOptimizedImageUrl } from "@/lib/imageOptimization";

const HeroBanner = memo(() => {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const { data: section } = await (supabase
          .from("hero_sections" as any)
          .select("*")
          .eq("section_number", 1)
          .maybeSingle() as any);
        
        if (section) {
          const { data } = await supabase
            .from("hero_slides" as any)
            .select("*")
            .eq("section_id", section.id)
            .eq("is_active", true)
            .order("display_order");
          
          setSlides(data || []);
        }
      } catch (err) {
        console.error("HeroBanner error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSlides();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[current];

  if (loading || !slide) {
    return (
      <div className="w-full h-[400px] sm:h-[450px] md:h-[500px] lg:h-[550px] bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,6%)] animate-pulse" />
    );
  }

  // Determine if on mobile for responsive adjustments
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <section className="relative w-full overflow-hidden bg-[hsl(240,10%,3.9%)]">
      {/* Fixed aspect ratio container - maintains same proportions on all devices */}
      <div className="relative w-full aspect-[21/9] md:aspect-[21/8] lg:aspect-[21/7]">
        
        {/* Background Image Container */}
        <div className="absolute inset-0 w-full h-full">
          <picture className="w-full h-full">
            <source 
              media="(max-width: 640px)" 
              srcSet={getOptimizedImageUrl(slide.image_url, { width: 750, height: 320, quality: 85, resize: "contain" })}
            />
            <source 
              media="(max-width: 1024px)" 
              srcSet={getOptimizedImageUrl(slide.image_url, { width: 1024, height: 450, quality: 85, resize: "contain" })}
            />
            <img
              src={getOptimizedImageUrl(slide.image_url, { width: 1920, height: 650, quality: 90, resize: "contain" })}
              alt={slide.title || "Hero slide"}
              className="w-full h-full object-contain object-center md:object-cover"
              loading="eager"
              fetchPriority="high"
            />
          </picture>
        </div>
        
        {/* Dark overlay - more opaque on mobile for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/70 md:via-black/40 md:to-black/60" />
        
        {/* Hot pink glow effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(236,72,153,0.15),transparent_70%)]" />

        {/* Content Layer - Same structure on all devices */}
        <div className="absolute inset-0 flex flex-col justify-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-20">
            {/* Responsive max-width that scales proportionally */}
            <div className="max-w-full sm:max-w-md md:max-w-lg lg:max-w-2xl">
              
              {/* Title - Scales proportionally */}
              <h1 className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.2] sm:leading-[1.1] mb-2 sm:mb-3 md:mb-4 tracking-tight">
                {slide.title ? (
                  <span dangerouslySetInnerHTML={{ __html: slide.title }} />
                ) : (
                  <>
                    Stylish <span className="text-[#ec4899]">Protection.</span>
                    <br className="hidden xs:block" />
                    <span>Everyday Essentials.</span>
                  </>
                )}
              </h1>
              
              {/* Description - Proportional scaling */}
              <p className="text-xs xs:text-sm sm:text-base md:text-lg text-white/80 mb-3 sm:mb-4 md:mb-5 lg:mb-6 max-w-full sm:max-w-md leading-relaxed">
                {slide.description || "Premium phone accessories crafted for style, quality and durability."}
              </p>
              
              {/* CTA Button - Proportional sizing */}
              <Link
                to={slide.cta_link || "/products"}
                className="group inline-flex items-center gap-1.5 xs:gap-2 sm:gap-3 bg-[#ec4899] hover:bg-[#db2777] text-white px-4 xs:px-5 sm:px-6 md:px-8 py-2 xs:py-2.5 sm:py-3 md:py-4 rounded-xl font-bold text-xs xs:text-sm sm:text-base transition-all duration-300 shadow-lg shadow-[#ec4899]/20"
              >
                <span>{slide.cta_text || "Shop Now"}</span>
                <ArrowRight className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
              </Link>

              {/* Feature Icons - Same structure, responsive text */}
              <div className="flex flex-wrap mt-4 xs:mt-5 sm:mt-6 md:mt-8 lg:mt-10 pt-3 xs:pt-4 sm:pt-5 md:pt-6 border-t border-white/10 gap-3 xs:gap-4 sm:gap-6 md:gap-8">
                <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3">
                  <Award className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-[#ec4899]" />
                  <div>
                    <div className="text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-wider text-white font-bold">Top Quality</div>
                    <div className="text-[7px] xs:text-[8px] sm:text-[9px] text-white/40">Products</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3">
                  <Truck className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-[#ec4899]" />
                  <div>
                    <div className="text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-wider text-white font-bold">Fast & Reliable</div>
                    <div className="text-[7px] xs:text-[8px] sm:text-[9px] text-white/40">Delivery</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3">
                  <ShieldCheck className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-[#ec4899]" />
                  <div>
                    <div className="text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-wider text-white font-bold">Secure</div>
                    <div className="text-[7px] xs:text-[8px] sm:text-[9px] text-white/40">Payments</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide Indicators - Consistent positioning */}
        {slides.length > 1 && (
          <div className="absolute bottom-3 xs:bottom-4 sm:bottom-6 md:bottom-8 right-3 xs:right-4 sm:right-6 md:right-8 lg:right-12 flex gap-1.5 sm:gap-2 z-20">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === current 
                    ? "w-5 xs:w-6 sm:w-8 h-1 bg-[#ec4899]" 
                    : "w-1.5 h-1 bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

HeroBanner.displayName = "HeroBanner";
export default HeroBanner;