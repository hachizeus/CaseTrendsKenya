import { Link } from "react-router-dom";

// Real-life category images from Unsplash (free, no auth needed)
const categoryImages: Record<string, string> = {
  smartphones:    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=160&q=80",
  "smart phones": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=160&q=80",
  phones:         "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=160&q=80",
  "phone cases":  "/covers.jpg",
  cases:          "/covers.jpg",
  protectors:     "/protector.jpg",
  "screen protectors": "/protector.jpg",
  tablets:        "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=160&q=80",
  "tablets & ipads": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=160&q=80",
  ipads:          "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=160&q=80",
  headphones:     "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=160&q=80",
  earbuds:        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=160&q=80",
  "audio & earbuds": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=160&q=80",
  audio:          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=160&q=80",
  chargers:       "https://images.unsplash.com/photo-1580910051074-c40fad0a9180?w=160&q=80",
  "phone accessories": "/Accessories.jpg",
  "mobile accessories": "/Accessories.jpg",
  accessories:    "/Accessories.jpg",
  "all accessories": "/Accessories.jpg",
  smartwatches:   "/wearable.jpg",
  wearables:      "/wearable.jpg",
  watches:        "/wearable.jpg",
  gaming:         "https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=160&q=80",
  cameras:        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=160&q=80",
  camera:         "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=160&q=80",
  speakers:       "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=160&q=80",
  speaker:        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=160&q=80",
  "streaming devices": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=160&q=80",
  tv:             "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=160&q=80",
  televisions:    "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=160&q=80",
};

const getImage = (name: string) =>
  categoryImages[name.toLowerCase()] ||
  `https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=160&q=80`;

const featuredCategories = [
  { name: "All Accessories", slug: "" },
  { name: "Phone Cases", slug: "Phone Cases" },
  { name: "Wearables", slug: "Wearables" },
  { name: "Audio & Earbuds", slug: "Audio & Earbuds" },
  { name: "Screen Protectors", slug: "Screen Protectors" },
];

const CategoryCards = () => {
  const mobileCategories = [...featuredCategories, ...featuredCategories];

  return (
    <section className="py-8 sm:py-10 border-b border-border bg-white overflow-hidden">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base sm:text-lg font-bold tracking-tight">Top Phone Accessories</h2>
          <Link to="/products" className="text-xs text-primary font-medium hover:underline">View All →</Link>
        </div>
      </div>

      <div className="relative overflow-hidden md:hidden px-4 sm:px-[max(1rem,calc((100vw-1400px)/2))]">
        <div className="mobile-marquee flex gap-4 items-center whitespace-nowrap py-2">
          {mobileCategories.map((cat, i) => (
            <Link
              key={`${cat.slug}-${i}`}
              to={cat.slug ? `/products?category=${encodeURIComponent(cat.slug)}` : "/products"}
              className="group inline-flex flex-col items-center gap-2.5 flex-shrink-0 w-24 sm:w-28"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 border border-border bg-secondary overflow-hidden group-hover:border-primary transition-colors duration-200 rounded-3xl">
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
                <p className="text-[10px] text-muted-foreground">{cat.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="hidden md:grid container grid-cols-2 lg:grid-cols-5 gap-4 px-4 sm:px-[max(1rem,calc((100vw-1400px)/2))]">
        {featuredCategories.map((cat, i) => (
          <Link
            key={`${cat.slug}-desktop-${i}`}
            to={cat.slug ? `/products?category=${encodeURIComponent(cat.slug)}` : "/products"}
            className="group flex flex-col items-center gap-2.5 rounded-3xl border border-border bg-secondary p-4 text-center hover:border-primary transition-colors duration-200"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 border border-border bg-white overflow-hidden rounded-3xl">
              <img
                src={getImage(cat.name)}
                alt={cat.name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                {cat.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{cat.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoryCards;
