import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { getDisplayCategoryName } from "@/lib/utils";

interface CategoryProductSectionProps {
  category: string;
  bgClass?: string;
  title?: string;
}

// Direct category mapping - based on actual database values
const getCategoryFilter = (categorySlug: string): string[] => {
  const categoryMap: Record<string, string[]> = {
    "protectors": ["protectors", "screen protectors", "lens protectors"],
    "phone cases": ["phone cases", "cases", "magsafe cases", "covers"],
    "accessories": ["accessories", "phone accessories", "holders", "stands"],
    "charging-devices": ["charging devices", "chargers", "cables", "charging"],
    "audio": ["audio", "headphones", "earbuds", "speakers"],
    "smart watch": ["smart watch", "watch", "wearables", "bands"],
    "power-banks": ["power banks", "powerbanks", "portable chargers"],
    "camera-lens-protectors": ["camera lens protectors", "lens protectors"],
    "phone-holders": ["phone holders", "holders", "stands", "mounts"],
    "gaming": ["gaming", "game accessories"],
    "stickers": ["stickers", "decals", "skins"],
  };
  
  return categoryMap[categorySlug] || [categorySlug];
};

const CategoryProductSection = ({ category, bgClass = "bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]", title }: CategoryProductSectionProps) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const categoryFilters = getCategoryFilter(category);
        
        // Build the query - removed is_active filter since column doesn't exist
        let query = supabase
          .from("products")
          .select("*, product_images(*), reviews(rating)")
          .order("created_at", { ascending: false });
        
        // Apply category filter - use OR condition for multiple category matches
        if (categoryFilters.length === 1) {
          query = query.eq("category", categoryFilters[0]);
        } else {
          query = query.in("category", categoryFilters);
        }
        
        const { data, error } = await query.limit(50);

        if (error) {
          console.error("Error fetching products:", error);
          setProducts([]);
          setLoading(false);
          return;
        }

        // Process products with ratings
        const results = (data || [])
          .map((product: any) => {
            const reviews = Array.isArray(product.reviews) ? product.reviews : [];
            const reviewCount = reviews.length;
            const rating = reviewCount
              ? reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) / reviewCount
              : 0;
            return {
              ...product,
              rating,
              review_count: reviewCount,
            };
          })
          .slice(0, 6);

        console.log(`Category ${category} - Found ${results.length} products:`, results.map(p => ({ name: p.name, category: p.category })));
        setProducts(results);
      } catch (err) {
        console.error("Failed to load products for category", category, err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [category]);

  const displayCategory = title || getDisplayCategoryName(category);
  const displaySubtitle = `Top picks in ${displayCategory}`;

  return (
    <section className={`py-8 sm:py-10 border-t border-white/5 ${bgClass}`}>
      <div className="container">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
              {displayCategory}
            </h2>
            <p className="text-xs text-white/50 mt-0.5">{displaySubtitle}</p>
          </div>
          <Link
            to={`/products?category=${encodeURIComponent(category)}`}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary border border-primary/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-primary hover:text-white transition-all duration-300"
          >
            View All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-full bg-[hsl(240,10%,6%)] border border-white/5 rounded-xl animate-pulse">
                <div className="aspect-square bg-gradient-to-br from-[hsl(240,10%,8%)] to-[hsl(240,10%,4%)] rounded-t-xl" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="h-4 bg-white/5 rounded" />
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-8 text-center text-sm text-white/40">
            No products available in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
                className="w-full"
              >
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
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoryProductSection;