import { useEffect, useState, useCallback, memo } from "react";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getOptimizedImageUrl } from "@/lib/imageOptimization";

interface MiniHeroBannerProps {
  sectionNumber: number;
  fallbackTitle: string;
  fallbackSubtitle: string;
  fallbackBg?: string;
}

const MiniHeroBanner = memo(({ 
  sectionNumber, 
  fallbackTitle, 
  fallbackSubtitle, 
  fallbackBg = "bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" 
}: MiniHeroBannerProps) => {
  const [slide, setSlide] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlide = async () => {
      try {
        const { data: section, error: sectionError } = await (supabase
          .from("hero_sections" as any)
          .select("*")
          .eq("section_number", sectionNumber)
          .maybeSingle() as any);
        
        if (sectionError) {
          console.error(`MiniHeroBanner ${sectionNumber} error:`, sectionError);
          setSlide(null);
          setLoading(false);
          return;
        }
        
        if (section) {
          const { data: slides } = await supabase
            .from("hero_slides")
            .select("*")
            .eq("section_id", section.id)
            .eq("is_active", true)
            .order("display_order")
            .limit(1);
          
          if (slides && slides.length > 0) {
            setSlide(slides[0]);
          }
        }
      } catch (err) {
        console.error(`MiniHeroBanner ${sectionNumber} error:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchSlide();
  }, [sectionNumber]);

  const hasSlide = slide !== null;
  const displayTitle = hasSlide ? slide.title : fallbackTitle;
  const displaySubtitle = hasSlide ? (slide.subtitle || fallbackSubtitle) : fallbackSubtitle;
  const displayCtaText = hasSlide ? slide.cta_text : "Shop Now";
  const displayCtaLink = hasSlide ? (slide.cta_link || "/products") : "/products";
  const displayImage = hasSlide ? slide.image_url : null;
  const backgroundClass = hasSlide ? "" : (fallbackBg || "bg-gradient-to-r from-primary/30 via-primary/10 to-transparent");

  if (loading) {
    return (
      <section className="relative overflow-hidden">
        <div className="px-4 sm:px-[max(1rem,calc((100vw-1400px)/2))]">
          <div className="relative overflow-hidden rounded-xl" style={{ height: "clamp(160px, 25vw, 260px)" }}>
            <div className="w-full h-full bg-[hsl(240,10%,6%)] animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden">
      <div className="px-4 sm:px-[max(1rem,calc((100vw-1400px)/2))]">
        <div className="relative overflow-hidden rounded-xl" style={{ height: "clamp(160px, 25vw, 260px)" }}>
          {/* Background Image or Fallback Gradient */}
          {displayImage ? (
            <img
              src={getOptimizedImageUrl(displayImage, {
                width: 1200,
                height: 420,
                quality: 70,
              })}
              alt={displayTitle}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className={`absolute inset-0 ${backgroundClass}`} />
          )}
          
          {/* Dark Overlay - lighter for fallback */}
          <div className={`absolute inset-0 ${displayImage ? 'bg-gradient-to-r from-black/70 via-black/40 to-transparent' : ''}`} />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center h-full px-6 sm:px-12 lg:px-20 max-w-xl">
            {/* Badge - Now with max-width and proper styling to prevent stretching */}
            <span className="inline-block bg-primary text-white text-[10px] sm:text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-2" style={{ width: 'fit-content', maxWidth: '100%' }}>
              {hasSlide ? "Special Offer" : "EXCLUSIVE DEALS"}
            </span>
            
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white leading-tight mb-1">
              {displayTitle}
            </h2>
            
            <p className="text-xs sm:text-sm text-white/75 mb-3 leading-relaxed max-w-xs">
              {displaySubtitle}
            </p>
            
            <Link
              to={displayCtaLink}
              className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-lg hover:bg-primary/80 transition-all duration-300 hover:gap-3"
              style={{ width: 'fit-content' }}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {displayCtaText}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
});

MiniHeroBanner.displayName = "MiniHeroBanner";

export default MiniHeroBanner;