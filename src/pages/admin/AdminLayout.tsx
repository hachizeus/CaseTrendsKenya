import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, Image, Users, FolderTree, Store, Star, ChevronRight, ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const adminLinks = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/products", label: "Products", icon: Package },
  { path: "/admin/categories", label: "Categories", icon: FolderTree },
  { path: "/admin/slides-overview", label: "Hero Slides", icon: Image },
  { path: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { path: "/admin/reviews", label: "Reviews", icon: Star },
  { path: "/admin/users", label: "Users", icon: Users },
];

const AdminLayout = () => {
  const { isAdmin, loading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAdmin) return <Navigate to="/" replace />;

  const isActive = (path: string) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  // Sidebar nav component for reuse
  const SidebarNav = () => (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {adminLinks.map(link => {
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
          <p className="text-xs font-semibold text-white/70 ml-auto">Admin</p>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl ml-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
