import { ShoppingCart, Heart } from "lucide-react";
import { motion } from "framer-motion";
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LazyImage } from "@/components/LazyImage";

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
  const secondaryImg = sorted.length > 1 ? sorted[1]?.image_url : primaryImg;
  const [hovered, setHovered] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      // Logged-in user: check database
      const checkFav = async () => {
        const { data } = await supabase.from("favorites").select("id").eq("user_id", user.id).eq("product_id", id).maybeSingle();
        setIsFav(!!data);
      };
      checkFav();
    } else {
      // Guest user: check localStorage
      const guestFavs = JSON.parse(localStorage.getItem("guestFavorites") || "[]");
      setIsFav(guestFavs.includes(id));
    }
  }, [user?.id, id]);

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (user?.id) {
      // Logged-in user: use database
      if (isFav) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", id);
        setIsFav(false);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, product_id: id });
        setIsFav(true);
        toast.success("Added to wishlist!");
      }
    } else {
      // Guest user: use localStorage
      const guestFavs = JSON.parse(localStorage.getItem("guestFavorites") || "[]");
      if (isFav) {
        const updated = guestFavs.filter((fav: string) => fav !== id);
        localStorage.setItem("guestFavorites", JSON.stringify(updated));
        setIsFav(false);
      } else {
        guestFavs.push(id);
        localStorage.setItem("guestFavorites", JSON.stringify(guestFavs));
        setIsFav(true);
        toast.success("Added to wishlist!");
      }
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setAddingToCart(true);
    await addToCart({ 
      id, 
      name, 
      price, 
      image: primaryImg,
      brand,
      category,
      stock_status: stockStatus,
      original_price: originalPrice || undefined,
    });
    setTimeout(() => setAddingToCart(false), 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group"
    >
      <Link to={`/product/${id}`} className="block bg-white border border-border hover:border-primary transition-colors duration-200 overflow-hidden">
        {/* Image */}
        <div className="relative aspect-square bg-secondary overflow-hidden">
          <motion.div
            animate={{ scale: hovered ? 1.05 : 1 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full h-full"
          >
            <LazyImage
              src={hovered && secondaryImg ? secondaryImg : primaryImg}
              alt={name}
              width={500}
              height={500}
              priority={index < 4} // First 4 products are above-the-fold
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="w-full h-full object-contain p-3 sm:p-4"
            />
          </motion.div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5">
                -{discount}%
              </span>
            )}
            {stockStatus === "out_of_stock" && (
              <span className="bg-foreground text-background text-[10px] font-bold px-1.5 py-0.5">
                SOLD OUT
              </span>
            )}
          </div>

          {/* Wishlist button — always visible on mobile, hover on desktop */}
          <button
            onClick={toggleFav}
            aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
            className={`absolute top-2 right-2 transition-all duration-200 sm:opacity-0 sm:group-hover:opacity-100 ${isFav ? "text-red-500" : "text-muted-foreground"}`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-red-500" : ""}`} />
          </button>

          {/* Add to cart overlay — desktop hover */}
          {stockStatus !== "out_of_stock" && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: hovered ? 0 : "100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute bottom-0 left-0 right-0 hidden sm:block"
            >
              <button
                onClick={handleAddToCart}
                aria-label={`Add ${name} to cart`}
                className={`w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  addingToCart ? "bg-green-500 text-white" : "bg-primary text-white hover:bg-primary/90"
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {addingToCart ? "Added!" : "Add to Cart"}
              </button>
            </motion.div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 sm:p-4 border-t border-border">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 uppercase tracking-wide">{brand}</p>
          <h3 className="text-[11px] sm:text-sm lg:text-base font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors leading-snug min-h-[2.5rem]">
            {name}
          </h3>
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-sm sm:text-base font-bold text-primary">
                KSh {price.toLocaleString()}
              </span>
              {originalPrice && (
                <span className="text-[10px] sm:text-xs text-muted-foreground line-through ml-1.5">
                  KSh {originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            {/* Mobile add to cart */}
            {stockStatus !== "out_of_stock" && (
              <button
                onClick={handleAddToCart}
                aria-label={`Add ${name} to cart`}
                className={`sm:hidden w-7 h-7 flex items-center justify-center border transition-colors ${
                  addingToCart ? "bg-green-500 border-green-500 text-white" : "border-primary text-primary hover:bg-primary hover:text-white"
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default React.memo(ProductCard, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.price === nextProps.price &&
    prevProps.name === nextProps.name &&
    prevProps.images === nextProps.images
  );
});
