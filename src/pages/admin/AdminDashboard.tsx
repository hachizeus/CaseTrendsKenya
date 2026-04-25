import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRefreshTrigger } from "@/contexts/RefreshContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title, Filler } from "chart.js";
import { Package, Users, Image, Star, FolderTree, TrendingUp, Plus, ArrowRight, ShoppingBag } from "lucide-react";
import { getOptimizedImageUrl } from "@/lib/imageOptimization";

const formatIsoDate = (date: Date) => date.toISOString().slice(0, 10);
const startOfToday = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

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
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { refreshTrigger } = useRefreshTrigger();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const today = startOfToday();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
        const revenueSince = thirtyDaysAgo.toISOString();

        const [p, u, s, r, c, ls, rp, ord, ro, revenueResult] = await Promise.all([
          supabase.from("products").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("hero_slides").select("id", { count: "exact", head: true }),
          supabase.from("reviews").select("id", { count: "exact", head: true }),
          supabase.from("categories").select("id", { count: "exact", head: true }),
          // @ts-ignore
          (supabase.from("products") as any).select("id", { count: "exact", head: true }).eq("stock_status", "low_stock"),
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
          trendMap[formatIsoDate(date)] = 0;
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
        setLowStockCount(ls.count || 0);
        setRecentProducts(rp.data || []);
        setRecentOrders(ro.data || []);
        setRevenueTrend(trend);
        setPaystackRevenue(totalRevenue);
        setAveragePaystackOrderValue(averageOrderValue);
      } catch (error) {
        console.error("Dashboard load failed", error);
        setStats((prev) => prev);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshTrigger]);

  const statCards = [
    { label: "Total Products", value: stats.products, icon: Package, color: "bg-slate-600", link: "/admin/products" },
    { label: "Low Stock Items", value: lowStockCount, icon: FolderTree, color: "bg-yellow-500", link: "/admin/products" },
    { label: "Registered Users", value: stats.users, icon: Users, color: "bg-emerald-500", link: "/admin/users", adminOnly: true },
    { label: "Orders", value: stats.orders, icon: ShoppingBag, color: "bg-primary", link: "/admin/orders" },
    { label: "Reviews", value: stats.reviews, icon: Star, color: "bg-yellow-500", link: "/admin/reviews" },
  ];

  const visibleStatCards = statCards.filter(card => !card.adminOnly || isAdmin);

  const quickActions = [
    { label: "Add Product", to: "/admin/products", icon: Plus, color: "bg-white/10 text-white border-white/20 hover:bg-white/20" },
    { label: "Add Hero Slide", to: "/admin/slides", icon: Plus, color: "bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30" },
    { label: "View Orders", to: "/admin/orders", icon: ShoppingBag, color: "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30" },
  ];

  const processedRevenue = useMemo(() => {
    if (!revenueTrend.length) {
      return { total: 0, avg: 0 };
    }

    const total = revenueTrend.reduce((sum, item) => sum + item.amount, 0);
    const avg = total / (revenueTrend.filter((item) => item.amount > 0).length || 1);

    return { total, avg };
  }, [revenueTrend]);

  const revenueChartData = useMemo(
    () => ({
      labels: revenueTrend.map((item) => item.day),
      datasets: [
        {
          label: "Paystack Revenue",
          data: revenueTrend.map((item) => item.amount),
          borderColor: "#FF1493",
          backgroundColor: "rgba(255,20,147,0.18)",
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          pointBackgroundColor: "#FF1493",
          pointBorderColor: "#FF1493",
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
          color: "#ffffff",
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
        x: { 
          grid: { display: false, color: "rgba(255,255,255,0.1)" }, 
          ticks: { 
            color: "#ffffff80",
            maxRotation: 45,
            minRotation: 45,
            autoSkip: true,
            maxTicksLimit: 6
          } 
        },
        y: {
          ticks: {
            color: "#ffffff80",
            callback: (value: any) => `KSh ${Number(value).toLocaleString()}`,
          },
          grid: { color: "rgba(255,255,255,0.1)" },
        },
      },
    }) as any,
    [],
  );

  const stockBadge = (s: string) =>
    s === "in_stock" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
    s === "low_stock" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
    "bg-red-500/20 text-red-400 border-red-500/30";

  const orderBadge = (s: string) =>
    s === "delivered" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
    s === "cancelled" ? "bg-red-500/20 text-red-400 border-red-500/30" :
    s === "confirmed" ? "bg-white/10 text-white/70 border-white/20" :
    "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";

  return (
    <div className="w-full max-w-full overflow-x-hidden px-3 sm:px-4 md:px-5 lg:px-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-white/50 mt-0.5">Welcome back — here's what's happening.</p>
        </div>
        <Link to="/admin/products" className="hidden sm:flex items-center gap-2 bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary/80 transition-colors w-fit rounded-lg">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {/* Revenue overview */}
      {isAdmin && (
        <div className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-semibold text-white">Revenue Overview</h2>
                <p className="mt-1 text-xs text-white/50">Paystack-only revenue for the last 30 days, sourced directly from orders.</p>
              </div>
            </div>
            <div className="h-[280px] sm:h-[320px] min-w-[280px]">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-white/50">Loading revenue chart...</div>
              ) : paystackRevenue === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 px-6 text-center text-white/50">
                  <p className="text-sm font-medium">No Paystack revenue recorded in the last 30 days.</p>
                  <p className="mt-2 text-xs text-white/30">Ensure Paystack orders are complete and try again.</p>
                </div>
              ) : (
                <Line data={revenueChartData} options={revenueChartOptions} />
              )}
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-1">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5 shadow-sm">
              <p className="text-sm text-white/50">Total Paystack Revenue</p>
              <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-semibold text-white break-words">KSh {processedRevenue.total.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5 shadow-sm">
              <p className="text-sm text-white/50">Average Paystack Order</p>
              <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-semibold text-white break-words">KSh {processedRevenue.avg.toFixed(0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      {!isAdmin && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 sm:p-4 text-xs sm:text-sm text-yellow-400">
          Moderators have limited admin access: you can view and manage orders, products, categories, slides, and reviews, but user management and financial dashboards are restricted to admins only.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
        {visibleStatCards.map(card => (
          <Link key={card.label} to={card.link} className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 md:p-5 hover:border-primary/50 hover:bg-white/8 transition-all group block">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 ${card.color} rounded-lg flex items-center justify-center mb-2 sm:mb-3`}>
              <card.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white break-words">
              {loading ? <span className="inline-block w-8 h-6 bg-white/10 rounded animate-pulse" /> : card.value}
            </p>
            <p className="text-[10px] sm:text-xs text-white/50 mt-1 break-words">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Orders + Recent Products */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Orders */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-white/10">
            <h2 className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" /> Recent Orders
            </h2>
            <Link to="/admin/orders" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/10">
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 sm:px-5 py-3 animate-pulse">
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/3" />
                </div>
              </div>
            )) : recentOrders.map(o => (
              <div key={o.id} className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 hover:bg-white/5 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-white truncate">{o.customer_name}</p>
                  <p className="text-[10px] sm:text-xs text-white/50 truncate">{o.customer_phone}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs sm:text-sm font-semibold text-primary whitespace-nowrap">
                    {isAdmin ? `KSh ${Number(o.total_amount).toLocaleString()}` : "KSh ****"}
                  </p>
                  <span className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${orderBadge(o.status)} whitespace-nowrap`}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
            {!loading && recentOrders.length === 0 && (
              <p className="text-sm text-white/50 text-center py-8">No orders yet.</p>
            )}
          </div>
        </div>

        {/* Recent Products */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-white/10">
            <h2 className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Recent Products
            </h2>
            <Link to="/admin/products" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/10">
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 sm:px-5 py-3 animate-pulse">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/3" />
                </div>
              </div>
            )) : recentProducts.map(p => {
              const img = p.product_images?.find((i: any) => i.is_primary)?.image_url || p.product_images?.[0]?.image_url || "/placeholder.svg";
              return (
                <div key={p.id} className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 hover:bg-white/5 transition-colors">
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
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain bg-black/30 rounded border border-white/10 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-white truncate">{p.name}</p>
                    <p className="text-[10px] sm:text-xs text-white/50 whitespace-nowrap">KSh {Number(p.price).toLocaleString()}</p>
                  </div>
                  <span className={`text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full ${stockBadge(p.stock_status)} whitespace-nowrap`}>
                    {p.stock_status === "in_stock" ? "In Stock" : p.stock_status === "low_stock" ? "Low Stock" : "Sold Out"}
                  </span>
                </div>
              );
            })}
            {!loading && recentProducts.length === 0 && (
              <p className="text-sm text-white/50 text-center py-8">No products yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-white/10">
          <h2 className="font-semibold text-xs sm:text-sm text-white">Quick Actions</h2>
        </div>
        <div className="p-3 sm:p-4 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {quickActions.map(a => (
            <Link key={a.label} to={a.to} className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border text-xs sm:text-sm font-medium transition-all hover:translate-x-0.5 ${a.color}`}>
              <a.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="truncate">{a.label}</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-auto flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;