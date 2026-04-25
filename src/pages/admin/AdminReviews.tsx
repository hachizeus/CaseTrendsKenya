import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { logAuditAction } from "@/lib/audit";
import { useRefreshTrigger } from "@/contexts/RefreshContext";
import { Star, Trash2, Search, MessageCircle, User, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

interface ReviewWithMetadata {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  product_name: string;
  reviewer: string;
  product_id: string;
  user_id: string;
}

const AdminReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState<string>("");
  const { refreshTrigger } = useRefreshTrigger();

  useEffect(() => { loadReviews(); }, [refreshTrigger]);

  const loadReviews = async () => {
    const reviewResponse = await (supabase.from("reviews") as any)
      .select("*")
      .order("created_at", { ascending: false });

    const reviewData = reviewResponse.data as unknown as ReviewRow[] | null;
    const reviewError = reviewResponse.error;

    if (reviewError || !reviewData?.length) { setReviews([]); setLoading(false); return; }

    const productIds = [...new Set(reviewData.map((r) => r.product_id))];
    const userIds = [...new Set(reviewData.map((r) => r.user_id))];

    const productsResponse = await ((supabase.from("products") as any)
      .select("id, name")
      .in("id", productIds) as any);
    const profilesResponse = await ((supabase.from("profiles") as any)
      .select("user_id, display_name")
      .in("user_id", userIds) as any);

    const products = productsResponse.data as ProductRow[] | null;
    const profiles = profilesResponse.data as ProfileRow[] | null;

    const productMap = Object.fromEntries((products ?? []).map((p) => [p.id, p.name]));
    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p.display_name]));

    setReviews(
      reviewData.map((r) => ({
        ...r,
        product_name: productMap[r.product_id] || "Unknown",
        reviewer: profileMap[r.user_id] || "Anonymous",
      })),
    );
    setLoading(false);
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    const { error } = await (supabase.from("reviews") as any).delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Review deleted");
    await logAuditAction({
      actor_id: user?.id ?? null,
      actor_email: user?.email ?? null,
      action_type: "review_deleted",
      entity: "reviews",
      entity_id: id,
      details: null,
      user_id: null,
    });
    loadReviews();
  };

  const filtered = useMemo(
    () => reviews.filter((r) =>
      !search || r.product_name.toLowerCase().includes(search.toLowerCase()) || r.reviewer.toLowerCase().includes(search.toLowerCase()),
    ),
    [reviews, search],
  );

  const avgRating = useMemo(
    () => (reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—"),
    [reviews],
  );

  const MobileReviewCard = ({ review }: { review: ReviewWithMetadata }) => (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-white text-sm">{review.reviewer}</p>
            <p className="text-xs text-white/50">{review.product_name}</p>
          </div>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
          ))}
        </div>
      </div>
      
      {review.comment && (
        <div className="flex items-start gap-2">
          <MessageCircle className="w-3.5 h-3.5 text-white/30 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-white/60 line-clamp-2">{review.comment}</p>
        </div>
      )}
      
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <div className="flex items-center gap-1 text-xs text-white/30">
          <Calendar className="w-3 h-3" />
          {new Date(review.created_at).toLocaleDateString()}
        </div>
        <button 
          onClick={() => deleteReview(review.id)} 
          className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/40 rounded-full"></div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Reviews
            </h1>
          </div>
          <div className="flex items-center gap-2 ml-3">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(parseFloat(avgRating)) ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
              ))}
            </div>
            <p className="text-sm text-white/50">
              {reviews.length} total · avg rating {avgRating} / 5
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input 
          placeholder="Search by product or reviewer..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50"
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/10 border-b border-white/10">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50">Reviewer</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50">Rating</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50">Comment</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50">Date</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5, 6].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3 bg-white/10 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              )) : filtered.map(r => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{r.reviewer}</td>
                  <td className="px-4 py-3 text-white/60 max-w-[160px] truncate">{r.product_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />)}
                    </div>
                  </td>
                  <td
                    title={r.comment ?? undefined}
                    className="px-4 py-3 text-white/50 max-w-[250px] truncate"
                  >
                    {r.comment || "—"}
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => deleteReview(r.id)} 
                      className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-3">
              <MessageCircle className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-white/50 font-medium">No reviews found</p>
            <p className="text-sm text-white/30 mt-1">Try adjusting your search</p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/10 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-white/10 rounded w-24 mb-1" />
                  <div className="h-3 bg-white/10 rounded w-32" />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-3">
              <MessageCircle className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-white/50 font-medium">No reviews found</p>
            <p className="text-sm text-white/30 mt-1">Try adjusting your search</p>
          </div>
        ) : (
          filtered.map(review => <MobileReviewCard key={review.id} review={review} />)
        )}
      </div>
    </div>
  );
};

export default AdminReviews;