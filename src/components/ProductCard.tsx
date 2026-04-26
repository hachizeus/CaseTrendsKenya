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
          
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {discount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                SAVE {discount}%
              </span>
            )}
            {stockStatus === "out_of_stock" && (
              <span className="bg-white/10 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-1 rounded-md">
                SOLD OUT
              </span>
            )}
          </div>

          <button
            onClick={toggleFav}
            className={`absolute top-3 right-3 transition-all rounded-full p-1.5 z-10 ${
              isFav ? "bg-primary/20 text-primary" : "bg-black/50 text-white/70 hover:bg-primary/20 hover:text-primary"
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
          </button>

          {stockStatus !== "out_of_stock" && (
            <div className={`absolute bottom-0 left-0 right-0 transition-transform duration-200 z-10 ${hovered ? 'translate-y-0' : 'translate-y-full'}`}>
              <button
                onClick={handleAddToCart}
                className={`w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  addingToCart ? "bg-green-500 text-white" : "bg-primary text-white hover:bg-primary/80"
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {addingToCart ? "Added!" : "Quick Add"}
              </button>
            </div>
          )}
        </div>

        <div className="p-3">
          <p className="text-[11px] text-primary/70 uppercase tracking-wider">{brand || "General"}</p>
          <h3 className="text-sm font-semibold line-clamp-2 my-1 group-hover:text-primary transition-colors text-white/90">
            {name}
          </h3>
          
          <div className="flex items-center gap-1 my-1.5">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`w-3 h-3 ${s <= avgRating ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
            ))}
          </div>

          {/* Price Section */}
          <div className="mt-2">
            {originalPrice && originalPrice > price ? (
              <>
                {/* Current Price - Large and Bold */}
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-primary">
                    KSh {price.toLocaleString()}
                  </span>
                </div>
                {/* Original Price - Strikethrough but visible */}
                <div className="text-sm text-white/60 line-through">
                  Was: KSh {originalPrice.toLocaleString()}
                </div>
                {/* Savings - Call to action */}
                <div className="text-xs text-green-400 font-medium mt-0.5">
                  You save KSh {(originalPrice - price).toLocaleString()}
                </div>
              </>
            ) : (
              <span className="text-lg font-bold text-primary">
                KSh {price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;