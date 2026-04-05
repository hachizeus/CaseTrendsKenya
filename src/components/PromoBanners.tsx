import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const bgColors = [
  "bg-gray-50", "bg-pink-50", "bg-slate-100",
  "bg-amber-50", "bg-cyan-50", "bg-violet-50",
];

const PromoBanners = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => { setProducts(data || []); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <section className="py-8 sm:py-10 bg-secondary/40">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array(3).fill(null).map((_, i) => (
              <Skeleton key={i} className="h-28 sm:h-32" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-8 sm:py-10 bg-secondary/40">
      <div className="container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {products.map((p, i) => {
            const img = p.product_images?.find((x: any) => x.is_primary)?.image_url
              || p.product_images?.[0]?.image_url || "/placeholder.svg";
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
                  className={`group flex items-center justify-between ${bgColors[i % bgColors.length]} border border-border p-4 sm:p-5 overflow-hidden relative hover:border-primary transition-colors duration-200`}
                >
                  <div className="flex-1 min-w-0 pr-3">
                    {discount > 0 && (
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 block">
                        {discount}% OFF
                      </span>
                    )}
                    <h3 className="font-bold text-sm sm:text-base leading-snug text-foreground line-clamp-2 mb-1">
                      {p.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      From KSh {Number(p.price).toLocaleString()}
                    </p>
                    <span className="inline-block text-xs font-semibold text-primary border-b border-primary pb-0.5 group-hover:border-primary/60 transition-colors">
                      Shop Now →
                    </span>
                  </div>
                  <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
                    <img
                      src={img}
                      alt={p.name}
                      width={112}
                      height={112}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PromoBanners;
