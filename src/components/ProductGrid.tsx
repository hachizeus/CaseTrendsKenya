import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/queries";
import { ChevronLeft, ChevronRight, Sparkles, TrendingUp, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "./ProductCard";

const TABS = [
  { key: "newest", label: "New Products", icon: Sparkles },
  { key: "trending", label: "Best Selling", icon: TrendingUp },
  { key: "featured", label: "Featured", icon: Star },
];

const ProductGrid = () => {
  const { data: allProducts = [] } = useProducts({ suspense: true });
  const [tab, setTab] = useState("newest");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const products = useMemo(() => {
    return allProducts.filter(p => {
      if (tab === "trending") return p.is_trending;
      if (tab === "featured") return p.is_featured;
      return true;
    }).slice(0, 10);
  }, [allProducts, tab]);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    setTimeout(checkScroll, 50);
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => { el.removeEventListener("scroll", checkScroll); window.removeEventListener("resize", checkScroll); };
  }, [tab, checkScroll]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  const Skeleton = () => (
    <div className="flex gap-3 sm:gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-40 sm:w-48 bg-[hsl(240,10%,6%)] border border-white/5 rounded-xl animate-pulse">
          <div className="aspect-square bg-gradient-to-br from-[hsl(240,10%,8%)] to-[hsl(240,10%,4%)] rounded-t-xl" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-white/5 rounded w-1/2" />
            <div className="h-4 bg-white/5 rounded" />
            <div className="h-4 bg-white/5 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section id="products" className="py-8 sm:py-12 bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)] border-t border-white/5">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-1 sm:gap-0">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight mr-4 sm:mr-8 bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
              Our Trending Products
            </h2>
            <div className="flex border-b border-white/10">
              {TABS.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`relative px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap ${
                      tab === t.key 
                        ? "text-primary" 
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                    {tab === t.key && (
                      <motion.span 
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="w-8 h-8 border border-white/10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="w-8 h-8 border border-white/10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {products.length === 0 ? (
              <div className="text-center py-16 text-white/40 text-sm">
                No products in this category yet.
              </div>
            ) : (
              <div
                ref={scrollRef}
                className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2"
              >
                {products.map((product, i) => (
                  <div key={product.id} className="flex-shrink-0 w-[160px] sm:w-[200px] lg:w-[220px]">
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      images={product.product_images || []}
                      price={Number(product.price)}
                      originalPrice={product.original_price ? Number(product.original_price) : null}
                      category={product.category}
                      brand={product.brand}
                      stockStatus={product.stock_status}
                      rating={product.rating}
                      reviewCount={product.review_count}
                      index={i}
                    />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 text-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 border border-primary/50 bg-primary/5 text-primary px-8 py-2.5 text-sm font-semibold rounded-full hover:bg-primary hover:text-white transition-all duration-300 hover:gap-3 group"
          >
            View All Products
            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;