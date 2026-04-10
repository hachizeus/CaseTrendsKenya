import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/queries";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "./ProductCard";

const TABS = [
  { key: "newest", label: "New Products" },
  { key: "trending", label: "Best Selling" },
  { key: "featured", label: "Featured" },
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
        <div key={i} className="flex-shrink-0 w-40 sm:w-48 bg-card border border-border animate-pulse">
          <div className="aspect-square bg-secondary" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-secondary rounded w-1/2" />
            <div className="h-4 bg-secondary rounded" />
            <div className="h-4 bg-secondary rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section id="products" className="py-8 sm:py-12 bg-white border-t border-border">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-1 sm:gap-0">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight mr-4 sm:mr-8">Our Trending Products</h2>
            <div className="flex border-b border-border">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`relative px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    tab === t.key ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                  {tab === t.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="w-8 h-8 border border-border flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="w-8 h-8 border border-border flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
            transition={{ duration: 0.25 }}
          >
              {products.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-sm">
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
                        index={i}
                      />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

        <div className="mt-6 text-center">
          <Link
            to="/products"
            className="inline-block border border-primary text-primary px-8 py-2.5 text-sm font-semibold hover:bg-primary hover:text-white transition-colors"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
