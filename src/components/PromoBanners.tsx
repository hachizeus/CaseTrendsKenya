import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

// Hardcoded background image
const BANNER_IMAGE = "/featured.webp";

// Fallback products
const fallbackProducts = [
  {
    id: "1",
    name: "ESD Privacy Tempered Glass Protector",
    price: 850,
    original_price: 1000,
    product_images: [{ image_url: "/placeholder.svg", is_primary: true }]
  },
  {
    id: "2",
    name: "Samsung S24 Ultra Privacy Screen Protector",
    price: 999,
    original_price: 1500,
    product_images: [{ image_url: "/placeholder.svg", is_primary: true }]
  },
  {
    id: "3",
    name: "Anker 332 USB-C Hub (5-in-1)",
    price: 5500,
    original_price: 6000,
    product_images: [{ image_url: "/placeholder.svg", is_primary: true }]
  }
];

const PromoBanners = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        let { data: featuredProducts } = await supabase
          .from("products")
          .select("*, product_images(*)")
          .eq("is_featured", true)
          .order("created_at", { ascending: false })
          .limit(6);
        
        if (!featuredProducts || featuredProducts.length === 0) {
          const { data: discountedProducts } = await supabase
            .from("products")
            .select("*, product_images(*)")
            .not("original_price", "is", null)
            .gt("original_price", 0)
            .limit(6);
          
          setProducts(discountedProducts || fallbackProducts);
        } else {
          setProducts(featuredProducts);
        }
      } catch (err) {
        console.error("Error:", err);
        setProducts(fallbackProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <section className="bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]">
        <div className="relative w-full overflow-hidden">
          <div className="h-64 bg-white/5 animate-pulse" />
        </div>
        <div className="container mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array(3).fill(null).map((_, i) => (
              <Skeleton key={i} className="h-36 bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]">
      {/* Top Section - Banner with Hardcoded Background Image and Text Overlay */}
      <div className="relative w-full overflow-hidden">
        {/* Hardcoded Background Image */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${BANNER_IMAGE})`,
          }}
        />
        
        {/* Dark Overlay for text readability */}
        <div className="absolute inset-0 bg-black/60" />
        
        {/* Gradient Overlay for smooth transition to cards */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[hsl(240,10%,3.9%)] to-transparent" />

        {/* Text Content */}
        <div className="relative z-10 container mx-auto px-4 py-16 sm:py-20 md:py-24 lg:py-32">
          <motion.div 
            className="max-w-2xl text-center mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Limited Time Badge */}
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full mb-4 bg-primary/30 backdrop-blur-sm border border-primary/50">
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                🔥 Limited Time
              </span>
            </div>
            
            {/* Main Heading */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white via-yellow-400 to-white bg-clip-text text-transparent">
                Featured Deals
              </span>
            </h2>
            
            {/* Subtitle */}
            <p className="text-white/90 text-base sm:text-lg md:text-xl">
              Unlimited offers and promotions
            </p>
          </motion.div>
        </div>
      </div>

      {/* Bottom Section - Product Cards (All Same Size) */}
      <div className="container mx-auto px-4 pb-16 sm:pb-20 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 -mt-8 sm:-mt-10">
          {products.map((p, i) => {
            const img = p.product_images?.find((x: any) => x.is_primary)?.image_url
              || p.product_images?.[0]?.image_url 
              || "/placeholder.svg";
            const discount = p.original_price
              ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
              : 0;
            
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="h-full"
              >
                <Link
                  to={`/product/${p.id}`}
                  className="block bg-black/40 backdrop-blur-sm border border-white/20 rounded-xl p-5 h-full transition-all hover:bg-black/50 hover:border-primary/50"
                >
                  <div className="flex items-center gap-4 h-full">
                    {/* Left side - Text content */}
                    <div className="flex-1 min-w-0">
                      {discount > 0 && (
                        <span className="inline-block text-xs font-bold text-white bg-red-500/80 px-2 py-0.5 rounded-full mb-2">
                          -{discount}% OFF
                        </span>
                      )}
                      
                      <h3 className="font-bold text-sm sm:text-base text-white line-clamp-2 mb-2">
                        {p.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <p className="text-lg sm:text-xl font-bold text-primary">
                          KSh {Number(p.price).toLocaleString()}
                        </p>
                        {p.original_price && (
                          <p className="text-xs text-white/50 line-through">
                            KSh {Number(p.original_price).toLocaleString()}
                          </p>
                        )}
                      </div>
                      
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        Shop Now →
                      </span>
                    </div>
                    
                    {/* Right side - Product Image (Fixed Size) */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                      <img
                        src={img}
                        alt={p.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
        
        {/* View All Button */}
        <motion.div 
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 sm:px-8 sm:py-3 bg-primary/20 backdrop-blur-sm border border-primary/40 rounded-full text-sm sm:text-base font-semibold text-white hover:bg-primary/30 transition-all"
          >
            View All Products →
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default PromoBanners;