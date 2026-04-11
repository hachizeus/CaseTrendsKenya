import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRefreshTrigger } from "@/contexts/RefreshContext";
import { useAuth } from "@/contexts/AuthContext";
import { logAuditAction } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Smartphone, Tablet, Headphones, Gamepad2, Watch, Cable, Tv, Camera, Laptop, Speaker, Battery, Wifi } from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/SkeletonVariants";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = { Smartphone, Tablet, Headphones, Gamepad2, Watch, Cable, Tv, Camera, Laptop, Speaker, Battery, Wifi };
const iconOptions = Object.keys(iconMap);
const emptyCategoryForm = { name: "", slug: "", icon: "Smartphone", display_order: "0", is_active: true };

const AdminCategories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyCategoryForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const { refreshTrigger } = useRefreshTrigger();

  useEffect(() => { 
    loadCategories(); 
  }, [refreshTrigger]);

  useEffect(() => {
    if (!dialogOpen) {
      setEditing(null);
      setForm(emptyCategoryForm);
      setSlugTouched(false);
    }
  }, [dialogOpen]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const [{ data: categoriesData, error: categoriesError }, { data: productCategories, error: productsError }] = await Promise.all([
        (supabase as any).from("categories").select("*").order("display_order"),
        (supabase as any).from("products").select("category"),
      ]);

      if (categoriesError) {
        toast.error(categoriesError.message);
        setCategories([]);
        return;
      }

      if (productsError) {
        toast.error(productsError.message);
      }

      const counts = (productCategories || []).reduce((acc: Record<string, number>, item: any) => {
        if (item.category) {
          acc[item.category] = (acc[item.category] || 0) + 1;
        }
        return acc;
      }, {});

      setCategories(
        (categoriesData || []).map((category: any) => ({
          ...category,
          product_count: counts[category.name] || 0,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditing(null);
    const nextOrder = categories.length > 0 ? Math.max(...categories.map((c: any) => Number(c.display_order) || 0)) + 1 : 0;
    setForm({ ...emptyCategoryForm, display_order: String(nextOrder) });
    setSlugTouched(false);
    setDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, icon: c.icon || "Smartphone", display_order: String(c.display_order), is_active: c.is_active });
    setSlugTouched(Boolean(c.slug));
    setDialogOpen(true);
  };

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const previewSlug = form.slug.trim() || generateSlug(form.name);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    const slug = previewSlug;
    const payload = { name: form.name, slug, icon: form.icon, display_order: Number(form.display_order), is_active: form.is_active };
    if (editing) {
      const { error } = await (supabase as any)
        .from("categories")
        .update(payload)
        .eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Category updated!");
      await logAuditAction({
        actor_id: user?.id ?? null,
        actor_email: user?.email ?? null,
        action_type: "category_updated",
        entity: "categories",
        entity_id: editing.id,
        details: { name: payload.name, slug: payload.slug, is_active: payload.is_active, display_order: payload.display_order },
        user_id: null,
      });
    } else {
      const { data, error } = await (supabase as any).from("categories").insert(payload).select();
      if (error) { toast.error(error.message); return; }
      toast.success("Category created!");
      await logAuditAction({
        actor_id: user?.id ?? null,
        actor_email: user?.email ?? null,
        action_type: "category_created",
        entity: "categories",
        entity_id: data?.[0]?.id ?? null,
        details: { name: payload.name, slug: payload.slug, is_active: payload.is_active, display_order: payload.display_order },
        user_id: null,
      });
    }
    setDialogOpen(false);
    loadCategories();
  };

  const handleDelete = async (cat: any) => {
    if (cat.product_count > 0) {
      toast.error("Cannot delete a category that contains products.");
      return;
    }

    if (!confirm("Delete this category?")) return;
    const { error } = await (supabase as any).from("categories").delete().eq("id", cat.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    await logAuditAction({
      actor_id: user?.id ?? null,
      actor_email: user?.email ?? null,
      action_type: "category_deleted",
      entity: "categories",
      entity_id: cat.id,
      details: { name: cat.name },
      user_id: null,
    });
    loadCategories();
  };

  const toggleActive = async (cat: any) => {
    const { error } = await (supabase as any)
      .from("categories")
      .update({ is_active: !cat.is_active })
      .eq("id", cat.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logAuditAction({
      actor_id: user?.id ?? null,
      actor_email: user?.email ?? null,
      action_type: cat.is_active ? "category_deactivated" : "category_activated",
      entity: "categories",
      entity_id: cat.id,
      details: { is_active: !cat.is_active },
      user_id: null,
    });
    loadCategories();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground">{categories.length} categories</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Add Category</Button>
      </div>

      <div className="bg-white border border-border overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : (
          <>
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground w-10">#</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Category</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Slug</th>
              <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">Products</th>
              <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map(cat => {
              const Icon = iconMap[cat.icon] || Smartphone;
              return (
                <tr key={cat.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground text-xs">{cat.display_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-foreground" />
                      </div>
                      <span className="font-medium">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell font-mono text-xs">{cat.slug}</td>
                  <td className="px-4 py-3 text-center hidden md:table-cell text-muted-foreground text-sm">{cat.product_count ?? 0}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(cat)} className={`text-[10px] font-semibold px-2.5 py-1 transition-colors ${cat.is_active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-secondary text-muted-foreground hover:bg-muted"}`}>
                      {cat.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(cat)} className="p-1.5 hover:bg-secondary border border-transparent hover:border-border transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button
                        onClick={() => handleDelete(cat)}
                        disabled={cat.product_count > 0}
                        className={`p-1.5 transition-colors border border-transparent ${cat.product_count > 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-red-50 hover:text-red-600 hover:border-red-200"}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {categories.length === 0 && <p className="text-muted-foreground text-center py-12 text-sm">No categories yet.</p>}
        </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={e => setForm((f) => {
                  const nextName = e.target.value;
                  return {
                    ...f,
                    name: nextName,
                    slug: slugTouched && f.slug ? f.slug : generateSlug(nextName),
                  };
                })}
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={e => {
                  setForm(f => ({ ...f, slug: e.target.value }));
                  setSlugTouched(true);
                }}
                className="font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                URL: example.com/category/<span className="font-semibold text-primary">{previewSlug || "slug-goes-here"}</span>
              </p>
            </div>
            <div>
              <Label>Icon</Label>
              <div className="grid grid-cols-4 gap-2 mt-1 max-h-[220px] overflow-y-auto p-1 border rounded-md">
                {iconOptions.map(ico => {
                  const Ico = iconMap[ico];
                  return (
                    <button
                      key={ico}
                      type="button"
                      title={ico}
                      onClick={() => setForm(f => ({ ...f, icon: ico }))}
                      className={`group flex flex-col items-center justify-center aspect-square rounded-md border px-2 py-2 text-[10px] transition-all ${
                        form.icon === ico
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border bg-white hover:border-primary hover:bg-primary/5"
                      }`}
                    >
                      <Ico className="w-5 h-5" />
                      <span className="truncate w-full text-center text-[9px] mt-1">{ico}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Display Order</Label>
              <Input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4" />
              Active (visible on storefront)
            </label>
            <Button onClick={handleSave} className="w-full">{editing ? "Update Category" : "Create Category"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategories;
