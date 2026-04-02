import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, ArrowLeft, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ProductPage = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    loadProduct();
    loadReviews();
    if (user) checkFavorite();
  }, [id, user]);

  const loadProduct = async () => {
    const { data } = await supabase.from("products").select("*, product_images(*)").eq("id", id!).single();
    if (data) {
      setProduct(data);
      const sorted = (data.product_images || []).sort((a: any, b: any) => a.display_order - b.display_order);
      setImages(sorted);
      // Load related
      const { data: related } = await supabase.from("products").select("*, product_images(*)").eq("category", data.category).neq("id", id!).limit(4);
      setRelatedProducts(related || []);
    }
  };

  const loadReviews = async () => {
    const { data } = await supabase.from("reviews").select("*, profiles(display_name)").eq("product_id", id!).order("created_at", { ascending: false });
    setReviews(data || []);
  };

  const checkFavorite = async () => {
    if (!user) return;
    const { data } = await supabase.from("favorites").select("id").eq("user_id", user.id).eq("product_id", id!).maybeSingle();
    setIsFav(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) { toast.error("Please sign in to add favorites"); return; }
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", id!);
      setIsFav(false);
      toast.success("Removed from favorites");
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, product_id: id! });
      setIsFav(true);
      toast.success("Added to favorites!");
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in to review"); return; }
    const { error } = await supabase.from("reviews").upsert({ user_id: user.id, product_id: id!, rating, comment }, { onConflict: "user_id,product_id" });
    if (error) { toast.error(error.message); return; }
    toast.success("Review submitted!");
    setComment("");
    loadReviews();
  };

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "N/A";

  if (!product) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const primaryImage = images[activeImg]?.image_url || "/placeholder.svg";
  const discount = product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <main className="flex-1">
        <div className="container py-6">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Products
          </Link>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Image gallery */}
            <div>
              <motion.div
                key={activeImg}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative aspect-square bg-secondary rounded-xl overflow-hidden mb-4"
              >
                <img src={primaryImage} alt={product.name} className="w-full h-full object-contain p-8" />
                {images.length > 1 && (
                  <>
                    <button onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-card rounded-full shadow-lg">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setActiveImg(i => (i + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-card rounded-full shadow-lg">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </motion.div>
              <div className="flex gap-2">
                {images.map((img: any, i: number) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 rounded-lg border-2 overflow-hidden ${i === activeImg ? "border-primary" : "border-border"}`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product info */}
            <div>
              <p className="text-sm text-muted-foreground">{product.brand} · {product.category}</p>
              <h1 className="text-2xl font-bold mt-1 mb-4">{product.name}</h1>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-bold text-primary">KSh {Number(product.price).toLocaleString()}</span>
                {product.original_price && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">KSh {Number(product.original_price).toLocaleString()}</span>
                    <span className="bg-badge-sale text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">-{discount}%</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">{[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? "text-accent fill-accent" : "text-muted"}`} />)}</div>
                <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
              </div>
              {product.description && <p className="text-muted-foreground mb-6">{product.description}</p>}
              <div className="flex gap-3 mb-6">
                <Button size="lg" onClick={() => addToCart({ id: product.id, name: product.name, price: product.price, image: primaryImage })} disabled={product.stock_status === "out_of_stock"}>
                  <ShoppingCart className="w-4 h-4 mr-2" /> {product.stock_status === "out_of_stock" ? "Out of Stock" : "Add to Cart"}
                </Button>
                <Button size="lg" variant="outline" onClick={toggleFavorite}>
                  <Heart className={`w-4 h-4 ${isFav ? "fill-destructive text-destructive" : ""}`} />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>✅ Genuine product with warranty</p>
                <p>🚚 Free delivery in Nairobi for orders over KSh 5,000</p>
                <p>💳 M-Pesa accepted</p>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-6">Reviews ({reviews.length})</h2>
            {user && (
              <form onSubmit={submitReview} className="bg-secondary p-4 rounded-xl mb-6">
                <p className="font-medium mb-2">Leave a Review</p>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button type="button" key={s} onClick={() => setRating(s)}>
                      <Star className={`w-5 h-5 ${s <= rating ? "text-accent fill-accent" : "text-muted"}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full p-3 rounded-lg border border-border bg-background text-sm resize-none h-20 mb-3"
                />
                <Button type="submit" size="sm">Submit Review</Button>
              </form>
            )}
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="bg-card p-4 rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{r.profiles?.display_name || "Anonymous"}</span>
                    <div className="flex">{[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "text-accent fill-accent" : "text-muted"}`} />)}</div>
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                  <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              ))}
              {reviews.length === 0 && <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>}
            </div>
          </div>

          {/* Related */}
          {relatedProducts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold mb-6">Related Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map((p: any) => {
                  const img = p.product_images?.find((i: any) => i.is_primary)?.image_url || p.product_images?.[0]?.image_url || "/placeholder.svg";
                  return (
                    <Link key={p.id} to={`/product/${p.id}`} className="bg-card rounded-lg border border-border p-4 hover:shadow-card-hover transition-shadow">
                      <img src={img} alt={p.name} className="w-full aspect-square object-contain mb-3" />
                      <p className="text-sm font-medium line-clamp-2">{p.name}</p>
                      <p className="text-sm font-bold text-primary mt-1">KSh {Number(p.price).toLocaleString()}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductPage;
