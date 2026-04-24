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

// Smart category matching function with proper exclusion logic
const matchesCategorySmart = (product: any, categorySlug: string): boolean => {
  const productName = product.name?.toLowerCase() || "";
  const productDesc = product.description?.toLowerCase() || "";
  const productCategory = product.category?.toLowerCase() || "";
  const productBrand = product.brand?.toLowerCase() || "";
  
  // First, identify if this is an audio product to exclude from non-audio categories
  const isAudioProduct = 
    productName.includes("headphone") ||
    productName.includes("earbud") ||
    productName.includes("speaker") ||
    productName.includes("airpods") ||
    productDesc.includes("audio") ||
    productCategory === "audio" ||
    productBrand === "soundcore" ||
    (productBrand === "anker" && (
      productName.includes("soundcore") ||
      productName.includes("earbud") ||
      productName.includes("speaker")
    ));
  
  // Identify if this is a smart watch product
  const isSmartWatch = 
    productName.includes("watch") ||
    productName.includes("band") ||
    productDesc.includes("smart watch") ||
    productCategory === "smart-watch";
  
  // Identify if this is a power bank
  const isPowerBank = 
    productName.includes("power bank") ||
    productName.includes("powerbank") ||
    productName.includes("portable charger") ||
    productCategory === "power-banks";
  
  // First try exact category match
  if (productMatchesCategoryFilter(product, categorySlug)) {
    return true;
  }
  
  // Smart matching based on category type
  switch (categorySlug) {
    case "phone-cases":
      // EXCLUDE audio, smart watch, and power bank products
      if (isAudioProduct || isSmartWatch || isPowerBank) return false;
      
      return productName.includes("case") || 
             productName.includes("cover") ||
             productDesc.includes("case") ||
             productDesc.includes("cover") ||
             productCategory === "phone-cases" ||
             productCategory === "phone cases";
             
    case "protectors":
      // EXCLUDE audio, smart watch, and power bank products
      if (isAudioProduct || isSmartWatch || isPowerBank) return false;
      
      return productName.includes("protector") || 
             productName.includes("screen protector") ||
             productName.includes("lens protector") ||
             productDesc.includes("protector") ||
             productCategory === "protectors";
             
    case "android-phones-protectors":
      // EXCLUDE audio, smart watch, and power bank products
      if (isAudioProduct || isSmartWatch || isPowerBank) return false;
      
      return (productBrand !== "apple" || productName.includes("android")) &&
             (productName.includes("protector") || productDesc.includes("protector"));
             
    case "iphone-model-protectors":
      // EXCLUDE audio, smart watch, and power bank products
      if (isAudioProduct || isSmartWatch || isPowerBank) return false;
      
      return (productBrand === "apple" || productName.includes("iphone")) &&
             (productName.includes("protector") || productDesc.includes("protector"));
             
    case "audio":
      return productName.includes("headphone") ||
             productName.includes("earbud") ||
             productName.includes("speaker") ||
             productName.includes("airpods") ||
             productDesc.includes("audio") ||
             productCategory === "audio" ||
             productBrand === "soundcore" ||
             (productBrand === "anker" && productName.includes("soundcore"));
             
    case "smart-watch":
      // EXCLUDE audio products
      if (isAudioProduct) return false;
      
      return productName.includes("watch") ||
             productName.includes("band") ||
             productDesc.includes("smart watch") ||
             productCategory === "smart-watch";
             
    case "charging-devices":
      // EXCLUDE audio products
      if (isAudioProduct) return false;
      
      return productName.includes("charger") ||
             productName.includes("charging") ||
             productName.includes("cable") ||
             productDesc.includes("charging") ||
             productCategory === "charging-devices";
             
    case "power-banks":
      // EXCLUDE audio products
      if (isAudioProduct) return false;
      
      return productName.includes("power bank") ||
             productName.includes("powerbank") ||
             productName.includes("portable charger") ||
             productDesc.includes("power bank") ||
             productCategory === "power-banks";
             
    case "camera-lens-protectors":
      // EXCLUDE audio, smart watch, and power bank products
      if (isAudioProduct || isSmartWatch || isPowerBank) return false;
      
      return productName.includes("camera lens") ||
             productName.includes("lens protector") ||
             productDesc.includes("camera lens") ||
             productCategory === "camera-lens-protectors";
             
    case "accessories":
      // EXCLUDE audio products from accessories section
      if (isAudioProduct) return false;
      
      return productName.includes("accessory") ||
             productName.includes("holder") ||
             productName.includes("stand") ||
             productCategory === "accessories";
             
    case "phone-holders":
      // EXCLUDE audio products
      if (isAudioProduct) return false;
      
      return productName.includes("holder") ||
             productName.includes("stand") ||
             productName.includes("mount") ||
             productCategory === "phone-holders";
             
    case "gaming":
      return productName.includes("game") ||
             productName.includes("gaming") ||
             productDesc.includes("gaming") ||
             productCategory === "gaming";
             
    case "magsafe-cases":
      // EXCLUDE audio, smart watch, and power bank products
      if (isAudioProduct || isSmartWatch || isPowerBank) return false;
      
      return productName.includes("magsafe") ||
             productName.includes("mag safe") ||
             productDesc.includes("magsafe") ||
             productCategory === "magsafe-cases";
             
    case "stickers":
      // EXCLUDE audio products
      if (isAudioProduct) return false;
      
      return productName.includes("sticker") ||
             productName.includes("decal") ||
             productDesc.includes("sticker") ||
             productCategory === "stickers";
             
    default:
      return false;
  }
};

const CategoryProductSection = ({ category, bgClass = "bg-white" }: CategoryProductSectionProps) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Fetch more products to ensure we have enough after filtering
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
            
            // Filter by category using smart matching
            if (!product.category && !product.name) {
              console.warn(`Product ${product.id} has no category or name field set`);
              return false;
            }
            
            return matchesCategorySmart(product, category);
          })
          .slice(0, 6); // Changed from 4 to 6

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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-full bg-card border border-border animate-pulse">
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