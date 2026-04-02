import { ShoppingCart, Eye, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductCardProps {
  id: string;
  name: string;
  images: { image_url: string; is_primary: boolean; display_order: number }[];
  price: number;
  originalPrice?: number | null;
  category: string;
  brand: string;
  stockStatus: string;
  index: number;
}

const ProductCard = ({ id, name, images, price, originalPrice, category, brand, stockStatus, index }: ProductCardProps) => {
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const sorted = [...images].sort((a, b) => a.display_order - b.display_order);
  const primaryImg = sorted.find(i => i.is_primary)?.image_url || sorted[0]?.image_url || "/placeholder.svg";
  const secondaryImg = sorted.length > 1 ? (sorted[1]?.image_url || primaryImg) : primaryImg;
  const [hovered, setHovered] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error("Sign in to add favorites"); return; }
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", id);
      setIsFav(false);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, product_id: id });
      setIsFav(true);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ id, name, price, image: primaryImg });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={`/product/${id}`} className="group block bg-card rounded-lg border border-border shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden">
        <div className="relative aspect-square bg-secondary overflow-hidden">
          <img
            src={hovered ? secondaryImg : primaryImg}
            alt={name}
            className="w-full h-full object-contain p-4 transition-all duration-500 ease-in-out"
            loading="lazy"
          />
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-badge-sale text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">
              -{discount}%
            </span>
          )}
          {stockStatus === "out_of_stock" && (
            <span className="absolute top-2 left-2 bg-muted-foreground text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">
              SOLD OUT
            </span>
          )}
          {/* Actions overlay */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button onClick={toggleFav} className="bg-card text-foreground p-2.5 rounded-full shadow-lg hover:bg-destructive hover:text-destructive-foreground transition-colors">
              <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
            </button>
            <Link to={`/product/${id}`} className="bg-card text-foreground p-2.5 rounded-full shadow-lg hover:bg-primary hover:text-primary-foreground transition-colors">
              <Eye className="w-4 h-4" />
            </Link>
          </div>
        </div>

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
            {stockStatus !== "out_of_stock" && (
              <button onClick={handleAddToCart} className="bg-primary text-primary-foreground p-2 rounded-lg hover:opacity-90 transition-opacity">
                <ShoppingCart className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
