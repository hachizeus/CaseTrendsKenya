import { ShoppingCart, Heart, Star } from "lucide-react";
import { memo, useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductCardProps {
  id: string;
  name: string;
  images?: { image_url: string; is_primary: boolean; display_order: number }[] | null;
  price: number;
  originalPrice?: number | null;
  category?: string;
  brand?: string;
  model?: string | null;
  stockStatus?: string;
  index?: number;
  rating?: number;
  reviewCount?: number;
}

const ProductCard = memo(({ 
  id, name, images, price, originalPrice, brand, stockStatus, rating 
}: ProductCardProps) => {
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  
  // SAFE: Check if images exists and is an array
  const imageArray = Array.isArray(images) ? images : [];
  const sorted = [...imageArray].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  const primaryImg = sorted.find(i => i.is_primary)?.image_url || sorted[0]?.image_url || "/placeholder.svg";
  const secondaryImg = sorted.length > 1 ? sorted[1]?.image_url : primaryImg;
  
  const [secondaryPreloaded, setSecondaryPreloaded] = useState(false);
  
  useEffect(() => {
    if (secondaryImg && secondaryImg !== primaryImg) {
      const img = new Image();
      img.src = secondaryImg;
      img.onload = () => setSecondaryPreloaded(true);
    } else {
      setSecondaryPreloaded(true);
    }
  }, [secondaryImg, primaryImg]);
  
  const avgRating = rating ? Math.max(0, Math.min(5, rating)) : 0;
  const [hovered, setHovered] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [currentImage, setCurrentImage] = useState(primaryImg);
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  const hoverTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (user?.id) {
      const checkFav = async () => {
        const { data } = await (supabase.from("favorites") as any)
          .select("id")
          .eq("user_id", user.id)
          .eq("product_id", id)
          .maybeSingle();
        setIsFav(!!data);
      };
      checkFav();
    } else {
      const guestFavs = JSON.parse(localStorage.getItem("guestFavorites") || "[]");
      setIsFav(guestFavs.includes(id));
    }
  }, [user?.id, id]);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHovered(true);
    if (secondaryPreloaded && secondaryImg !== primaryImg && secondaryImg) {
      setCurrentImage(secondaryImg);
    }
  }, [secondaryPreloaded, secondaryImg, primaryImg]);

  const handleMouseLeave = useCallback(() => {
    hoverTimerRef.current = setTimeout(() => {
      setHovered(false);
      setCurrentImage(primaryImg);
    }, 50);
  }, [primaryImg]);

  const toggleFav = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (user?.id) {
      if (isFav) {
        await (supabase.from("favorites") as any).delete().eq("user_id", user.id).eq("product_id", id);
        setIsFav(false);
      } else {
        await (supabase.from("favorites") as any).insert({ user_id: user.id, product_id: id });
        setIsFav(true);
        toast.success("Added to wishlist! ❤️");
      }
    } else {
      const guestFavs = JSON.parse(localStorage.getItem("guestFavorites") || "[]");
      if (isFav) {
        const updated = guestFavs.filter((fav: string) => fav !== id);
        localStorage.setItem("guestFavorites", JSON.stringify(updated));
        setIsFav(false);
      } else {
        guestFavs.push(id);
        localStorage.setItem("guestFavorites", JSON.stringify(guestFavs));
        setIsFav(true);
        toast.success("Added to wishlist! ❤️");
      }
    }
  }, [user?.id, id, isFav]);

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingToCart(true);
    await addToCart({ id, name, price, image: primaryImg, brand: brand || "", stock_status: stockStatus || "in_stock" });
    setTimeout(() => setAddingToCart(false), 500);
  }, [id, name, price, primaryImg, brand, stockStatus, addToCart]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group h-full w-full min-w-0"
    >
      <Link to={`/product/${id}`} className="block h-full bg-[hsl(240,10%,6%)] hover:border-primary/50 border border-white/5 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-primary/5">
        <div className="relative aspect-[4/5] bg-gradient-to-br from-[hsl(240,10%,4%)] to-[hsl(240,10%,8%)] overflow-hidden">
          <img
            src={currentImage}
            alt={name}
            className="w-full h-full object-cover transition-opacity duration-300 ease-in-out"
            loading="lazy"
          />
          
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {discount > 0 && (
              <span className="bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md shadow-lg">
                SAVE {discount}%
              </span>
            )}
            {stockStatus === "out_of_stock" && (
              <span className="bg-white/10 backdrop-blur-sm text-white text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">
                SOLD OUT
              </span>
            )}
          </div>

          <button
            onClick={toggleFav}
            className={`absolute top-2 right-2 transition-all rounded-full p-1.5 z-10 ${
              isFav ? "bg-primary/20 text-primary" : "bg-black/50 text-white/70 hover:bg-primary/20 hover:text-primary"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFav ? "fill-current" : ""}`} />
          </button>

          {/* Quick Add Button - Shows on hover for desktop only */}
          {stockStatus !== "out_of_stock" && (
            <div className={`hidden sm:block absolute bottom-0 left-0 right-0 transition-transform duration-300 z-10 ${hovered ? 'translate-y-0' : 'translate-y-full'}`}>
              <button
                onClick={handleAddToCart}
                className={`w-full py-2 text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  addingToCart ? "bg-green-500 text-white" : "bg-primary text-white hover:bg-primary/80"
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {addingToCart ? "Added!" : "Quick Add"}
              </button>
            </div>
          )}
        </div>

        <div className="p-2 sm:p-3 flex flex-col">
          {/* Brand - fixed height */}
          <div className="h-4 sm:h-5">
            <p className="text-[10px] sm:text-[11px] text-primary/70 uppercase tracking-wider truncate">
              {brand || "General"}
            </p>
          </div>
          
          {/* Product Name - FIXED HEIGHT for exactly 2 lines, even if text is short */}
          <div className="h-8 sm:h-10 mt-1">
            <h3 className="text-xs sm:text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors text-white/90 break-words">
              {name}
            </h3>
          </div>
          
          {/* Review Stars - fixed height */}
          <div className="h-4 sm:h-5 flex items-center gap-0.5 sm:gap-1 mt-1">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${s <= avgRating ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
            ))}
          </div>

          {/* Price Section - fixed height container */}
          <div className="mt-2 min-h-[4rem] sm:min-h-[5rem]">
            {originalPrice && originalPrice > price ? (
              <div className="space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm sm:text-lg font-bold text-primary whitespace-nowrap">
                    KSh {price.toLocaleString()}
                  </span>
                  <button
                    onClick={handleAddToCart}
                    className="sm:hidden w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg bg-primary text-white"
                    aria-label="Add to cart"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-[10px] sm:text-xs text-white/50 line-through truncate">
                  Was: KSh {originalPrice.toLocaleString()}
                </div>
                <div className="text-[9px] sm:text-[10px] text-green-400 font-medium truncate">
                  You save KSh {(originalPrice - price).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm sm:text-lg font-bold text-primary whitespace-nowrap">
                  KSh {price.toLocaleString()}
                </span>
                <button
                  onClick={handleAddToCart}
                  className="sm:hidden w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg bg-primary text-white"
                  aria-label="Add to cart"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;