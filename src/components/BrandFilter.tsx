import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const BrandFilter = () => {
  const [brands, setBrands] = useState<string[]>([]);
  const [active, setActive] = useState("All Brands");

  useEffect(() => {
    supabase.from("products").select("brand").then(({ data }) => {
      if (data) {
        const unique = Array.from(new Set(data.map(d => d.brand).filter(Boolean))).sort();
        setBrands(unique);
      }
    });
  }, []);

  return (
    <section className="py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl sm:text-2xl font-bold">Shop by Brand</h2>
          <Link to="/products" className="text-sm text-primary hover:underline">View All →</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/products"
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              active === "All Brands"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary hover:text-primary"
            }`}
            onClick={() => setActive("All Brands")}
          >
            All Brands
          </Link>
          {brands.map((brand) => (
            <Link
              key={brand}
              to={`/products?brand=${encodeURIComponent(brand)}`}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all bg-card text-foreground border-border hover:border-primary hover:text-primary`}
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
