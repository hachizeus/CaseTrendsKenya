import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, Users, Image, ShoppingCart } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ products: 0, users: 0, slides: 0, reviews: 0 });

  useEffect(() => {
    const load = async () => {
      const [p, u, s, r] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("hero_slides").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
      ]);
      setStats({ products: p.count || 0, users: u.count || 0, slides: s.count || 0, reviews: r.count || 0 });
    };
    load();
  }, []);

  const cards = [
    { label: "Products", value: stats.products, icon: Package, color: "text-primary" },
    { label: "Users", value: stats.users, icon: Users, color: "text-accent" },
    { label: "Hero Slides", value: stats.slides, icon: Image, color: "text-badge-new" },
    { label: "Reviews", value: stats.reviews, icon: ShoppingCart, color: "text-badge-sale" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-card p-6 rounded-xl border border-border">
            <c.icon className={`w-8 h-8 ${c.color} mb-3`} />
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
