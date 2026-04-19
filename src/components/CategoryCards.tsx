import { Link } from "react-router-dom";
import { MAIN_CATEGORIES } from "@/lib/categoryData";

// Enhanced Image Mapping with high-quality Unsplash URLs
const categoryImages: Record<string, string> = {
  smartphones: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80",
  "smart phones": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80",
  phones: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300&q=80",
  "phone cases": "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=300&q=80",
  cases: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=300&q=80",
  protectors: "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=300&q=80",
  "screen protectors": "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=300&q=80",
  tablets: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&q=80",
  "tablets & ipads": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&q=80",
  ipads: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&q=80",
  headphones: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80",
  earbuds: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80",
  "audio & earbuds": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80",
  audio: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80",
  chargers: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&q=80",
  "phone accessories": "https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?w=300&q=80",
  accessories: "https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?w=300&q=80",
  "phone holders": "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=300&q=80",
  "power banks": "https://images.unsplash.com/photo-1609592424083-057d4f9f4a9b?w=300&q=80",
  // Fixed Smartwatch image
  smartwatches: "https://images.unsplash.com/photo-1508685096489-7aac2968395d?w=300&q=80",
  wearables: "https://images.unsplash.com/photo-1508685096489-7aac2968395d?w=300&q=80",
  watches: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80",
  gaming: "https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=300&q=80",
  cameras: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&q=80",
  speakers: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&q=80",
};

const getImage = (name: string) =>
  categoryImages[name.toLowerCase()] ||
  `https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=300&q=80`;

const CategoryCards = () => {
  // Duplicating the array to ensure the loop is seamless
  const scrollItems = [...MAIN_CATEGORIES, ...MAIN_CATEGORIES];

  return (
    <section className="py-8 sm:py-10 border-b border-border bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Shop by Category
          </h2>
          <Link 
            to="/products" 
            className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            View All Categories →
          </Link>
        </div>
      </div>

      {/* Marquee Container */}
      <div className="relative w-full overflow-hidden group">
        <div className="animate-marquee flex gap-6 sm:gap-10 py-4 scrollbar-hide">
          {scrollItems.map((cat, i) => (
            <Link
              key={`${cat.slug}-${i}`}
              to={`/products?category=${encodeURIComponent(cat.slug)}`}
              className="flex flex-col items-center gap-3 flex-shrink-0 w-28 sm:w-36"
            >
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-50 overflow-hidden rounded-full border-2 border-transparent group-hover:border-slate-100 hover:!border-primary transition-all duration-300 shadow-sm">
                <img
                  src={getImage(cat.name)}
                  alt={cat.name}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="text-center px-2">
                <p className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider leading-tight">
                  {cat.name}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Gradient Fades for a professional edge-to-edge look */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />
      </div>
    </section>
  );
};

export default CategoryCards;