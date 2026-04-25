// @ts-nocheck
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

// EXACT category mapping based on database values
const getCategoryFilter = (categorySlug: string): string[] => {
  const categoryMap: Record<string, string[]> = {
    "protectors": ["protectors", "protector"],
    "phone cases": ["phone-cases", "phone-case"],
    "accessories": ["accessories"],
    "charging-devices": ["charging-devices"],
    "audio": ["audio"],
    "smart watch": ["smart-watch"],
    "power-banks": ["power-banks"],
    "camera-lens-protectors": ["camera-lens-protectors"],
    "phone-holders": ["phone-holders"],
    "gaming": ["gaming"],
    "stickers": ["stickers"],
    "android-phones": ["android-phones"],
    "iphone-model": ["iphone-model"],
    "smartphones": ["smartphones"],
    "streaming": ["streaming"],
  };
  
  return categoryMap[categorySlug] || [categorySlug];
};

const CategoryProductSection = ({ 
  category, 
  bgClass = "bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]", 
  title 
}: CategoryProductSectionProps) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const categoryFilters = getCategoryFilter(category);
        
        // Build the query
        let query = supabase
          .from("products")
          .select("*, product_images(*), reviews(rating)")
          .order("created_at", { ascending: false });
        
        // Apply category filter
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

  if (loading) {
    return (
      <section className={`py-8 sm:py-10 border-t border-white/5 ${bgClass}`}>
        <div className="container">
          <div className="flex justify-between items-center mb-6">
            <div className="h-6 w-32 bg-white/5 rounded animate-pulse" />
            <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-[hsl(240,10%,8%)] rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className={`py-8 sm:py-10 border-t border-white/5 ${bgClass}`}>
      <div className="container">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
              {displayCategory}
            </h2>
            <p className="text-xs text-white/50 mt-0.5">{displaySubtitle}</p>
          </div>
          <Link 
            to={`/products?category=${category}`}
            className="text-xs sm:text-sm text-white/60 hover:text-primary transition-colors flex items-center gap-1 group"
          >
            View All 
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {products.map((product, idx) => (
            <ProductCard
              key={product.id}
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
              index={idx}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryProductSection;