import { ShoppingCart, Eye } from "lucide-react";
import { motion } from "framer-motion";

interface ProductCardProps {
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  category: string;
  brand: string;
  badge?: "sale" | "new" | "sold-out";
  index: number;
}

const ProductCard = ({ name, image, price, originalPrice, category, brand, badge, index }: ProductCardProps) => {
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group bg-card rounded-lg border border-border shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-square bg-secondary overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {badge === "sale" && (
          <span className="absolute top-2 left-2 bg-badge-sale text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">
            -{discount}%
          </span>
        )}
        {badge === "new" && (
          <span className="absolute top-2 left-2 bg-badge-new text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">
            NEW
          </span>
        )}
        {badge === "sold-out" && (
          <span className="absolute top-2 left-2 bg-muted-foreground text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">
            SOLD OUT
          </span>
        )}
        {/* Quick view overlay */}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button className="bg-card text-foreground p-2.5 rounded-full shadow-lg hover:bg-primary hover:text-primary-foreground transition-colors">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{brand} · {category}</p>
        <h3 className="text-sm font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
          {name}
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-base font-bold text-primary">
              KSh {price.toLocaleString()}
            </span>
            {originalPrice && (
              <span className="text-xs text-muted-foreground line-through ml-2">
                KSh {originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          {badge !== "sold-out" && (
            <button className="bg-primary text-primary-foreground p-2 rounded-lg hover:opacity-90 transition-opacity">
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
