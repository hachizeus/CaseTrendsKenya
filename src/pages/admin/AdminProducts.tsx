import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logAuditAction } from "@/lib/audit";
import { useRefreshTrigger } from "@/contexts/RefreshContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, Pencil, Trash2, Search, Star, TrendingUp, Loader2, 
  Smartphone, Filter, ChevronDown, Grid3x3, LayoutList, 
  ArrowUpDown, Package, DollarSign, Tag, CheckCircle, AlertCircle, XCircle,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { getOptimizedImageUrl } from "@/lib/imageOptimization";
import { TableSkeleton } from "@/components/SkeletonVariants";

const AdminProducts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const { refreshTrigger } = useRefreshTrigger();
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [sortBy, setSortBy] = useState<"name" | "price" | "stock" | "newest">("newest");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Pull to refresh
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*, product_images(*)")
      .order("created_at", { ascending: false });
    setProducts(data || []);
    return data;
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await loadProducts();
    setIsRefreshing(false);
    toast.success("Products refreshed");
  };

  // Pull to refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0 && touchStartY.current) {
      const deltaY = e.touches[0].clientY - touchStartY.current;
      if (deltaY > 60 && !isRefreshing) {
        handleRefresh();
      }
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadProducts();
      setLoading(false);
    };
    load();
  }, [refreshTrigger]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product and all its images?")) return;
    setIsDeletingId(id);

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    setIsDeletingId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Deleted successfully");
    
    await logAuditAction({
      actor_id: user?.id ?? null,
      actor_email: user?.email ?? null,
      action_type: "product_deleted",
      entity: "products",
      entity_id: id,
      details: null,
      user_id: null,
    });
    
    await loadProducts();
  };

  const getUniqueCategories = () => {
    const categories = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(categories);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter((p) => {
      const matchesSearch = !search ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.brand?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase()) ||
        p.model?.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = filterCategory === "all" || p.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    });

    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => a.name?.localeCompare(b.name));
        break;
      case "price":
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "stock":
        filtered.sort((a, b) => (b.stock_quantity || 0) - (a.stock_quantity || 0));
        break;
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return filtered;
  }, [products, search, filterCategory, sortBy]);

  const getStockInfo = (product: any) => {
    const stockQuantity = typeof product.stock_quantity === "number" ? product.stock_quantity : null;
    const status = stockQuantity === 0 || product.stock_status === "out_of_stock"
      ? { label: "Out of Stock", class: "bg-red-500/20 text-red-400", icon: XCircle, color: "text-red-400", dot: "bg-red-500" }
      : product.stock_status === "in_stock"
      ? { label: "In Stock", class: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle, color: "text-emerald-400", dot: "bg-emerald-500" }
      : product.stock_status === "low_stock"
      ? { label: "Low Stock", class: "bg-amber-500/20 text-amber-400", icon: AlertCircle, color: "text-amber-400", dot: "bg-amber-500" }
      : { label: "Sold Out", class: "bg-red-500/20 text-red-400", icon: XCircle, color: "text-red-400", dot: "bg-red-500" };
    
    return { ...status, quantity: stockQuantity };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)] overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Pull to refresh indicator */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center py-2 bg-primary/20 backdrop-blur-sm">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-primary">Refreshing...</span>
        </div>
      )}

      <div className="space-y-5 p-4 md:p-6 max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/40 rounded-full"></div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                Product Management
              </h1>
            </div>
            <p className="text-sm text-white/40 ml-3">
              Manage your inventory, track stock levels, and update product information
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2 border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => navigate("/admin/products/new")} 
              className="gap-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/80"
            >
              <Plus className="w-4 h-4" /> Add New Product
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="group relative overflow-hidden bg-white/5 rounded-xl border border-white/10 p-3 hover:shadow-lg transition-all duration-300 hover:border-primary/30">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/50">Total Products</p>
                <p className="text-2xl font-bold text-white mt-1">{products.length}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white/5 rounded-xl border border-white/10 p-3 hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-bl-full"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/50">Total Value</p>
                <p className="text-lg font-bold text-emerald-400 mt-1 truncate">
                  {formatPrice(products.reduce((sum, p) => sum + (p.price || 0), 0))}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white/5 rounded-xl border border-white/10 p-3 hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/5 to-transparent rounded-bl-full"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/50">Low Stock Alert</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">
                  {products.filter(p => p.stock_status === "low_stock").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white/5 rounded-xl border border-white/10 p-3 hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-500/5 to-transparent rounded-bl-full"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/50">Out of Stock</p>
                <p className="text-2xl font-bold text-red-400 mt-1">
                  {products.filter(p => p.stock_status === "out_of_stock").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500/20 to-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-3 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Search products by name, brand, or model..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-10 bg-black/30 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50 transition-all"
              />
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="h-10 px-3 pr-8 rounded-lg border border-white/10 bg-black/30 text-white text-sm focus:outline-none focus:border-primary focus:bg-black/50 transition-all cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="name">Sort by Name</option>
                  <option value="price">Sort by Price</option>
                  <option value="stock">Sort by Stock</option>
                </select>
                <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`gap-2 h-10 border-white/20 text-white hover:bg-white/10 ${showFilters ? 'bg-primary/10 border-primary/50' : ''}`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`} />
              </Button>

              <div className="flex gap-1 bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === "table" ? "bg-white/20 text-primary" : "text-white/50 hover:text-white/80"}`}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === "grid" ? "bg-white/20 text-primary" : "text-white/50 hover:text-white/80"}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[180px]">
                  <label className="text-xs font-medium text-white/50 mb-1 block">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-black/30 text-white text-sm focus:outline-none focus:border-primary focus:bg-black/50 transition-all"
                  >
                    <option value="all">All Categories</option>
                    {getUniqueCategories().map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-primary to-primary/40 rounded-full"></div>
            <p className="text-sm font-medium text-white/50">
              Showing <span className="text-primary font-bold">{filteredAndSortedProducts.length}</span> of {products.length} products
            </p>
          </div>
          {search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearch("")}
              className="text-xs text-white/50 hover:text-primary"
            >
              Clear search
            </Button>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-1/3"></div>
                    <div className="h-3 bg-white/10 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Table View */}
            {viewMode === "table" && (
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden shadow-sm">
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-white/10 border-b border-white/10">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-white/50">
                          Product Details
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-white/50">
                          Price
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-white/50">
                          Stock Status
                        </th>
                        <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wider text-white/50">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {filteredAndSortedProducts.map((product) => {
                        const primaryImg = product.product_images?.find((i: any) => i.is_primary)?.image_url ||
                          product.product_images?.[0]?.image_url ||
                          "/placeholder.svg";
                        const stockInfo = getStockInfo(product);
                        const StockIcon = stockInfo.icon;

                        return (
                          <tr key={product.id} className="hover:bg-white/5 transition-colors duration-150 group">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-black/30 p-1.5 border border-white/10 flex-shrink-0">
                                  <img
                                    src={getOptimizedImageUrl(primaryImg, { width: 80, height: 80, quality: 70, resize: "contain" })}
                                    alt={product.name}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm text-white truncate">{product.name}</p>
                                  <p className="text-xs text-white/40 truncate">{product.brand || "—"}</p>
                                  <div className="flex gap-1 mt-1">
                                    {product.is_featured && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-medium">
                                        <Star className="w-2.5 h-2.5 fill-amber-400" /> Featured
                                      </span>
                                    )}
                                    {product.is_trending && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-medium">
                                        <TrendingUp className="w-2.5 h-2.5" /> Trending
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-bold text-primary text-sm">{formatPrice(product.price)}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${stockInfo.dot} animate-pulse`}></div>
                                <span className={`text-xs font-medium ${stockInfo.color}`}>{stockInfo.label}</span>
                                {stockInfo.quantity > 0 && (
                                  <span className="text-xs text-white/40">({stockInfo.quantity} left)</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  onClick={() => navigate(`/admin/products/${product.id}`)}
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1.5 text-white/60 hover:text-primary hover:bg-white/10"
                                >
                                  <Pencil className="w-3.5 h-3.5" /> Edit
                                </Button>
                                <Button
                                  onClick={() => handleDelete(product.id)}
                                  disabled={isDeletingId === product.id}
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  {isDeletingId === product.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                   </table>
                  
                  {filteredAndSortedProducts.length === 0 && (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-3">
                        <Search className="w-8 h-8 text-white/30" />
                      </div>
                      <p className="text-white/50 font-medium">No products found</p>
                      <p className="text-sm text-white/30 mt-1">Try adjusting your search or filters</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAndSortedProducts.map((product) => {
                  const primaryImg = product.product_images?.find((i: any) => i.is_primary)?.image_url ||
                    product.product_images?.[0]?.image_url ||
                    "/placeholder.svg";
                  const stockInfo = getStockInfo(product);
                  const StockIcon = stockInfo.icon;

                  return (
                    <div key={product.id} className="group bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className="relative bg-black/30 p-6 border-b border-white/10">
                        <div className="aspect-square flex items-center justify-center">
                          <img
                            src={getOptimizedImageUrl(primaryImg, { width: 160, height: 160, quality: 75, resize: "contain" })}
                            alt={product.name}
                            className="w-full h-full object-contain max-h-32 group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        
                        <div className="absolute top-3 left-3 flex gap-1">
                          {product.is_featured && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/20 text-amber-400 px-1.5 py-0.5 text-[10px] font-semibold">
                              <Star className="w-2.5 h-2.5 fill-current" /> Featured
                            </span>
                          )}
                          {product.is_trending && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/20 text-primary px-1.5 py-0.5 text-[10px] font-semibold">
                              <TrendingUp className="w-2.5 h-2.5" /> Trending
                            </span>
                          )}
                        </div>
                        
                        <div className="absolute top-3 right-3">
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${stockInfo.class}`}>
                            <StockIcon className="w-2.5 h-2.5" />
                            {stockInfo.label}
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="mb-3">
                          <h3 className="font-bold text-sm text-white truncate group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-xs text-white/40 mt-0.5">{product.brand || "—"}</p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-medium">
                            <Tag className="w-2.5 h-2.5" />
                            {product.category || "Uncategorized"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mb-4 pt-2 border-t border-white/10">
                          <div>
                            <p className="text-lg font-bold text-primary">{formatPrice(product.price)}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${stockInfo.dot}`}></div>
                              <p className="text-[10px] text-white/40">
                                {stockInfo.quantity > 0 ? `${stockInfo.quantity} units` : "Out of stock"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-white/30">
                              {product.product_images?.length || 0}/10 images
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => navigate(`/admin/products/${product.id}`)}
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1.5 text-sm border-white/20 text-white hover:bg-white/10"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(product.id)}
                            disabled={isDeletingId === product.id}
                            variant="destructive"
                            size="sm"
                            className="flex-1 gap-1.5 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          >
                            {isDeletingId === product.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {filteredAndSortedProducts.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-3">
                      <Search className="w-8 h-8 text-white/30" />
                    </div>
                    <p className="text-white/50 font-medium">No products found</p>
                    <p className="text-sm text-white/30 mt-1">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;