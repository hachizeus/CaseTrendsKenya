import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Smartphone, Tablet, Headphones, Gamepad2, Watch, Cable, Tv, Camera, Laptop, Speaker, Battery, Wifi, type LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Smartphone, Tablet, Headphones, Gamepad2, Watch, Cable, Tv, Camera, Laptop, Speaker, Battery, Wifi,
};

const CategoryNav = () => {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("categories").select("*").eq("is_active", true).order("display_order")
      .then(({ data }) => setCategories(data || []));
  }, []);

  return (
    <nav className="bg-card border-b border-border">
      <div className="container">
        <ul className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          <li className="flex-shrink-0">
            <Link
              to="/products"
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium text-nav-foreground hover:text-nav-hover transition-colors whitespace-nowrap"
            >
              All Products
            </Link>
          </li>
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon] || Smartphone;
            return (
              <li key={cat.id} className="flex-shrink-0">
                <Link
                  to={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium text-nav-foreground hover:text-nav-hover transition-colors whitespace-nowrap"
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {cat.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default CategoryNav;
