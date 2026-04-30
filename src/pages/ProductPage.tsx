import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { queryOptionalTable } from "@/lib/supabaseHelpers";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, ArrowLeft, Star, ChevronLeft, ChevronRight, Trash2, Check, Minus, Plus, HardDrive, Package, Zap, Shield, Truck, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { getOptimizedImageUrl } from "@/lib/imageOptimization";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ProductDetailsSkeleton } from "@/components/SkeletonVariants";
import ImageLightbox from "@/components/ImageLightbox";
import ProductCard from "@/components/ProductCard";

// Define local types for your tables
interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  description?: string;
  brand?: string;
  category?: string;
  model?: string;
  stock_status: string;
  stock_quantity?: number;
  sku?: string;
  product_images?: ProductImage[];
}

interface ProductImage {
  id: string;
  image_url: string;
  display_order: number;
}

interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  display_name?: string;
}

interface StorageVariant {
  id: string;
  product_id: string;
  storage: string;
  stock_quantity: number;
  sku_suffix: string;
  price_adjustment: number;
  display_order: number;
}

const ProductPage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [specifications, setSpecifications] = useState<any[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomX, setZoomX] = useState(0);
  const [zoomY, setZoomY] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [maxStock, setMaxStock] = useState(10);
  
  // Storage variants state with price adjustment
  const [storageVariants, setStorageVariants] = useState<StorageVariant[]>([]);
  const [selectedStorage, setSelectedStorage] = useState<StorageVariant | null>(null);
  
  // Dynamic pricing state
  const [basePrice, setBasePrice] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);

  // Product features - static for now, but could come from database
  const productFeatures = [
    "25W Super Fast Charging support",
    "USB-C to USB-C cable included",
    "Intelligent power delivery (PPS) for safe charging",
    "Compact, travel-friendly design",
    "Compatible with Samsung Galaxy & other USB-C devices"
  ];

  useEffect(() => {
    if (!id) return;
    loadProduct();
    loadReviews();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    checkFavorite();
  }, [id, user]);

  useEffect(() => {
    if (!user || reviews.length === 0) return;
    const mine = reviews.find((r: any) => r.user_id === user.id);
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

  useEffect(() => {
    return () => {
      document.title = "Case Trends Kenya";
    };
  }, []);

  // Set base price from product
  useEffect(() => {
    if (product) {
      setBasePrice(product.price);
    }
  }, [product]);

  // Calculate final price based on selected storage adjustment
  useEffect(() => {
    const adjustment = selectedStorage?.price_adjustment || 0;
    setFinalPrice(basePrice + adjustment);
  }, [basePrice, selectedStorage]);

  // Update max stock based on selected storage variant or base stock
  useEffect(() => {
    if (selectedStorage) {
      setMaxStock(selectedStorage.stock_quantity);
    } else if (product?.stock_quantity) {
      setMaxStock(product.stock_quantity);
    } else if (product?.stock_status === "in_stock") {
      setMaxStock(10);
    } else if (product?.stock_status === "low_stock") {
      setMaxStock(3);
    } else {
      setMaxStock(0);
    }
  }, [selectedStorage, product]);

  // Reset quantity when selected storage changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedStorage]);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (maxStock > 0 && newQuantity > maxStock) {
      toast.error(`Only ${maxStock} items available in stock`);
      return;
    }
    setQuantity(newQuantity);
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setZoomX(x * 100);
    setZoomY(y * 100);
  };

  const handleImageMouseEnter = () => setZoomLevel(1.8);
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
      const { data, error } = await supabase
        .from("products" as any)
        .select("*, product_images(*)")
        .eq("id", id!)
        .single();

      if (error || !data) {
        console.error("Product not found:", error);
        setProduct(null);
        setLoading(false);
        return;
      }
      
      setProduct(data as Product);
      const sorted = ((data?.product_images as ProductImage[]) || []).sort((a, b) => a.display_order - b.display_order);
      setImages(sorted);
      
      document.title = `${data?.name} | Case Trends Kenya`;
      
      // Load storage variants with price adjustment
      const { data: storageData } = await supabase
        .from("product_storage_variants" as any)
        .select("*")
        .eq("product_id", id!)
        .order("display_order");
      
      if (storageData && storageData.length > 0) {
        setStorageVariants(storageData);
        setSelectedStorage(storageData[0]);
      }
      
      const [specsData, colorsData] = await Promise.all([
        queryOptionalTable<any>("product_specifications", "*", [{ column: "product_id", value: id! }], { column: "display_order", asc: true }),
        queryOptionalTable<any>("product_colors", "color", [{ column: "product_id", value: id! }], { column: "display_order", asc: true })
      ]);

      setSpecifications(specsData);
      
      // Filter out features from colors - only keep actual color names
      if (colorsData.length > 0) {
        // List of common color names to filter
        const validColors = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Purple", "Pink", "Gold", "Silver", "Gray", "Brown", "Orange", "Navy", "Coral", "Mint", "Lavender", "Rose", "Space Gray", "Midnight", "Starlight", "Product Red", "Sierra Blue", "Alpine Green", "Deep Purple"];
        
        const actualColors = colorsData
          .map((c: any) => c.color)
          .filter((color: string) => {
            // Check if it's an actual color (not a feature)
            const isColor = validColors.some(validColor => 
              color.toLowerCase().includes(validColor.toLowerCase())
            );
            // Also accept if it's a short word (less than 15 chars) that's not obviously a feature
            const isShortText = color.length < 15;
            return isColor || (isShortText && !color.includes("W") && !color.includes("Fast"));
          });
        
        setColors(actualColors);
        if (actualColors.length > 0) {
          setSelectedColor(actualColors[0]);
        }
      }
      
      const { data: related } = await supabase
        .from("products" as any)
        .select("*, product_images(*)")
        .eq("category", (data as any)?.category)
        .neq("id", id!)
        .limit(4);
        
      setRelatedProducts(related || []);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    const { data: reviewData } = await supabase
      .from("reviews" as any)
      .select("*")
      .eq("product_id", id!)
      .order("created_at", { ascending: false });
      
    if (!reviewData || reviewData.length === 0) { 
      setReviews([]); 
      return; 
    }

    const userIds = [...new Set(reviewData.map((r: any) => r.user_id))];
    const { data: profileData } = await supabase
      .from("profiles" as any)
      .select("user_id, display_name")
      .in("user_id", userIds);

    const profileMap = Object.fromEntries((profileData || []).map((p: any) => [p.user_id, p.display_name]));
    setReviews(reviewData.map((r: any) => ({ ...r, display_name: profileMap[r.user_id] || "Anonymous" })));
  };

  const checkFavorite = async () => {
    if (user) {
      const { data } = await supabase
        .from("favorites" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", id!)
        .maybeSingle();
      setIsFav(!!data);
    } else {
      const guestFavIds = JSON.parse(localStorage.getItem("guestFavorites") || "[]");
      setIsFav(guestFavIds.includes(id));
    }
  };

  const toggleFavorite = async () => {
    if (user) {
      if (isFav) {
        await supabase
          .from("favorites" as any)
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", id!);
        setIsFav(false);
        toast.success("Removed from favorites");
      } else {
        await supabase
          .from("favorites" as any)
          .insert({ user_id: user.id, product_id: id! });
        setIsFav(true);
        toast.success("Added to favorites!");
      }
    } else {
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

  const handleAddToCart = () => {
    if (colors.length > 0 && !selectedColor) {
      toast.error("Please select a color before adding to cart");
      return;
    }

    if (maxStock > 0 && quantity > maxStock) {
      toast.error(`Only ${maxStock} items available in stock`);
      return;
    }

    const primaryImage = images[activeImg]?.image_url || "/placeholder.svg";
    const storageText = selectedStorage ? ` ${selectedStorage.storage}` : "";
    const colorText = selectedColor ? ` (${selectedColor})` : "";
    
    // Use final price which includes storage adjustment
    const itemPrice = finalPrice;
    
    for (let i = 0; i < quantity; i++) {
      addToCart({ 
        id: product!.id, 
        name: `${product!.name}${storageText}`,
        price: itemPrice,
        image: primaryImage,
        brand: product!.brand || '',
        category: product!.category || '',
        stock_status: product!.stock_status || 'in_stock',
        original_price: product!.original_price || undefined,
        color: selectedColor || undefined,
        storage: selectedStorage?.storage || undefined,
        sku: product!.sku && selectedStorage ? `${product!.sku}-${selectedStorage.sku_suffix}` : product!.sku
      } as any);
    }
    
    const priceInfo = selectedStorage?.price_adjustment 
      ? ` (Base KSh ${basePrice.toLocaleString()} + ${selectedStorage.price_adjustment.toLocaleString()})`
      : '';
    
    toast.success(`${quantity}x ${product!.name}${storageText}${colorText}${priceInfo} added to cart!`);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in to review"); return; }
    setSubmitting(true);
    try {
      const { data: existingUserReview } = await supabase
        .from("reviews" as any)
        .select("id")
        .eq("product_id", id!)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (existingUserReview) {
        toast.error("You can only post one review per product.");
        setSubmitting(false);
        return;
      }
      
      const { error } = await supabase
        .from("reviews" as any)
        .insert({ user_id: user.id, product_id: id!, rating, comment: comment || null });
        
      if (error) { 
        toast.error(error.message); 
        setSubmitting(false); 
        return; 
      }
      
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
    const { error } = await supabase
      .from("reviews" as any)
      .delete()
      .eq("id", reviewId);
      
    if (error) { 
      toast.error(error.message); 
      return; 
    }
    
    toast.success("Review deleted");
    await loadReviews();
    queryClient.invalidateQueries({ queryKey: ["products"], exact: false });
  };

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]">
        <TopBar />
        <Header />
        <main className="flex-1">
          <div className="container py-6">
            <div className="mb-6 h-4 bg-white/5 rounded w-32 animate-pulse" />
            <ProductDetailsSkeleton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]">
        <TopBar />
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4 py-12">
            <p className="text-2xl font-bold text-white mb-2">Product Not Found</p>
            <p className="text-white/50 mb-6">The product you're looking for doesn't exist or has been removed.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/products" className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/80 transition-colors">
                Browse All Products
              </Link>
              <Link to="/" className="inline-block bg-white/10 border border-white/10 px-6 py-2 rounded-lg hover:bg-white/20 transition-colors text-white">
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
  const discount = product.original_price ? Math.round(((product.original_price - finalPrice) / product.original_price) * 100) : 0;
  const totalPrice = finalPrice * quantity;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]">
      <TopBar />
      <Header />
      <main className="flex-1">
        <div className="border-b border-white/10">
          <div className="container py-4 md:py-6">
            <Link to="/" className="flex items-center gap-2 text-sm text-white/50 hover:text-primary mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {/* Image gallery */}
              <div className="md:col-span-1 flex flex-col max-h-[400px] md:max-h-[450px]">
                <div
                  key={activeImg}
                  className="relative flex-1 rounded-xl overflow-hidden mb-2 sm:mb-3 flex items-center justify-center group cursor-zoom-in bg-black/30"
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
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 backdrop-blur-sm rounded-full shadow-lg hover:bg-primary transition-colors text-white"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button 
                        aria-label="Next image" 
                        onClick={() => setActiveImg(i => (i + 1) % images.length)} 
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 backdrop-blur-sm rounded-full shadow-lg hover:bg-primary transition-colors text-white"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
                
                {images.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    {images.map((img: ProductImage, i: number) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImg(i)}
                        className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 overflow-hidden transition-all hover:border-primary ${
                          i === activeImg ? "border-primary ring-2 ring-primary/30" : "border-white/10"
                        }`}
                      >
                        <img src={getOptimizedImageUrl(img.image_url, {
                          width: 80,
                          height: 80,
                          quality: 60,
                          resize: "contain",
                        })} alt={`Thumbnail ${i + 1}`} width={48} height={48} loading="lazy" className="w-full h-full object-contain p-1 bg-black/30" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product info */}
              <div className="md:col-span-2">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-primary uppercase tracking-widest">{product.brand}</p>
                    <h1 className="text-xl sm:text-2xl font-bold mt-1 mb-1 leading-tight text-white">{product.name}</h1>
                    <p className="text-xs text-white/40">{product.category}</p>
                  </div>

                  <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-2xl sm:text-3xl font-bold text-primary">
                        KSh {finalPrice.toLocaleString()}
                      </span>
                      {product.original_price && (
                        <>
                          <span className="text-xs sm:text-sm text-white/40 line-through">
                            KSh {product.original_price.toLocaleString()}
                          </span>
                          <span className="bg-primary/20 text-primary text-xs font-bold px-1.5 py-0.5 rounded">
                            -{discount}%
                          </span>
                        </>
                      )}
                    </div>
                    
                    {/* Show price breakdown if storage has adjustment */}
                    {selectedStorage && selectedStorage.price_adjustment > 0 && (
                      <div className="mt-2 text-xs text-white/40">
                        Base: KSh {basePrice.toLocaleString()} + {selectedStorage.storage}: +KSh {selectedStorage.price_adjustment.toLocaleString()}
                      </div>
                    )}
                    
                    {quantity > 1 && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <p className="text-sm text-white/60">
                          Subtotal: <span className="font-bold text-primary">KSh {totalPrice.toLocaleString()}</span>
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= Math.round(avgRating) ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-white/40">
                        {reviews.length > 0 ? `${avgRating.toFixed(1)} (${reviews.length})` : "No reviews"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      maxStock > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {maxStock > 0 ? "In Stock" : "Out of Stock"}
                    </span>
                    {maxStock > 0 && maxStock < 10 && (
                      <span className="text-yellow-400 text-xs">
                        Only {maxStock} left in stock!
                      </span>
                    )}
                    <span className="text-white/40 text-xs">✅ Genuine Product</span>
                    <span className="text-white/40 text-xs">🛡️ 1 Year Warranty</span>
                  </div>

                  {product.description && (
                    <p className="text-xs text-white/50 leading-relaxed">{product.description}</p>
                  )}

                  {/* Storage Selector with Price Display */}
                  {storageVariants.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-white flex items-center gap-2">
                          <HardDrive className="w-3 h-3" />
                          Select Storage
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {storageVariants.map((variant) => {
                          const variantPrice = basePrice + variant.price_adjustment;
                          return (
                            <button
                              key={variant.id}
                              onClick={() => setSelectedStorage(variant)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                                selectedStorage?.id === variant.id
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-white/10 hover:border-primary/50 text-white/70 hover:text-white"
                              }`}
                            >
                              <div className="flex flex-col items-center">
                                <span>{variant.storage}</span>
                                {variant.price_adjustment > 0 && (
                                  <span className="text-xs text-primary/70">
                                    +KSh {variant.price_adjustment.toLocaleString()}
                                  </span>
                                )}
                                {variant.price_adjustment === 0 && (
                                  <span className="text-xs text-white/30">Base</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Color Selector - Only show if there are actual colors */}
                  {colors.length > 0 && colors[0] !== "🔹 25W Super Fast Charging support" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-white">Select Color</p>
                        {selectedColor && (
                          <span className="text-xs text-primary">Selected: {selectedColor}</span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                        {colors.map(color => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`px-2 py-1.5 text-[11px] font-medium rounded-lg border-2 transition-all ${
                              selectedColor === color
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-white/10 hover:border-primary/50 text-white/70 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1">
                              {selectedColor === color && <Check className="w-3 h-3" />}
                              {color}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity Selector */}
                  {maxStock > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-white">Quantity</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleQuantityChange(quantity - 1)}
                          disabled={quantity <= 1}
                          className="p-1.5 rounded-lg border border-white/10 hover:border-primary text-white hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max={maxStock}
                            value={quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val)) {
                                handleQuantityChange(val);
                              }
                            }}
                            className="w-16 text-center py-1.5 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-primary"
                          />
                          <span className="text-xs text-white/40">
                            {maxStock > 0 ? `(Max ${maxStock})` : ""}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => handleQuantityChange(quantity + 1)}
                          disabled={maxStock > 0 && quantity >= maxStock}
                          className="p-1.5 rounded-lg border border-white/10 hover:border-primary text-white hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 mt-3 border-t border-white/10">
                  <Button 
                    size="default" 
                    className="flex-1 text-sm py-2 bg-primary text-white hover:bg-primary/80"
                    onClick={handleAddToCart} 
                    disabled={maxStock === 0}
                  >
                    <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> 
                    {maxStock === 0 
                      ? "Out of Stock" 
                      : quantity > 1 
                        ? `Add ${quantity} to Cart (KSh ${totalPrice.toLocaleString()})` 
                        : `Add to Cart - KSh ${finalPrice.toLocaleString()}`}
                  </Button>
                  <Button 
                    size="default" 
                    variant="outline"
                    onClick={toggleFavorite}
                    className="px-3 border-white/10 text-white hover:bg-primary hover:border-primary"
                  >
                    <Heart className={`w-4 h-4 ${isFav ? "fill-primary text-primary" : ""}`} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8 md:py-12 space-y-12">
          {/* Product Specifications */}
          {specifications.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Specifications</h2>
              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {specifications.map((spec: any) => (
                    <div key={spec.id} className="pb-4 border-b border-white/10 last:border-b-0">
                      <p className="text-sm font-medium text-white/50 mb-1">{spec.spec_key}</p>
                      <p className="text-base font-semibold text-white">{spec.spec_value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Key Features Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-white">Key Features</h2>
            </div>
            <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-white/10 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {productFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 group">
                    <div className="mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary group-hover:scale-125 transition-transform"></div>
                    </div>
                    <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Compatible Models Section */}
          {splitModels(product.model).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-white">Compatible Models</h2>
              </div>
              <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-white/10 p-6">
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {splitModels(product.model).map(model => (
                    <span key={model} className="text-sm bg-black/30 text-white/80 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors border border-white/10">
                      {model}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Reviews ({reviews.length})</h2>

            {user ? (
              !existingReview ? (
                <form onSubmit={submitReview} className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
                  <p className="font-medium text-white mb-2">Leave a Review</p>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button type="button" key={s} onClick={() => setRating(s)}>
                        <Star className={`w-5 h-5 ${s <= rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Share your experience..."
                    className="w-full p-3 rounded-lg border border-white/10 bg-black text-white text-sm resize-none h-20 mb-3 placeholder:text-white/30"
                  />
                  <Button type="submit" size="sm" disabled={submitting} className="bg-primary text-white hover:bg-primary/80">
                    {submitting ? "Saving..." : "Submit Review"}
                  </Button>
                </form>
              ) : (
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
                  <p className="font-medium text-white mb-3">Your Review</p>
                  <p className="text-sm text-white/50">You can only have one review per product. Delete your current review to post a new one.</p>
                </div>
              )
            ) : (
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6 text-center">
                <p className="text-sm text-white/50 mb-2">Sign in to leave a review</p>
                <Link to="/auth">
                  <Button size="sm" variant="outline" className="border-white/10 text-white hover:bg-primary hover:border-primary">Sign In</Button>
                </Link>
              </div>
            )}

            <div className="space-y-4">
              {reviews.map((r: Review) => (
                <div key={r.id} className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-white">{r.display_name}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-white/60">{r.comment}</p>}
                  
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                    <p className="text-xs text-white/30">
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                    
                    {user && user.id === r.user_id && (
                      <button
                        onClick={() => deleteReview(r.id)}
                        className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {reviews.length === 0 && <p className="text-white/40 text-sm">No reviews yet. Be the first!</p>}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Related Products</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {relatedProducts.map((relatedProduct, idx) => (
                  <ProductCard
                    key={relatedProduct.id}
                    id={relatedProduct.id}
                    name={relatedProduct.name}
                    images={relatedProduct.product_images || []}
                    price={Number(relatedProduct.price)}
                    originalPrice={relatedProduct.original_price ? Number(relatedProduct.original_price) : null}
                    category={relatedProduct.category}
                    brand={relatedProduct.brand}
                    stockStatus={relatedProduct.stock_status}
                    rating={relatedProduct.rating}
                    reviewCount={relatedProduct.review_count}
                    index={idx}
                  />
                ))}
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