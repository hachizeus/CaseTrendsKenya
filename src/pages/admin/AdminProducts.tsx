import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

const colorOptions = ["Black", "White", "Blue", "Red", "Green", "Gold", "Silver", "Pink", "Purple", "Gray", "Orange", "Yellow"];

const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", original_price: "", category: "", brand: "", color: "", stock_status: "in_stock", is_featured: false, is_trending: false });

  useEffect(() => { loadProducts(); loadCategories(); }, []);

  const loadProducts = async () => {
    const { data } = await supabase.from("products").select("*, product_images(*)").order("created_at", { ascending: false });
    setProducts(data || []);
  };

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("name").eq("is_active", true).order("display_order");
    setCategories(data || []);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", description: "", price: "", original_price: "", category: categories[0]?.name || "", brand: "", color: "", stock_status: "in_stock", is_featured: false, is_trending: false });
    setDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || "", price: String(p.price), original_price: p.original_price ? String(p.original_price) : "", category: p.category, brand: p.brand, color: p.color || "", stock_status: p.stock_status, is_featured: p.is_featured, is_trending: p.is_trending });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category || !form.brand) { toast.error("Fill in required fields"); return; }
    const payload = { name: form.name, description: form.description || null, price: Number(form.price), original_price: form.original_price ? Number(form.original_price) : null, category: form.category, brand: form.brand, color: form.color || null, stock_status: form.stock_status, is_featured: form.is_featured, is_trending: form.is_trending };
    if (editing) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Product updated!");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Product created!");
    }
    setDialogOpen(false);
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    toast.success("Deleted");
    loadProducts();
  };

  const handleImageUpload = async (productId: string, files: FileList) => {
    setUploading(true);
    const existingImages = products.find(p => p.id === productId)?.product_images || [];
    if (existingImages.length + files.length > 4) {
      toast.error("Max 4 images per product");
      setUploading(false);
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop();
      const path = `${productId}/${Date.now()}_${i}.${ext}`;

      let processedFile = file;
      try {
        const formData = new FormData();
        formData.append("image", file);
        const res = await supabase.functions.invoke("remove-bg", { body: formData });
        if (res.data && !res.error) {
          const byteString = atob(res.data.image);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let j = 0; j < byteString.length; j++) ia[j] = byteString.charCodeAt(j);
          processedFile = new File([ab], `processed.png`, { type: "image/png" });
        }
      } catch { /* fallback to original */ }

      const { error: uploadError } = await supabase.storage.from("product-images").upload(path, processedFile);
      if (uploadError) { toast.error(uploadError.message); continue; }

      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      await supabase.from("product_images").insert({
        product_id: productId,
        image_url: urlData.publicUrl,
        display_order: existingImages.length + i,
        is_primary: existingImages.length === 0 && i === 0,
      });
    }
    setUploading(false);
    toast.success("Images uploaded!");
    loadProducts();
  };

  const deleteImage = async (imgId: string) => {
    await supabase.from("product_images").delete().eq("id", imgId);
    toast.success("Image deleted");
    loadProducts();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products ({products.length})</h1>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Product</Button>
      </div>

      <div className="space-y-4">
        {products.map(p => (
          <div key={p.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-muted-foreground">{p.brand} · {p.category}{p.color ? ` · ${p.color}` : ""} · KSh {Number(p.price).toLocaleString()}</p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {p.product_images?.sort((a: any, b: any) => a.display_order - b.display_order).map((img: any) => (
                    <div key={img.id} className="relative group">
                      <img src={img.image_url} alt="" className="w-16 h-16 object-contain rounded border" />
                      <button onClick={() => deleteImage(img.id)} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {(p.product_images?.length || 0) < 4 && (
                    <label className="w-16 h-16 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:border-primary">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
                      <input type="file" className="hidden" accept="image/*" multiple onChange={e => e.target.files && handleImageUpload(p.id, e.target.files)} />
                    </label>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && <p className="text-muted-foreground text-center py-12">No products yet. Add your first product!</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "New Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Description</Label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full p-3 border rounded-lg text-sm h-20 resize-none bg-background" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Price (KSh) *</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div><Label>Original Price</Label><Input type="number" value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))} placeholder="Leave empty if no discount" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full p-2 border rounded-lg bg-background text-sm">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div><Label>Brand *</Label><Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Color</Label>
                <select value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-full p-2 border rounded-lg bg-background text-sm">
                  <option value="">No color</option>
                  {colorOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label>Stock Status</Label>
                <select value={form.stock_status} onChange={e => setForm(f => ({ ...f, stock_status: e.target.value }))} className="w-full p-2 border rounded-lg bg-background text-sm">
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="low_stock">Low Stock</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} /> Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_trending} onChange={e => setForm(f => ({ ...f, is_trending: e.target.checked }))} /> Trending
              </label>
            </div>
            <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Create"} Product</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
