import { useAuth } from "@/contexts/AuthContext";
import { RefreshProvider, useRefreshTrigger } from "@/contexts/RefreshContext";
import { Navigate, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, Image, Users, FolderTree, Store, Star, ChevronRight, ShoppingBag, Menu, X, TrendingUp, Settings, Bell } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { PullToRefreshOverlay } from "@/components/PullToRefreshOverlay";
import logo from "@/assets/logo.png";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const adminLinks = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/products", label: "Products", icon: Package },
  { path: "/admin/slides-overview", label: "Hero Slides", icon: Image },
  { path: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { path: "/admin/audit-logs", label: "Audit Logs", icon: Settings },
  { path: "/admin/reviews", label: "Reviews", icon: Star },
  { path: "/admin/financials", label: "Financials", icon: TrendingUp, adminOnly: true },
  { path: "/admin/users", label: "Users", icon: Users, adminOnly: true },
];

const AdminLayoutContent = () => {
  const { role, loading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { triggerRefresh } = useRefreshTrigger();
  const isAdmin = role === "admin";
  const navigate = useNavigate();
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const locationRef = useRef(location.pathname);

  const refreshNotifications = useCallback(async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("order_notifications")
      .select("id,is_read")
      .gt("expires_at", now);

    if (error) {
      console.warn("Notifications not yet available:", error.message);
      return;
    }

    const activeNotifications = data ?? [];
    setUnreadNotificationCount(activeNotifications.filter((notification) => !notification.is_read).length);
  }, []);

  const loadNotifications = useCallback(async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("order_notifications")
      .select("id,order_id,customer_name,message,is_read,created_at,payment_method,total_amount")
      .gt("expires_at", now)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Notifications not yet available:", error.message);
      setNotifications([]);
      return;
    }

    setNotifications(data ?? []);
    setUnreadNotificationCount((data ?? []).filter((notification) => !notification.is_read).length);
  }, []);

  const markNotificationsRead = useCallback(async () => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("order_notifications")
      .update({ is_read: true })
      .eq("is_read", false)
      .gt("expires_at", now);

    if (error) {
      console.warn("Failed to mark notifications read:", error.message);
      return;
    }
  }, []);

  const handleNotificationOpenChange = useCallback(
    async (open: boolean) => {
      if (open) {
        await loadNotifications();
      } else {
        await markNotificationsRead();
        setUnreadNotificationCount(0);
      }
    },
    [loadNotifications, markNotificationsRead],
  );

  const handleNotificationClick = async (orderId: string) => {
    await markNotificationsRead();
    setUnreadNotificationCount(0);
    navigate("/admin/orders");
  };

  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!role || (role !== "admin" && role !== "moderator")) return;

    refreshNotifications();
    loadNotifications();

    const handleNotificationChange = async (payload: any) => {
      if (!payload?.new) return;

      await refreshNotifications();
      await loadNotifications();
      triggerRefresh();
      toast.success(`New order received: ${payload.new.customer_name || "Customer"} (${payload.new.order_id.slice(0, 8)})`);
    };

    const channel = supabase.channel("admin-order-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_notifications" },
        handleNotificationChange
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "order_notifications" },
        refreshNotifications
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role, triggerRefresh, refreshNotifications, loadNotifications]);

  const viewOrders = async () => {
    await markNotificationsRead();
    setUnreadNotificationCount(0);
    navigate("/admin/orders");
  };

  const visibleLinks = adminLinks.filter((link) => !link.adminOnly || isAdmin);

  const { containerRef, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh: async () => {
      triggerRefresh();
      // Small delay to ensure UI updates visually
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    threshold: 100,
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!role || (role !== "admin" && role !== "moderator")) return <Navigate to="/" replace />;

  const isActive = (path: string) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  // Sidebar nav component for reuse
  const SidebarNav = () => (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {visibleLinks.map(link => {
        const active = isActive(link.path);
        return (
          <Link
            key={link.path}
            to={link.path}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 group ${
              active
                ? "bg-primary text-white"
                : "text-white/60 hover:text-white hover:bg-white/8"
            }`}
          >
            <link.icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{link.label}</span>
            {active && <ChevronRight className="w-3 h-3 opacity-60" />}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="h-screen flex bg-[#f4f6f9] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#0f1117] text-white flex-col flex-shrink-0 border-r border-white/10 overflow-y-auto h-screen">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10 flex-shrink-0">
          <img src={logo} alt="Case Trends Kenya" className="h-9 w-auto" />
          <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest">Admin Panel</p>
        </div>

        {/* Nav */}
        <SidebarNav />

        {/* Back to store - sticky at bottom */}
        <div className="px-3 py-4 border-t border-white/10 flex-shrink-0 mt-auto">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <Store className="w-4 h-4" />
            <span>Back to Store</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop notification header */}
        <div className="hidden lg:flex items-center justify-end gap-3 px-6 py-3 border-b border-white/10 bg-[#0f1117]">
          <Popover onOpenChange={handleNotificationOpenChange}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="relative inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-2 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                    {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="center"
              sideOffset={8}
              className="w-80 rounded-3xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl"
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
                <p className="text-sm font-semibold text-slate-900">Notifications</p>
                <button
                  type="button"
                  onClick={viewOrders}
                  className="text-xs font-semibold text-primary hover:text-primary-foreground"
                >
                  View all
                </button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-hide">
                {notifications.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleNotificationClick(notification.order_id)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left text-slate-900 shadow-sm transition duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium">{notification.customer_name}</p>
                        {!notification.is_read && (
                          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">New</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-600 leading-5">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-[10px] text-slate-500">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Mobile & Tablet Header */}
        <header className="lg:hidden bg-[#0f1117] text-white px-4 py-3 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-[#0f1117] text-white border-r border-white/10 flex flex-col">
                <div className="px-5 py-5 border-b border-white/10 flex-shrink-0">
                  <img src={logo} alt="Case Trends Kenya" className="h-9 w-auto" />
                  <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest">Admin Panel</p>
                </div>
                <SidebarNav />
                <div className="px-3 py-4 border-t border-white/10 flex-shrink-0 mt-auto">
                  <Link
                    to="/"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                  >
                    <Store className="w-4 h-4" />
                    <span>Back to Store</span>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
            <img src={logo} alt="Case Trends Kenya" className="h-7 w-auto" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <p className="text-xs font-semibold text-white/70">Admin</p>
            <Popover onOpenChange={handleNotificationOpenChange}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="relative rounded-full border border-white/10 bg-white/5 p-2 text-white hover:bg-white/10 transition"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                      {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="center"
                sideOffset={8}
                className="w-80 rounded-3xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl"
              >
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
                  <p className="text-sm font-semibold text-slate-900">Notifications</p>
                  <button
                    type="button"
                    onClick={viewOrders}
                    className="text-xs font-semibold text-primary hover:text-primary-foreground"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-hide">
                  {notifications.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleNotificationClick(notification.order_id)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left text-slate-900 shadow-sm transition duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.99]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium">{notification.customer_name}</p>
                          {!notification.is_read && (
                            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">New</span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-600 leading-5">
                          {notification.message}
                        </p>
                        <p className="mt-2 text-[10px] text-slate-500">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto" ref={containerRef}>
          <PullToRefreshOverlay isRefreshing={isRefreshing} pullDistance={pullDistance} progress={progress} />
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl ml-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const AdminLayout = () => {
  return (
    <RefreshProvider>
      <AdminLayoutContent />
    </RefreshProvider>
  );
};

export default AdminLayout;
