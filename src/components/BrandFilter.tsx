import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Tag } from "lucide-react";

// Hardcoded brand list - no database fetching
const BRANDS = [
  "All Laptop Brands",
  "Apple",
  "Google Pixel",
  "HAVIT",
  "Huawei",
  "Infinix",
  "iPhone",
  "Itel",
  "Motorola",
  "Nokia",
  "OnePlus",
  "Oppo",
  "Oraimo",
  "Realme",
  "Redmi",
  "Samsung",
  "Samsung Z fold",
  "Soundcore",
  "Tecno",
  "Universal",
  "Vivo",
  "Xiaomi",
  "Z fold 3/4/5/6/7",
];

const BrandFilter = () => {
  const [searchParams] = useSearchParams();
  const currentBrand = searchParams.get("brand") || "";

  return (
    <motion.section 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="py-6 border-b border-white/5 bg-gradient-to-r from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]"
    >
      <div className="container">
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-1">
          <div className="flex-shrink-0 flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-white/60">Shop by Brand</span>
          </div>
          <div className="w-px h-5 bg-white/10 flex-shrink-0" />
          <Link
            to="/products"
            className={`flex-shrink-0 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${
              !currentBrand
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "border border-white/10 text-white/70 hover:border-primary/50 hover:text-primary hover:bg-primary/5"
            }`}
          >
            All
          </Link>
          {BRANDS.map((brand, idx) => (
            <motion.div
              key={brand}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.01 }}
            >
              <Link
                to={`/products?brand=${encodeURIComponent(brand)}`}
                className={`flex-shrink-0 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 whitespace-nowrap ${
                  currentBrand === brand
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "border border-white/10 text-white/70 hover:border-primary/50 hover:text-primary hover:bg-primary/5"
                }`}
              >
                {brand}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default BrandFilter;