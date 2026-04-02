import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

const AdminSlides = () => {
  const [slides, setSlides] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", subtitle: "", cta_text: "", cta_link: "", display_order: "0", is_active: true });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => { loadSlides(); }, []);

  const loadSlides = async () => {
    const { data } = await supabase.from("hero_slides").select("*").order("display_order");
    setSlides(data || []);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", subtitle: "", cta_text: "", cta_link: "", display_order: String(slides.length), is_active: true });
    setImageFile(null);
    setDialogOpen(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ title: s.title, subtitle: s.subtitle || "", cta_text: s.cta_text || "", cta_link: s.cta_link || "", display_order: String(s.display_order), is_active: s.is_active });
    setImageFile(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    let imageUrl = editing?.image_url || "";

    if (imageFile) {
      const path = `slides/${Date.now()}_${imageFile.name}`;
      const { error } = await supabase.storage.from("product-images").upload(path, imageFile);
      if (error) { toast.error(error.message); return; }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      imageUrl = data.publicUrl;
    }

    if (!imageUrl) { toast.error("Please upload an image"); return; }

    const payload = { title: form.title, subtitle: form.subtitle || null, image_url: imageUrl, cta_text: form.cta_text || null, cta_link: form.cta_link || null, display_order: Number(form.display_order), is_active: form.is_active };

    if (editing) {
      const { error } = await supabase.from("hero_slides").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Slide updated!");
    } else {
      const { error } = await supabase.from("hero_slides").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Slide created!");
    }
    setDialogOpen(false);
    loadSlides();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this slide?")) return;
    await supabase.from("hero_slides").delete().eq("id", id);
    toast.success("Deleted");
    loadSlides();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Hero Slides</h1>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Slide</Button>
      </div>

      <div className="grid gap-4">
        {slides.map(s => (
          <div key={s.id} className="bg-card border rounded-xl overflow-hidden flex">
            <img src={s.image_url} alt={s.title} className="w-40 h-24 object-cover" />
            <div className="flex-1 p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.subtitle}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${s.is_active ? "bg-badge-new text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {s.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        ))}
        {slides.length === 0 && <p className="text-muted-foreground text-center py-12">No slides yet.</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Slide" : "New Slide"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Subtitle</Label><Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>CTA Text</Label><Input value={form.cta_text} onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))} placeholder="e.g. Shop Now" /></div>
              <div><Label>CTA Link</Label><Input value={form.cta_link} onChange={e => setForm(f => ({ ...f, cta_link: e.target.value }))} placeholder="e.g. #products" /></div>
            </div>
            <div><Label>Order</Label><Input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))} /></div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} /> Active
            </label>
            <div>
              <Label>Image</Label>
              <label className="flex items-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary">
                <Upload className="w-4 h-4" />
                <span className="text-sm">{imageFile?.name || (editing ? "Change image" : "Choose image")}</span>
                <input type="file" className="hidden" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
              </label>
            </div>
            <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Create"} Slide</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSlides;
