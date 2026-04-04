import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

const AdminCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", slug: "", icon: "Smartphone", display_order: "0", is_active: true });

  useEffect(() => { 
    loadCategories(); 
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("display_order");
    setCategories(data || []);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", slug: "", icon: "Smartphone", display_order: String(categories.length), is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, icon: c.icon || "Smartphone", display_order: String(c.display_order), is_active: c.is_active });
    setDialogOpen(true);
  };

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    const slug = form.slug || generateSlug(form.name);
    const payload = { name: form.name, slug, icon: form.icon, display_order: Number(form.display_order), is_active: form.is_active };
    if (editing) {
      const { error } = await supabase.from("categories").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Category updated!");
    } else {
      const { error } = await supabase.from("categories").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Category created!");
    }
    setDialogOpen(false); loadCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted"); loadCategories();
  };

  const toggleActive = async (cat: any) => {
    await supabase.from("categories").update({ is_active: !cat.is_active }).eq("id", cat.id);
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
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(cat)} className={`text-[10px] font-semibold px-2.5 py-1 transition-colors ${cat.is_active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-secondary text-muted-foreground hover:bg-muted"}`}>
                      {cat.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(cat)} className="p-1.5 hover:bg-secondary border border-transparent hover:border-border transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="font-mono text-sm" />
            </div>
            <div>
              <Label>Icon</Label>
              <div className="grid grid-cols-6 gap-2 mt-1">
                {iconOptions.map(ico => {
                  const Ico = iconMap[ico];
                  return (
                    <button key={ico} type="button" onClick={() => setForm(f => ({ ...f, icon: ico }))}
                      className={`flex flex-col items-center gap-1 p-2 border text-[10px] transition-colors ${form.icon === ico ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary"}`}
                    >
                      <Ico className="w-4 h-4" />
                      <span className="truncate w-full text-center">{ico}</span>
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
