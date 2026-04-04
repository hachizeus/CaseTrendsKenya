import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

// Real-life category images from Unsplash (free, no auth needed)
const categoryImages: Record<string, string> = {
  smartphones:    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=160&q=80",
  "smart phones": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=160&q=80",
  phones:         "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=160&q=80",
  tablets:        "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=160&q=80",
  "tablets & ipads": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=160&q=80",
  ipads:          "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=160&q=80",
  laptops:        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=160&q=80",
  headphones:     "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=160&q=80",
  "audio & earbuds": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=160&q=80",
  earbuds:        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=160&q=80",
  audio:          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=160&q=80",
  smartwatches:   "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160&q=80",
  wearables:      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160&q=80",
  watches:        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160&q=80",
  gaming:         "https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=160&q=80",
  cameras:        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=160&q=80",
  camera:         "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=160&q=80",
  speakers:       "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=160&q=80",
  speaker:        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=160&q=80",
  accessories:    "https://images.unsplash.com/photo-1625772452859-1c03d884dcd7?w=160&q=80",
  "streaming devices": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=160&q=80",
  tv:             "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=160&q=80",
  televisions:    "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=160&q=80",
};

const getImage = (name: string) =>
  categoryImages[name.toLowerCase()] ||
  `https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=160&q=80`;

const ITEM_WIDTH = 112; // px — w-28

const CategoryCards = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shouldMarquee, setShouldMarquee] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("categories").select("*").eq("is_active", true).order("display_order")
      .then(({ data }) => { setCategories(data || []); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!containerRef.current || categories.length === 0) return;
    const totalWidth = categories.length * (ITEM_WIDTH + 16); // gap-4 = 16px
    setShouldMarquee(totalWidth > containerRef.current.offsetWidth);
  }, [categories]);

  if (loading) {
    return (
      <section className="py-8 sm:py-10 border-b border-border bg-white overflow-hidden">
        <div className="container mb-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="px-4 sm:px-[max(1rem,calc((100vw-1400px)/2))] flex gap-4">
          {Array(6).fill(null).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2.5 flex-shrink-0 w-24 sm:w-28">
              <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  const items = shouldMarquee ? [...categories, ...categories] : categories;

  return (
    <section className="py-8 sm:py-10 border-b border-border bg-white overflow-hidden">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base sm:text-lg font-bold tracking-tight">Our Top Categories</h2>
          <Link to="/products" className="text-xs text-primary font-medium hover:underline">View All →</Link>
        </div>
      </div>

      <div ref={containerRef} className="relative overflow-hidden">
        <div
          className={`flex gap-4 px-4 sm:px-[max(1rem,calc((100vw-1400px)/2))] ${
            shouldMarquee ? "animate-marquee" : "justify-between"
          }`}
          style={shouldMarquee ? { width: "max-content" } : {}}
        >
          {items.map((cat, i) => (
            <Link
              key={`${cat.id}-${i}`}
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              className="group flex flex-col items-center gap-2.5 flex-shrink-0 w-24 sm:w-28"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 border border-border bg-secondary overflow-hidden group-hover:border-primary transition-colors duration-200">
                <img
                  src={getImage(cat.name)}
                  alt={cat.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="text-center">
                <p className="text-[11px] sm:text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                  {cat.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryCards;
