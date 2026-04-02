import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Heart, Trash2, ShoppingCart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const FavoritesPage = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("favorites")
        .select("*, products(*, product_images(*))")
        .eq("user_id", user.id);
      setFavorites(data || []);
    };
    load();
  }, [user]);

  const removeFav = async (id: string) => {
    await supabase.from("favorites").delete().eq("id", id);
    setFavorites(f => f.filter(fav => fav.id !== id));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar /><Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Sign in to see your wishlist</h2>
            <Link to="/auth" className="text-primary hover:underline">Sign In</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar /><Header />
      <main className="flex-1 container py-8">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Shop
        </Link>
        <h1 className="text-2xl font-bold mb-6">My Wishlist ({favorites.length})</h1>
        {favorites.length === 0 ? (
          <p className="text-muted-foreground">No favorites yet. Browse products and add some!</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {favorites.map(fav => {
              const p = fav.products;
              if (!p) return null;
              const img = p.product_images?.find((i: any) => i.is_primary)?.image_url || p.product_images?.[0]?.image_url || "/placeholder.svg";
              return (
                <div key={fav.id} className="bg-card rounded-lg border border-border overflow-hidden">
                  <Link to={`/product/${p.id}`}>
                    <img src={img} alt={p.name} className="w-full aspect-square object-contain p-4 bg-secondary" />
                  </Link>
                  <div className="p-4">
                    <p className="text-sm font-medium line-clamp-2">{p.name}</p>
                    <p className="text-sm font-bold text-primary mt-1">KSh {Number(p.price).toLocaleString()}</p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={() => addToCart({ id: p.id, name: p.name, price: p.price, image: img })}>
                        <ShoppingCart className="w-3 h-3 mr-1" /> Add
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => removeFav(fav.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default FavoritesPage;
