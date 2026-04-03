import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

const iconOptions = ["Smartphone", "Tablet", "Headphones", "Gamepad2", "Watch", "Cable", "Tv", "Camera", "Laptop", "Speaker", "Battery", "Wifi"];

const AdminCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", icon: "Smartphone", display_order: "0", is_active: true });

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("display_order");
    setCategories(data || []);
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
    setDialogOpen(false);
    loadCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    loadCategories();
  };

  const toggleActive = async (cat: any) => {
    await supabase.from("categories").update({ is_active: !cat.is_active }).eq("id", cat.id);
    loadCategories();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Category</Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left p-3 w-12">#</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3 hidden sm:table-cell">Slug</th>
              <th className="text-left p-3 hidden md:table-cell">Icon</th>
              <th className="text-center p-3">Status</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id} className="border-t border-border">
                <td className="p-3 text-muted-foreground">{cat.display_order}</td>
                <td className="p-3 font-medium">{cat.name}</td>
                <td className="p-3 hidden sm:table-cell text-muted-foreground">{cat.slug}</td>
                <td className="p-3 hidden md:table-cell text-muted-foreground">{cat.icon}</td>
                <td className="p-3 text-center">
                  <button onClick={() => toggleActive(cat)} className={`text-xs px-2 py-0.5 rounded-full ${cat.is_active ? "bg-badge-new text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {cat.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && <p className="text-muted-foreground text-center py-12">No categories yet.</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) })); }} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
            </div>
            <div>
              <Label>Icon</Label>
              <select value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className="w-full p-2 border rounded-lg bg-background text-sm">
                {iconOptions.map(ico => <option key={ico} value={ico}>{ico}</option>)}
              </select>
            </div>
            <div>
              <Label>Display Order</Label>
              <Input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} /> Active
            </label>
            <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Create"} Category</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategories;
