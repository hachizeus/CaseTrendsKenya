import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "./ProductCard";

const ProductGrid = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .order("created_at", { ascending: false })
        .limit(10);
      setProducts(data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <section id="products" className="pb-12">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Latest in Stock</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border animate-pulse">
                <div className="aspect-square bg-secondary" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-secondary rounded w-1/2" />
                  <div className="h-4 bg-secondary rounded" />
                  <div className="h-4 bg-secondary rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="pb-12">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">Latest in Stock</h2>
          <Link to="/products" className="text-sm text-primary hover:underline font-medium">View All →</Link>
        </div>
        {products.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No products available yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((product, i) => (
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
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;
