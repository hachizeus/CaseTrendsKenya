import { ShoppingCart, Heart, Star } from "lucide-react";
import { memo, useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
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
  model?: string | null;
  stockStatus: string;
  index: number;
  rating?: number;
  reviewCount?: number;
}

const ProductCard = memo(({ 
  id, name, images, price, originalPrice, brand, stockStatus, rating, reviewCount 
}: ProductCardProps) => {
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const sorted = [...images].sort((a, b) => a.display_order - b.display_order);
  const primaryImg = sorted.find(i => i.is_primary)?.image_url || sorted[0]?.image_url || "/placeholder.svg";
  const secondaryImg = sorted.length > 1 ? sorted[1]?.image_url : primaryImg;
  
  // Preload secondary image on mount
  const [secondaryPreloaded, setSecondaryPreloaded] = useState(false);
  
  useEffect(() => {
    if (secondaryImg !== primaryImg) {
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
  
  // Smooth image transition with timeout
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

  // Handle hover with smooth transition
  const handleMouseEnter = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHovered(true);
    if (secondaryPreloaded && secondaryImg !== primaryImg) {
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
    await addToCart({ id, name, price, image: primaryImg, brand, stock_status: stockStatus });
    setTimeout(() => setAddingToCart(false), 500);
  }, [id, name, price, primaryImg, brand, stockStatus, addToCart]);

  // Cleanup timer
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
        {/* Image */}
        <div className="relative aspect-[4/5] bg-gradient-to-br from-[hsl(240,10%,4%)] to-[hsl(240,10%,8%)] overflow-hidden">
          {/* Main image with crossfade transition */}
          <img
            src={currentImage}
            alt={name}
            className={`w-full h-full object-cover transition-opacity duration-300 ease-in-out ${
              hovered && secondaryPreloaded ? 'opacity-100' : 'opacity-100'
            }`}
            loading="lazy"
            style={{ 
 transition: 'opacity 0.3s ease-in-out',
              opacity: 1
            }}
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {discount > 0 && (
              <span className="bg-primary text-white text-[11px] font-bold px-2 py-1 rounded-md shadow-lg">
                -{discount}% OFF
              </span>
            )}
            {stockStatus === "out_of_stock" && (
              <span className="bg-white/10 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-1 rounded-md">
                SOLD OUT
              </span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={toggleFav}
            className={`absolute top-3 right-3 transition-all rounded-full p-1.5 z-10 ${
              isFav ? "bg-primary/20 text-primary" : "bg-black/50 text-white/70 hover:bg-primary/20 hover:text-primary"
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
          </button>

          {/* Quick add button - desktop only */}
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

        {/* Info */}
        <div className="p-3">
          <p className="text-[11px] text-primary/70 uppercase tracking-wider">{brand}</p>
          <h3 className="text-sm font-semibold line-clamp-2 my-1 group-hover:text-primary transition-colors text-white/90">
            {name}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center gap-1 my-1.5">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`w-3 h-3 ${s <= avgRating ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
            ))}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-base font-bold text-primary">KSh {price.toLocaleString()}</span>
              {originalPrice && (
                <span className="text-[10px] text-white/40 line-through ml-1.5">KSh {originalPrice.toLocaleString()}</span>
              )}
            </div>
            
            {/* Mobile add to cart */}
            {stockStatus !== "out_of_stock" && (
              <button
                onClick={handleAddToCart}
                className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;