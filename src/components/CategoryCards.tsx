import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Smartphone, Tablet, Headphones, Gamepad2, Watch, Cable, Tv, Camera, Laptop, Speaker, Battery, Wifi, type LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Smartphone, Tablet, Headphones, Gamepad2, Watch, Cable, Tv, Camera, Laptop, Speaker, Battery, Wifi,
};

const colorPalette = [
  "from-blue-500 to-cyan-400",
  "from-violet-500 to-purple-400",
  "from-orange-500 to-amber-400",
  "from-emerald-500 to-teal-400",
  "from-rose-500 to-pink-400",
  "from-indigo-500 to-blue-400",
  "from-yellow-500 to-orange-400",
  "from-cyan-500 to-sky-400",
];

const CategoryCards = () => {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("categories").select("*").eq("is_active", true).order("display_order")
      .then(({ data }) => setCategories(data || []));
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(0, 8).map((cat, i) => {
            const Icon = iconMap[cat.icon] || Smartphone;
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={`/products?category=${encodeURIComponent(cat.name)}`}
                  className={`relative block rounded-xl overflow-hidden bg-gradient-to-br ${colorPalette[i % colorPalette.length]} p-6 text-primary-foreground group hover:scale-[1.02] transition-transform`}
                >
                  <Icon className="w-10 h-10 mb-3 opacity-90" />
                  <h3 className="font-bold text-sm sm:text-base">{cat.name}</h3>
                  <p className="text-xs opacity-80 mt-1">Shop Now →</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryCards;
