import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const AdminReviews = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadReviews(); }, []);

  const loadReviews = async () => {
    const { data: reviewData } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (!reviewData?.length) { setReviews([]); setLoading(false); return; }

    const productIds = [...new Set(reviewData.map(r => r.product_id))];
    const userIds = [...new Set(reviewData.map(r => r.user_id))];
    const [{ data: products }, { data: profiles }] = await Promise.all([
      supabase.from("products").select("id, name").in("id", productIds),
      supabase.from("profiles").select("user_id, display_name").in("user_id", userIds),
    ]);
    const productMap = Object.fromEntries((products || []).map(p => [p.id, p.name]));
    const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p.display_name]));
    setReviews(reviewData.map(r => ({ ...r, product_name: productMap[r.product_id] || "Unknown", reviewer: profileMap[r.user_id] || "Anonymous" })));
    setLoading(false);
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    toast.success("Review deleted");
    loadReviews();
  };

  const filtered = reviews.filter(r =>
    !search || r.product_name.toLowerCase().includes(search.toLowerCase()) || r.reviewer.toLowerCase().includes(search.toLowerCase())
  );

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold">Reviews</h1>
          <p className="text-sm text-muted-foreground">{reviews.length} total · avg rating {avgRating}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by product or reviewer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="bg-white border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Reviewer</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Product</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Rating</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">Comment</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Date</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-3 bg-secondary rounded animate-pulse" /></td></tr>
            )) : filtered.map(r => (
              <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3 font-medium">{r.reviewer}</td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell max-w-[160px] truncate">{r.product_name}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-border"}`} />)}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{r.comment || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => deleteReview(r.id)} className="p-1.5 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && <p className="text-muted-foreground text-center py-12 text-sm">No reviews yet.</p>}
      </div>
    </div>
  );
};

export default AdminReviews;
