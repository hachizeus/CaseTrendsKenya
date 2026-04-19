import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { getDisplayCategoryName, productMatchesCategoryFilter } from "@/lib/utils";

interface CategoryProductSectionProps {
  category: string;
  bgClass?: string;
}

const CategoryProductSection = ({ category, bgClass = "bg-white" }: CategoryProductSectionProps) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Fetch more products to ensure we have enough after filtering
        // Use 100 as a reasonable limit for fetching before in-memory filtering
        const { data, error } = await supabase
          .from("products")
          .select("*, product_images(*), reviews(rating)")
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) {
          console.error("Error fetching products:", error);
          setProducts([]);
          setLoading(false);
          return;
        }

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
          .filter(product => {
            // Handle special case "All Accessories"
            if (category === "All Accessories") return true;
            
            // Filter by category - ensure product has a valid category field
            if (!product.category) {
              console.warn(`Product ${product.id} has no category field set`);
              return false;
            }
            
            return productMatchesCategoryFilter(product, category);
          })
          .slice(0, 4);

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

  const displayCategory = getDisplayCategoryName(category);

  return (
    <section className={`py-8 sm:py-10 border-t border-border ${bgClass}`}>
      <div className="container">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight">{displayCategory}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Top picks in {displayCategory}</p>
          </div>
          <Link
            to={`/products?category=${encodeURIComponent(category)}`}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary border border-primary px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-primary hover:text-white transition-colors"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[160px] sm:w-[200px] lg:w-[220px] bg-card border border-border animate-pulse">
                <div className="aspect-square bg-secondary" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-secondary rounded w-1/2" />
                  <div className="h-4 bg-secondary rounded" />
                  <div className="h-4 bg-secondary rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No products available in this category yet.
          </div>
        ) : (
          <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
                className="flex-shrink-0 w-[160px] sm:w-[200px] lg:w-[220px]"
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
