import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { queryOptionalTable } from "@/lib/supabaseHelpers";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, ArrowLeft, Star, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { getOptimizedImageUrl } from "@/lib/imageOptimization";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ProductDetailsSkeleton } from "@/components/SkeletonVariants";
import ImageLightbox from "@/components/ImageLightbox";

const ProductPage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [specifications, setSpecifications] = useState<any[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomX, setZoomX] = useState(0);
  const [zoomY, setZoomY] = useState(0)

  // Load product data only when id changes
  useEffect(() => {
    if (!id) return;
    loadProduct();
    loadReviews();
  }, [id]);

  // Check favorite when user or product changes
  useEffect(() => {
    if (!id) return;
    checkFavorite();
  }, [id, user]);

  // Pre-fill form if user already reviewed this product
  useEffect(() => {
    if (!user || reviews.length === 0) return;
    const mine = reviews.find(r => r.user_id === user.id);
    if (mine) {
      setExistingReview(mine);
      setRating(mine.rating);
      setComment(mine.comment || "");
    } else {
      setExistingReview(null);
      setRating(5);
      setComment("");
    }
  }, [reviews, user]);

  // Reset meta tags when component unmounts
  useEffect(() => {
    return () => {
      document.title = "Case Trends Kenya";
    };
  }, []);

  // Handle image zoom on mouse move
  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setZoomX(x * 100);
    setZoomY(y * 100);
  };

  const handleImageMouseEnter = () => {
    setZoomLevel(1.8);
  };

  const handleImageMouseLeave = () => {
    setZoomLevel(1);
    setZoomX(0);
    setZoomY(0);
  };

  const splitModels = (value?: string) =>
    (value || "")
      .split(/[\r\n,]+/)
      .map(item => item.trim())
      .filter(Boolean);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("products").select("*, product_images(*)").eq("id", id!).single();
      if (error || !data) {
        console.error("Product not found:", error);
        setProduct(null);
        setLoading(false);
        return;
      }
      
      setProduct(data);
      const sorted = (data.product_images || []).sort((a: any, b: any) => a.display_order - b.display_order);
      setImages(sorted);
      
      // Set SEO meta tags
      const discount = data.original_price ? Math.round(((data.original_price - data.price) / data.original_price) * 100) : 0;
      document.title = `${data.name} | Case Trends Kenya`;
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', `Buy ${data.name} for KSh ${data.price.toLocaleString()} at Case Trends Kenya. ${discount > 0 ? `Save ${discount}% off!` : ''} ${data.description || ''}`.substring(0, 160));
      
      // Fetch product specifications and colors (silently handles 404s for pending migrations)
      const [specsData, colorsData] = await Promise.all([
        queryOptionalTable<any>("product_specifications", "*", [{ column: "product_id", value: id! }], { column: "display_order", asc: true }),
        queryOptionalTable<any>("product_colors", "color", [{ column: "product_id", value: id! }], { column: "display_order", asc: true })
      ]);

      setSpecifications(specsData);
      
      if (colorsData.length > 0) {
        const colorList = colorsData.map((c: any) => c.color);
        setColors(colorList);
        setSelectedColor(colorList[0]);
      }
      
      const { data: related } = await supabase.from("products").select("*, product_images(*)").eq("category", data.category).neq("id", id!).limit(4);
      setRelatedProducts(related || []);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    const { data: reviewData } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", id!)
      .order("created_at", { ascending: false });
    if (!reviewData || reviewData.length === 0) { setReviews([]); return; }

    // Fetch display names from profiles for each reviewer
    const userIds = [...new Set(reviewData.map((r: any) => r.user_id))];
    const { data: profileData } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    const profileMap = Object.fromEntries((profileData || []).map((p: any) => [p.user_id, p.display_name]));
    setReviews(reviewData.map((r: any) => ({ ...r, display_name: profileMap[r.user_id] || "Anonymous" })));
  };

  const checkFavorite = async () => {
    if (user) {
      const { data } = await supabase.from("favorites").select("id").eq("user_id", user.id).eq("product_id", id!).maybeSingle();
      setIsFav(!!data);
    } else {
      // Check guest favorites in localStorage
      const guestFavIds = JSON.parse(localStorage.getItem("guestFavorites") || "[]");
      setIsFav(guestFavIds.includes(id));
    }
  };

  const toggleFavorite = async () => {
    if (user) {
      // Logged-in user: use database
      if (isFav) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", id!);
        setIsFav(false);
        toast.success("Removed from favorites");
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, product_id: id! });
        setIsFav(true);
        toast.success("Added to favorites!");
      }
    } else {
      // Guest user: use localStorage
      const guestFavIds = JSON.parse(localStorage.getItem("guestFavorites") || "[]");
      if (isFav) {
        const updated = guestFavIds.filter((pid: string) => pid !== id);
        localStorage.setItem("guestFavorites", JSON.stringify(updated));
        setIsFav(false);
        toast.success("Removed from favorites");
      } else {
        guestFavIds.push(id);
        localStorage.setItem("guestFavorites", JSON.stringify(guestFavIds));
        setIsFav(true);
        toast.success("Added to favorites!");
      }
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in to review"); return; }
    setSubmitting(true);
    try {
      // Check if user already has a review for this product
      const { data: existingUserReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("product_id", id!)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (existingUserReview) {
        toast.error("You can only post one review per product. Delete your current review to post a new one.");
        setSubmitting(false);
        return;
      }
      
      // Insert new review
      const { error } = await supabase
        .from("reviews")
        .insert({ user_id: user.id, product_id: id!, rating, comment: comment || null });
      if (error) { toast.error(error.message); setSubmitting(false); return; }
      toast.success("Review posted!");
      setRating(5);
      setComment("");
      await loadReviews();
      queryClient.invalidateQueries({ queryKey: ["products"], exact: false });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!window.confirm("Delete this review?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
    if (error) { toast.error(error.message); return; }
    toast.success("Review deleted");
    await loadReviews();
    queryClient.invalidateQueries({ queryKey: ["products"], exact: false });
  };

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <Header />
        <main className="flex-1">
          <div className="container py-6">
            <div className="mb-6 h-4 bg-secondary rounded w-32" />
            <ProductDetailsSkeleton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <Header />
        <div className="flex-1 flex items-center justify-center bg-secondary">
          <div className="text-center px-4 py-12">
            <p className="text-2xl font-bold text-foreground mb-2">Product Not Found</p>
            <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist or has been removed.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/products" className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                Browse All Products
              </Link>
              <Link to="/" className="inline-block bg-card border border-border px-6 py-2 rounded-lg hover:bg-secondary transition-colors">
                Go to Home
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const primaryImage = images[activeImg]?.image_url || "/placeholder.svg";
  const optimizedPrimaryImage = getOptimizedImageUrl(primaryImage, {
    width: 1200,
    height: 1200,
    quality: 80,
    resize: "contain",
  });
  const discount = product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      <Header />
      <main className="flex-1">
        {/* Product Hero Section - Fits in viewport */}
        <div className="border-b border-border bg-white">
          <div className="container py-4 md:py-6">
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {/* Image gallery - constrained height */}
              <div className="md:col-span-1 flex flex-col max-h-[400px] md:max-h-[450px]">
                <motion.div
                  key={activeImg}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative flex-1 rounded-xl overflow-hidden mb-2 sm:mb-3 flex items-center justify-center group cursor-zoom-in"
                  onMouseMove={handleImageMouseMove}
                  onMouseEnter={handleImageMouseEnter}
                  onMouseLeave={handleImageMouseLeave}
                >
                  <img 
                    src={optimizedPrimaryImage} 
                    alt={product.name} 
                    width={500} 
                    height={500} 
                    className="w-full h-full object-contain p-3 sm:p-4 max-w-full transition-transform duration-200 ease-out" 
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: `${zoomX}% ${zoomY}%`,
                    }}
                  />
                  <ImageLightbox images={images} initialIndex={activeImg} />
                  {images.length > 1 && (
                    <>
                      <button 
                        aria-label="Previous image" 
                        onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)} 
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-card rounded-full shadow-lg hover:bg-primary hover:text-white transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button 
                        aria-label="Next image" 
                        onClick={() => setActiveImg(i => (i + 1) % images.length)} 
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-card rounded-full shadow-lg hover:bg-primary hover:text-white transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </motion.div>
                
                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    {images.map((img: any, i: number) => (
                      <button
                        key={img.id}
                        aria-label={`View image ${i + 1} of ${images.length}`}
                        onClick={() => setActiveImg(i)}
                        className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 overflow-hidden transition-all hover:border-primary ${i === activeImg ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
                      >
                        <img src={getOptimizedImageUrl(img.image_url, {
                          width: 80,
                          height: 80,
                          quality: 60,
                          resize: "contain",
                        })} alt={`Thumbnail ${i + 1}: ${product.name}`} width={48} height={48} loading="lazy" decoding="async" className="w-full h-full object-contain p-1 bg-secondary" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product info - optimized layout with smaller Phone Models section */}
              <div className="md:col-span-2">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-primary uppercase tracking-widest">{product.brand}</p>
                    <h1 className="text-xl sm:text-2xl font-bold mt-1 mb-1 leading-tight">{product.name}</h1>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </div>

                  {/* Price section - compact */}
                  <div className="bg-secondary/50 p-3 rounded-lg">
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl sm:text-3xl font-bold text-primary">KSh {Number(product.price).toLocaleString()}</span>
                      {product.original_price && (
                        <>
                          <span className="text-xs sm:text-sm text-muted-foreground line-through">KSh {Number(product.original_price).toLocaleString()}</span>
                          <span className="bg-red-100 text-red-700 text-xs font-bold px-1.5 py-0.5 rounded">-{discount}%</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= Math.round(avgRating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {reviews.length > 0 ? `${avgRating.toFixed(1)} (${reviews.length})` : "No reviews"}
                      </span>
                    </div>
                  </div>

                  {/* Stock & Trust badges - compact row */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${product.stock_status === "in_stock" ? "bg-green-100 text-green-700" : product.stock_status === "low_stock" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                      {product.stock_status === "in_stock" ? "In Stock" : product.stock_status === "low_stock" ? "Low Stock" : "Sold Out"}
                    </span>
                    {product.stock_quantity > 0 && (
                      <span className="text-muted-foreground text-xs">
                        ({product.stock_quantity} available)
                      </span>
                    )}
                    <span className="text-muted-foreground">✅ Genuine</span>
                    <span className="text-muted-foreground">🚚 Free delivery over KSh 5,000</span>
                  </div>

                  {/* Description - compact */}
                  {product.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{product.description}</p>
                  )}

                  {/* Phone Models - COMPACT VERSION with smaller chips */}
                  {splitModels(product.model).length > 0 && (
                    <div className="bg-secondary/30 p-2 rounded-lg">
                      <p className="text-xs font-semibold mb-1.5">Phone Models</p>
                      <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
                        {splitModels(product.model).map(model => (
                          <span key={model} className="text-[11px] bg-card border border-border px-2 py-0.5 rounded-full whitespace-nowrap">
                            {model}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Color Selector - compact */}
                  {colors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold">Select Color</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                        {colors.map(color => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`px-2 py-1 text-[11px] font-medium rounded-lg border transition-all ${
                              selectedColor === color
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary text-foreground"
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA Buttons - NOW VISIBLE WITHOUT SCROLLING */}
                <div className="flex gap-2 pt-3 mt-3 border-t border-border sticky bottom-0 bg-white/95 backdrop-blur-sm md:static md:bg-transparent md:backdrop-blur-none">
                  <Button 
                    size="default" 
                    className="flex-1 text-sm py-2"
                    onClick={() => addToCart({ 
                      id: product.id, 
                      name: product.name, 
                      price: product.price, 
                      image: primaryImage,
                      color: selectedColor || undefined
                    })} 
                    disabled={product.stock_status === "out_of_stock"}
                  >
                    <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> 
                    {product.stock_status === "out_of_stock" ? "Out of Stock" : "Add to Cart"}
                  </Button>
                  <Button 
                    size="default" 
                    variant="outline"
                    onClick={toggleFavorite}
                    className="px-3"
                    title={isFav ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Below the fold content */}
        <div className="container py-8 md:py-12 space-y-12">
          {/* Product Specifications */}
          {specifications.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Specifications</h2>
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {specifications.map((spec: any) => (
                    <div key={spec.id} className="pb-4 border-b border-border last:border-b-0 md:last-of-type:border-b-0">
                      <p className="text-sm font-medium text-muted-foreground mb-1">{spec.spec_key}</p>
                      <p className="text-base font-semibold">{spec.spec_value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reviews */}
          <div>
            <h2 className="text-xl font-bold mb-6">Reviews ({reviews.length})</h2>

            {user ? (
              !existingReview ? (
                <form onSubmit={submitReview} className="bg-secondary p-4 rounded-xl mb-6">
                  <p className="font-medium mb-2">Leave a Review</p>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button type="button" key={s} onClick={() => setRating(s)}>
                        <Star className={`w-5 h-5 ${s <= rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Share your experience..."
                    className="w-full p-3 rounded-lg border border-border bg-background text-sm resize-none h-20 mb-3"
                  />
                  <Button type="submit" size="sm" disabled={submitting}>
                    {submitting ? "Saving..." : "Submit Review"}
                  </Button>
                </form>
              ) : (
                <div className="bg-secondary p-4 rounded-xl mb-6">
                  <p className="font-medium mb-3">Your Review</p>
                  <p className="text-sm text-muted-foreground mb-2">You can only have one review per product. Delete your current review to post a new one.</p>
                </div>
              )
            ) : (
              <div className="bg-secondary p-4 rounded-xl mb-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">Sign in to leave a review</p>
                <Link to="/auth">
                  <Button size="sm" variant="outline">Sign In</Button>
                </Link>
              </div>
            )}

            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="bg-card p-4 rounded-xl border border-border group relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{r.display_name}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                  <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
                  
                  {/* Delete button - appears on hover for review author */}
                  {user && user.id === r.user_id && (
                    <button
                      onClick={() => deleteReview(r.id)}
                      aria-label="Delete review"
                      title="Delete review"
                      className="absolute top-3 right-3 p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {reviews.length === 0 && <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Related Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {relatedProducts.map((p: any) => {
                  const img = p.product_images?.find((i: any) => i.is_primary)?.image_url || p.product_images?.[0]?.image_url || "/placeholder.svg";
                  return (
                    <Link key={p.id} to={`/product/${p.id}`} className="bg-card rounded-lg border border-border p-4 hover:shadow-card-hover transition-shadow">
                      <img src={getOptimizedImageUrl(img, {
                        width: 320,
                        height: 320,
                        quality: 65,
                        resize: "contain",
                      })} alt={p.name} width={200} height={200} loading="lazy" decoding="async" className="w-full aspect-square object-contain mb-3" />
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