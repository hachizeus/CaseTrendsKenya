import { Link } from "react-router-dom";
import { MAIN_CATEGORIES } from "@/lib/categoryData";

// Category Image Mapping using local images from public folder
const categoryImages: Record<string, string> = {
  // Exact matches from MAIN_CATEGORIES
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
  // Additional aliases
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