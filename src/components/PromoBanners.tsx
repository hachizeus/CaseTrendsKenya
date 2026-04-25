import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const bgGradients = [
  "from-[hsl(240,10%,8%)] to-[hsl(240,10%,6%)] border-primary/20",
  "from-[hsl(330,100%,54%,0.15)] to-[hsl(240,10%,6%)] border-primary/30",
  "from-[hsl(240,10%,8%)] to-[hsl(240,10%,5%)] border-primary/20",
  "from-[hsl(330,100%,54%,0.1)] to-[hsl(240,10%,7%)] border-primary/25",
  "from-[hsl(240,10%,9%)] to-[hsl(240,10%,5%)] border-primary/20",
  "from-[hsl(330,100%,54%,0.12)] to-[hsl(240,10%,6%)] border-primary/30",
];

// Fallback products in case no featured products exist
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
    const fetchProducts = async () => {
      try {
        // First try to get featured products
        let { data: featuredProducts, error } = await supabase
          .from("products")
          .select("*, product_images(*)")
          .eq("is_featured", true)
          .order("created_at", { ascending: false })
          .limit(6);
        
        // If no featured products or error, get any products with discounts
        if (!featuredProducts || featuredProducts.length === 0) {
          const { data: discountedProducts } = await supabase
            .from("products")
            .select("*, product_images(*)")
            .not("original_price", "is", null)
            .gt("original_price", 0)
            .order("created_at", { ascending: false })
            .limit(6);
          
          if (discountedProducts && discountedProducts.length > 0) {
            setProducts(discountedProducts);
          } else {
            // If still no products, use fallback
            setProducts(fallbackProducts);
          }
        } else {
          setProducts(featuredProducts);
        }
      } catch (err) {
        console.error("Error fetching promo products:", err);
        setProducts(fallbackProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-8 sm:py-10 bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]">
        <div className="container">
          <div className="text-center mb-6">
            <div className="h-8 w-48 bg-white/5 rounded-lg mx-auto animate-pulse" />
            <div className="h-4 w-32 bg-white/5 rounded-lg mx-auto mt-2 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array(3).fill(null).map((_, i) => (
              <Skeleton key={i} className="h-32 bg-[hsl(240,10%,8%)] border border-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-8 sm:py-10 bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]">
      <div className="container">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full mb-3">
            <span className="text-xs font-medium text-primary uppercase tracking-wider">Limited Time</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
            Featured Deals
          </h2>
          <p className="text-white/50 text-sm mt-1">Unlimited offers and promotions</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {products.map((p, i) => {
            const img = p.product_images?.find((x: any) => x.is_primary)?.image_url
              || p.product_images?.[0]?.image_url 
              || (p.image_url || "/placeholder.svg");
            const discount = p.original_price
              ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
              : 0;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <Link
                  to={`/product/${p.id}`}
                  className={`group flex items-center justify-between bg-gradient-to-r ${bgGradients[i % bgGradients.length]} border rounded-xl p-4 sm:p-5 overflow-hidden relative hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1`}
                >
                  {/* Glowing effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  <div className="flex-1 min-w-0 pr-3 relative z-10">
                    {discount > 0 && (
                      <span className="inline-block text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5 px-2 py-0.5 bg-primary/10 rounded-full">
                        {discount}% OFF
                      </span>
                    )}
                    <h3 className="font-bold text-xs sm:text-sm lg:text-base leading-snug text-white/90 line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <p className="text-base sm:text-lg font-bold text-primary">
                        KSh {Number(p.price).toLocaleString()}
                      </p>
                      {p.original_price && (
                        <p className="text-[10px] sm:text-xs text-white/40 line-through">
                          KSh {Number(p.original_price).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-3 group-hover:gap-2 transition-all duration-300">
                      Shop Now 
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                  </div>
                  
                  {/* Image container - NO background, just the image on transparent */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 relative">
                    <img
                      src={img}
                      alt={p.name}
                      width={96}
                      height={96}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      style={{ background: 'transparent' }}
                    />
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full pointer-events-none" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
        
        <div className="text-center mt-8">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-primary transition-colors group"
          >
            View All Products
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PromoBanners;