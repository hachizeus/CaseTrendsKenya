import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRefreshTrigger } from "@/contexts/RefreshContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title, Filler } from "chart.js";
import { Package, Users, Image, Star, FolderTree, TrendingUp, Plus, ArrowRight, ShoppingBag } from "lucide-react";
import { getOptimizedImageUrl } from "@/lib/imageOptimization";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title, Filler);

const AdminDashboard = () => {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [stats, setStats] = useState({ products: 0, users: 0, slides: 0, reviews: 0, categories: 0, orders: 0 });
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<{ day: string; amount: number }[]>([]);
  const [paystackRevenue, setPaystackRevenue] = useState(0);
  const [averagePaystackOrderValue, setAveragePaystackOrderValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const { refreshTrigger } = useRefreshTrigger();

  useEffect(() => {
    const load = async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      const revenueSince = thirtyDaysAgo.toISOString();

      const [p, u, s, r, c, rp, ord, ro, revenueResult] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("hero_slides").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id, name, price, stock_status, product_images(image_url, is_primary)").order("created_at", { ascending: false }).limit(5),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, customer_name, customer_phone, total_amount, status, created_at").order("created_at", { ascending: false }).limit(5),
        (supabase.from("orders") as any)
          .select("created_at, total_amount")
          .eq("payment_method", "paystack")
          .neq("status", "cancelled")
          .gte("created_at", revenueSince)
          .order("created_at", { ascending: true }),
      ]);

      const revenueRows = revenueResult.data || [];
      const trendMap: Record<string, number> = {};
      for (let offset = 0; offset < 30; offset += 1) {
        const date = new Date(thirtyDaysAgo);
        date.setDate(thirtyDaysAgo.getDate() + offset);
        trendMap[date.toISOString().slice(0, 10)] = 0;
      }
      revenueRows.forEach((row: any) => {
        const day = row.created_at?.slice(0, 10);
        if (!day) return;
        trendMap[day] = (trendMap[day] || 0) + Number(row.total_amount || 0);
      });

      const trend = Object.entries(trendMap).map(([day, amount]) => ({ day, amount }));
      const totalRevenue = revenueRows.reduce((sum: number, row: any) => sum + Number(row.total_amount || 0), 0);
      const averageOrderValue = revenueRows.length ? totalRevenue / revenueRows.length : 0;

      setStats({ products: p.count || 0, users: u.count || 0, slides: s.count || 0, reviews: r.count || 0, categories: c.count || 0, orders: ord.count || 0 });
      setRecentProducts(rp.data || []);
      setRecentOrders(ro.data || []);
      setRevenueTrend(trend);
      setPaystackRevenue(totalRevenue);
      setAveragePaystackOrderValue(averageOrderValue);
      setLoading(false);
    };
    load();
  }, [refreshTrigger]);

  const statCards = [
    { label: "Total Products", value: stats.products, icon: Package, color: "bg-slate-700", link: "/admin/products" },
    { label: "Categories", value: stats.categories, icon: FolderTree, color: "bg-violet-500", link: "/admin/categories" },
    { label: "Registered Users", value: stats.users, icon: Users, color: "bg-emerald-500", link: "/admin/users", adminOnly: true },
    { label: "Orders", value: stats.orders, icon: ShoppingBag, color: "bg-primary", link: "/admin/orders" },
    { label: "Reviews", value: stats.reviews, icon: Star, color: "bg-yellow-500", link: "/admin/reviews" },
  ];

  const visibleStatCards = statCards.filter(card => !card.adminOnly || isAdmin);

  const quickActions = [
    { label: "Add Product", to: "/admin/products", icon: Plus, color: "bg-slate-100 text-slate-700 border-slate-200" },
    { label: "Add Category", to: "/admin/categories", icon: Plus, color: "bg-violet-50 text-violet-600 border-violet-200" },
    { label: "Add Hero Slide", to: "/admin/slides", icon: Plus, color: "bg-orange-50 text-orange-600 border-orange-200" },
    { label: "View Orders", to: "/admin/orders", icon: ShoppingBag, color: "bg-primary/10 text-primary border-primary/20" },
  ];

  const revenueChartData = useMemo(
    () => ({
      labels: revenueTrend.map((item) => item.day),
      datasets: [
        {
          label: "Paystack Revenue",
          data: revenueTrend.map((item) => item.amount),
          borderColor: "#0ea5e9",
          backgroundColor: "rgba(14,165,233,0.18)",
          fill: true,
          tension: 0.35,
          pointRadius: 2,
        },
      ],
    }),
    [revenueTrend],
  );

  const revenueChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index" as const, intersect: false },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Paystack revenue last 30 days",
          color: "#0f172a",
          font: { size: 14, weight: "bold" as const },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const value = context.parsed?.y ?? context.parsed;
              return `KSh ${Number(value).toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#64748b" } },
        y: {
          ticks: {
            color: "#64748b",
            callback: (value: any) => `KSh ${Number(value).toLocaleString()}`,
          },
          grid: { color: "rgba(148,163,184,0.16)" },
        },
      },
    }) as any,
    [],
  );

  const stockBadge = (s: string) =>
    s === "in_stock" ? "bg-emerald-100 text-emerald-700" :
    s === "low_stock" ? "bg-yellow-100 text-yellow-700" :
    "bg-red-100 text-red-600";

  const orderBadge = (s: string) =>
    s === "delivered" ? "bg-emerald-100 text-emerald-700" :
    s === "cancelled" ? "bg-red-100 text-red-600" :
    s === "confirmed" ? "bg-gray-200 text-gray-700" :
    "bg-yellow-100 text-yellow-700";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Welcome back — here's what's happening.</p>
        </div>
        <Link to="/admin/products" className="hidden sm:flex items-center gap-2 bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {/* Revenue overview */}
      {isAdmin && (
        <div className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Revenue Overview</h2>
                <p className="mt-1 text-xs text-muted-foreground">Paystack-only revenue for the last 30 days, sourced directly from orders.</p>
              </div>
            </div>
            <div className="h-[320px]">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading revenue chart...</div>
              ) : paystackRevenue === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-slate-600">
                  <p className="text-sm font-medium">No Paystack revenue recorded in the last 30 days.</p>
                  <p className="mt-2 text-xs text-slate-500">Ensure Paystack orders are complete and try again.</p>
                </div>
              ) : (
                <Line data={revenueChartData} options={revenueChartOptions} />
              )}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Total Paystack Revenue</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">KSh {paystackRevenue.toLocaleString()}</p>
            </div>
            <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Average Paystack Order</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">KSh {averagePaystackOrderValue.toFixed(0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      {!isAdmin && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-amber-900">
          Moderators have limited admin access: you can view and manage orders, products, categories, slides, and reviews, but user management and financial dashboards are restricted to admins only.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {visibleStatCards.map(card => (
          <Link key={card.label} to={card.link} className="bg-white border border-border p-4 sm:p-5 hover:border-primary transition-colors group">
            <div className={`w-9 h-9 ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">
              {loading ? <span className="inline-block w-8 h-6 bg-secondary animate-pulse" /> : card.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Orders + Recent Products */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Orders */}
        <div className="bg-white border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" /> Recent Orders
            </h2>
            <Link to="/admin/orders" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/3" />
                </div>
              </div>
            )) : recentOrders.map(o => (
              <div key={o.id} className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{o.customer_phone}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-primary">
                    {isAdmin ? `KSh ${Number(o.total_amount).toLocaleString()}` : "KSh ****"}
                  </p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 capitalize ${orderBadge(o.status)}`}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
            {!loading && recentOrders.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No orders yet.</p>
            )}
          </div>
        </div>

        {/* Recent Products */}
        <div className="bg-white border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Recent Products
            </h2>
            <Link to="/admin/products" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                <div className="w-10 h-10 bg-secondary flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/3" />
                </div>
              </div>
            )) : recentProducts.map(p => {
              const img = p.product_images?.find((i: any) => i.is_primary)?.image_url || p.product_images?.[0]?.image_url || "/placeholder.svg";
              return (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/40 transition-colors">
                  <img
                    src={getOptimizedImageUrl(img, {
                      width: 120,
                      height: 120,
                      quality: 70,
                      resize: "contain",
                    })}
                    alt={p.name}
                    loading="lazy"
                    decoding="async"
                    className="w-10 h-10 object-contain bg-secondary border border-border flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">KSh {Number(p.price).toLocaleString()}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 ${stockBadge(p.stock_status)}`}>
                    {p.stock_status === "in_stock" ? "In Stock" : p.stock_status === "low_stock" ? "Low Stock" : "Sold Out"}
                  </span>
                </div>
              );
            })}
            {!loading && recentProducts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No products yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-border">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm">Quick Actions</h2>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickActions.map(a => (
            <Link key={a.label} to={a.to} className={`flex items-center gap-3 px-4 py-3 border text-sm font-medium hover:opacity-80 transition-opacity ${a.color}`}>
              <a.icon className="w-4 h-4" />
              {a.label}
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
