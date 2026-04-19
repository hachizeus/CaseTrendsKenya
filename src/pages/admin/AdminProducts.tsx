import { useEffect, useMemo, useState } from "react";
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
  ArrowUpDown, Package, DollarSign, Tag, CheckCircle, AlertCircle, XCircle
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

  useEffect(() => {
    const load = async () => {
      await loadProducts();
      setLoading(false);
    };
    load();
  }, [refreshTrigger]);

  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*, product_images(*)")
      .order("created_at", { ascending: false });
    setProducts(data || []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product and all its images?")) return;
    setIsDeletingId(id);

    const { error } = await (supabase.from("products") as any).delete().eq("id", id);
    setIsDeletingId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Deleted");
    await logAuditAction({
      actor_id: user?.id ?? null,
      actor_email: user?.email ?? null,
      action_type: "product_deleted",
      entity: "products",
      entity_id: id,
      details: null,
      user_id: null,
    });
    loadProducts();
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
      ? { label: "Out of Stock", class: "bg-red-100 text-red-700", icon: XCircle, color: "text-red-600", dot: "bg-red-500" }
      : product.stock_status === "in_stock"
      ? { label: "In Stock", class: "bg-emerald-100 text-emerald-700", icon: CheckCircle, color: "text-emerald-600", dot: "bg-emerald-500" }
      : product.stock_status === "low_stock"
      ? { label: "Low Stock", class: "bg-amber-100 text-amber-700", icon: AlertCircle, color: "text-amber-600", dot: "bg-amber-500" }
      : { label: "Sold Out", class: "bg-red-100 text-red-700", icon: XCircle, color: "text-red-600", dot: "bg-red-500" };
    
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="space-y-5 p-4 md:p-6 max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/40 rounded-full"></div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                Product Management
              </h1>
            </div>
            <p className="text-sm text-slate-500 ml-3">
              Manage your inventory, track stock levels, and update product information
            </p>
          </div>
          <Button 
            onClick={() => navigate("/admin/products/new")} 
            className="gap-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
          >
            <Plus className="w-4 h-4" /> Add New Product
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="group relative overflow-hidden bg-white rounded-xl border border-slate-200 p-3 hover:shadow-lg transition-all duration-300 hover:border-primary/20">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Products</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{products.length}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white rounded-xl border border-slate-200 p-3 hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-bl-full"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Value</p>
                <p className="text-lg font-bold text-emerald-600 mt-1 truncate">
                  {formatPrice(products.reduce((sum, p) => sum + (p.price || 0), 0))}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white rounded-xl border border-slate-200 p-3 hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/5 to-transparent rounded-bl-full"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Low Stock Alert</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {products.filter(p => p.stock_status === "low_stock").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white rounded-xl border border-slate-200 p-3 hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-500/5 to-transparent rounded-bl-full"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {products.filter(p => p.stock_status === "out_of_stock").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search products by name, brand, or model..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
              />
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="h-10 px-3 pr-8 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-primary focus:bg-white transition-all cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="name">Sort by Name</option>
                  <option value="price">Sort by Price</option>
                  <option value="stock">Sort by Stock</option>
                </select>
                <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`gap-2 h-10 border-slate-200 hover:bg-slate-50 ${showFilters ? 'bg-primary/5 border-primary/50' : ''}`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`} />
              </Button>

              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === "table" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === "grid" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[180px]">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-primary focus:bg-white transition-all"
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
            <p className="text-sm font-medium text-slate-600">
              Showing <span className="text-primary font-bold">{filteredAndSortedProducts.length}</span> of {products.length} products
            </p>
          </div>
          {search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearch("")}
              className="text-xs text-slate-500 hover:text-primary"
            >
              Clear search
            </Button>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <TableSkeleton rows={6} columns={4} />
        ) : (
          <>
            {/* Table View */}
            {viewMode === "table" && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-slate-600">
                          Product Details
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-slate-600">
                          Model
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-slate-600">
                          Price
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-slate-600">
                          Stock Status
                        </th>
                        <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wider text-slate-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAndSortedProducts.map((product) => {
                        const primaryImg = product.product_images?.find((i: any) => i.is_primary)?.image_url ||
                          product.product_images?.[0]?.image_url ||
                          "/placeholder.svg";
                        const stockInfo = getStockInfo(product);
                        const StockIcon = stockInfo.icon;

                        return (
                          <tr key={product.id} className="hover:bg-slate-50/50 transition-colors duration-150 group">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 p-1.5 border border-slate-200 flex-shrink-0">
                                  <img
                                    src={getOptimizedImageUrl(primaryImg, { width: 80, height: 80, quality: 70, resize: "contain" })}
                                    alt={product.name}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm text-slate-800 truncate">{product.name}</p>
                                  <p className="text-xs text-slate-500 truncate">{product.brand}</p>
                                  <div className="flex gap-1 mt-1">
                                    {product.is_featured && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-medium">
                                        <Star className="w-2.5 h-2.5 fill-amber-500" /> Featured
                                      </span>
                                    )}
                                    {product.is_trending && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                                        <TrendingUp className="w-2.5 h-2.5" /> Trending
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                                <Smartphone className="w-3 h-3" />
                                <span>{product.model || "—"}</span>
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
                                  <span className="text-xs text-slate-500">({stockInfo.quantity} left)</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  onClick={() => navigate(`/admin/products/${product.id}`)}
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1.5 text-slate-600 hover:text-primary hover:bg-primary/5"
                                >
                                  <Pencil className="w-3.5 h-3.5" /> Edit
                                </Button>
                                <Button
                                  onClick={() => handleDelete(product.id)}
                                  disabled={isDeletingId === product.id}
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
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
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-3">
                        <Search className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium">No products found</p>
                      <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
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
                    <div key={product.id} className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className="relative bg-gradient-to-br from-slate-50 to-white p-6 border-b border-slate-100">
                        <div className="aspect-square flex items-center justify-center">
                          <img
                            src={getOptimizedImageUrl(primaryImg, { width: 160, height: 160, quality: 75, resize: "contain" })}
                            alt={product.name}
                            className="w-full h-full object-contain max-h-32 group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        
                        <div className="absolute top-3 left-3 flex gap-1">
                          {product.is_featured && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500 text-white px-1.5 py-0.5 text-[10px] font-semibold shadow-sm">
                              <Star className="w-2.5 h-2.5 fill-current" /> Featured
                            </span>
                          )}
                          {product.is_trending && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-primary text-white px-1.5 py-0.5 text-[10px] font-semibold shadow-sm">
                              <TrendingUp className="w-2.5 h-2.5" /> Trending
                            </span>
                          )}
                        </div>
                        
                        <div className="absolute top-3 right-3">
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${stockInfo.class} shadow-sm`}>
                            <StockIcon className="w-2.5 h-2.5" />
                            {stockInfo.label}
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="mb-3">
                          <h3 className="font-bold text-sm text-slate-800 truncate group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">{product.brand}</p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-medium">
                            <Smartphone className="w-2.5 h-2.5" />
                            {product.model || "N/A"}
                          </span>
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 text-[10px] font-medium">
                            <Tag className="w-2.5 h-2.5" />
                            {product.category}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mb-4 pt-2 border-t border-slate-100">
                          <div>
                            <p className="text-lg font-bold text-primary">{formatPrice(product.price)}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${stockInfo.dot}`}></div>
                              <p className="text-[10px] text-slate-500">
                                {stockInfo.quantity > 0 ? `${stockInfo.quantity} units` : "Out of stock"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400">
                              {product.product_images?.length || 0}/10 images
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => navigate(`/admin/products/${product.id}`)}
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1.5 text-sm"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(product.id)}
                            disabled={isDeletingId === product.id}
                            variant="destructive"
                            size="sm"
                            className="flex-1 gap-1.5 text-sm"
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-3">
                      <Search className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">No products found</p>
                    <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
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