import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, Image, Users, ArrowLeft, FolderTree } from "lucide-react";

const adminLinks = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/products", label: "Products", icon: Package },
  { path: "/admin/categories", label: "Categories", icon: FolderTree },
  { path: "/admin/slides", label: "Hero Slides", icon: Image },
  { path: "/admin/users", label: "Users", icon: Users },
];

const AdminLayout = () => {
  const { isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex bg-secondary">
      <aside className="w-64 bg-card border-r border-border p-4 hidden md:block">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>
        <h2 className="font-bold text-lg mb-6">Admin Panel</h2>
        <nav className="space-y-1">
          {adminLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.path ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Mobile nav */}
        <div className="md:hidden flex gap-2 mb-6 overflow-x-auto pb-2">
          <Link to="/" className="px-3 py-2 text-sm bg-card border rounded-lg whitespace-nowrap">← Store</Link>
          {adminLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-2 text-sm rounded-lg whitespace-nowrap ${
                location.pathname === link.path ? "bg-primary text-primary-foreground" : "bg-card border"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
