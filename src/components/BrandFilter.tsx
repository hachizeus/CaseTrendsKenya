import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const BrandFilter = () => {
  const [searchParams] = useSearchParams();
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const currentBrand = searchParams.get("brand") || "";

  useEffect(() => {
    supabase.from("products").select("brand").then(({ data }) => {
      if (data) {
        const unique = Array.from(new Set(data.map(d => d.brand).filter(Boolean))).sort();
        setBrands(unique);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <section className="py-6 border-b border-border bg-white">
        <div className="container">
          <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto scrollbar-hide">
            <Skeleton className="flex-shrink-0 h-4 w-32" />
            <div className="w-px h-4 bg-border flex-shrink-0" />
            {Array(5).fill(null).map((_, i) => (
              <Skeleton key={i} className="flex-shrink-0 h-8 w-20" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (brands.length === 0) return null;

  return (
    <section className="py-6 border-b border-border bg-white">
      <div className="container">
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto scrollbar-hide">
          <span className="flex-shrink-0 text-xs font-bold uppercase tracking-widest text-muted-foreground">Shop by Brand</span>
          <div className="w-px h-4 bg-border flex-shrink-0" />
          <Link
            to="/products"
            className={`flex-shrink-0 px-4 py-1.5 text-xs font-semibold border transition-colors ${
              !currentBrand
                ? "bg-primary text-white border-primary hover:bg-primary/90"
                : "border-border text-foreground hover:border-primary hover:text-primary"
            }`}
          >
            All
          </Link>
          {brands.map(brand => (
            <Link
              key={brand}
              to={`/products?brand=${encodeURIComponent(brand)}`}
              className={`flex-shrink-0 px-4 py-1.5 text-xs font-semibold border transition-colors ${
                currentBrand === brand
                  ? "bg-primary text-white border-primary hover:bg-primary/90"
                  : "border-border text-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {brand}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandFilter;
