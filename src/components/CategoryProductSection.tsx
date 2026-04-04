import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";

interface CategoryProductSectionProps {
  category: string;
  bgClass?: string;
}

const CategoryProductSection = ({ category, bgClass = "bg-white" }: CategoryProductSectionProps) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("category", category)
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => { setProducts(data || []); setLoading(false); });
  }, [category]);

  if (!loading && products.length === 0) return null;

  return (
    <section className={`py-8 sm:py-10 border-t border-border ${bgClass}`}>
      <div className="container">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">{category}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Top picks in {category}</p>
          </div>
          <Link
            to={`/products?category=${encodeURIComponent(category)}`}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary border border-primary px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-primary hover:text-white transition-colors"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border animate-pulse">
                <div className="aspect-square bg-secondary" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-secondary rounded w-1/2" />
                  <div className="h-4 bg-secondary rounded" />
                  <div className="h-4 bg-secondary rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
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
