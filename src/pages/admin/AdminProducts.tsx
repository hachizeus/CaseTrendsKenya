import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logAuditAction } from "@/lib/audit";
import { useRefreshTrigger } from "@/contexts/RefreshContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Search, Star, TrendingUp, Loader2 } from "lucide-react";
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

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase();
    return products.filter((p) =>
      !query ||
      p.name?.toLowerCase().includes(query) ||
      p.brand?.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query)
    );
  }, [products, search]);

  const stockBadge = (s: string) => {
    if (s === "in_stock") return "bg-emerald-100 text-emerald-700";
    if (s === "low_stock") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-600";
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} total</p>
        </div>
        <Button onClick={() => navigate("/admin/products/new")} className="gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={6} columns={6} />
      ) : (
        <div className="bg-white border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Product
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden sm:table-cell">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Price
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden lg:table-cell">
                    Images
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((p) => {
                    const primaryImg =
                      p.product_images?.find((i: any) => i.is_primary)?.image_url ||
                      p.product_images?.[0]?.image_url ||
                      "/placeholder.svg";
                    const stockQuantity = typeof p.stock_quantity === "number" ? p.stock_quantity : null;
                    const statusLabel =
                      stockQuantity === 0 || p.stock_status === "out_of_stock"
                        ? "Out of Stock"
                        : p.stock_status === "in_stock"
                        ? "In Stock"
                        : p.stock_status === "low_stock"
                        ? "Low Stock"
                        : "Sold Out";
                    const statusClass =
                      stockQuantity === 0 || p.stock_status === "out_of_stock"
                        ? "bg-red-100 text-red-600"
                        : p.stock_status === "in_stock"
                        ? "bg-emerald-100 text-emerald-700"
                        : p.stock_status === "low_stock"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-600";

                    return (
                      <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={getOptimizedImageUrl(primaryImg, {
                                width: 120,
                                height: 120,
                                quality: 70,
                                resize: "contain",
                              })}
                              alt={p.name}
                              title={primaryImg}
                              className="w-10 h-10 object-contain bg-secondary border border-border flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-[160px]">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.brand}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {p.category}
                        </td>
                        <td className="px-4 py-3 font-semibold text-primary">
                          KSh {Number(p.price).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${statusClass}`}
                          >
                            {statusLabel}
                            {stockQuantity > 0 ? ` · ${stockQuantity} left` : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <p className="text-xs text-muted-foreground">
                            {p.product_images?.length || 0}/10 images
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            {p.is_featured && (
                              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                            )}
                            {p.is_trending && (
                              <TrendingUp className="w-3.5 h-3.5 text-primary" />
                            )}
                            <button
                              onClick={() => navigate(`/admin/products/${p.id}`)}
                              className="p-1.5 hover:bg-secondary border border-transparent hover:border-border transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              disabled={isDeletingId === p.id}
                              className="p-1.5 border border-transparent transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isDeletingId === p.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <p className="text-muted-foreground text-center py-12 text-sm">
                {products.length === 0 ? "No products yet." : "No products match your search."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
