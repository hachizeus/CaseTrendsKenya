import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Upload, Eye, EyeOff, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Link } from "react-router-dom";

const AdminSlides = () => {
  const [slides, setSlides] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", subtitle: "", cta_text: "", cta_link: "", display_order: "0", is_active: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  useEffect(() => { loadSlides(); }, []);

  const loadSlides = async () => {
    const { data } = await supabase.from("hero_slides").select("*").order("display_order");
    setSlides(data || []);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", subtitle: "", cta_text: "", cta_link: "", display_order: String(slides.length), is_active: true });
    setImageFile(null); setPreview("");
    setDialogOpen(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ title: s.title, subtitle: s.subtitle || "", cta_text: s.cta_text || "", cta_link: s.cta_link || "", display_order: String(s.display_order), is_active: s.is_active });
    setImageFile(null); setPreview(s.image_url);
    setDialogOpen(true);
  };

  const handleFileChange = (file: File | null) => {
    setImageFile(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    let imageUrl = editing?.image_url || "";
    if (imageFile) {
      const path = `slides/${Date.now()}_${imageFile.name}`;
      const { error } = await supabase.storage.from("product-images").upload(path, imageFile);
      if (error) { toast.error(error.message); setSaving(false); return; }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      imageUrl = data.publicUrl;
    }
    if (!imageUrl) { toast.error("Please upload an image"); setSaving(false); return; }
    const payload = { title: form.title, subtitle: form.subtitle || null, image_url: imageUrl, cta_text: form.cta_text || null, cta_link: form.cta_link || null, display_order: Number(form.display_order), is_active: form.is_active };
    if (editing) {
      const { error } = await supabase.from("hero_slides").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Slide updated!");
    } else {
      const { error } = await supabase.from("hero_slides").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Slide created!");
    }
    setSaving(false); setDialogOpen(false); loadSlides();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this slide?")) return;
    await supabase.from("hero_slides").delete().eq("id", id);
    toast.success("Deleted"); loadSlides();
  };

  const toggleActive = async (s: any) => {
    await supabase.from("hero_slides").update({ is_active: !s.is_active }).eq("id", s.id);
    loadSlides();
  };


  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Hero Slides</h1>
          <p className="text-sm text-muted-foreground">{slides.length} slides configured</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Add Slide</Button>
      </div>

      <div className="mb-2">
        <Link to="/admin/slides-overview" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          <ExternalLink className="w-3 h-3" />
          View Homepage Slot Overview
        </Link>
      </div>

      <div className="grid gap-3">
        {[0, 1, 2, 3, 4].map((slot, i) => {
          // Only allow max 5 slides per slot (0-4 for main hero)
          const slidesInSlot = slides.filter(slide => Number(slide.display_order) >= 0 && Number(slide.display_order) <= 4);
          const s = slides.find(slide => Number(slide.display_order) === slot);
          if (s) {
            return (
              <div
                key={s.id}
                className="bg-white border border-border flex overflow-hidden hover:border-primary transition-colors cursor-pointer"
                onClick={() => openEdit(s)}
                title="Edit Slide"
              >
                <div className="relative w-40 sm:w-56 flex-shrink-0">
                  <img src={s.image_url} alt={s.title} className="w-full h-28 object-cover" />
                  <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 font-mono rounded">Slide {i + 1}</span>
                </div>
                <div className="flex-1 p-4 flex items-center justify-between gap-4 min-w-0">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{s.title}</h3>
                    {s.subtitle && <p className="text-sm text-muted-foreground truncate mt-0.5">{s.subtitle}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 ${s.is_active ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-muted-foreground"}`}>
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                      {s.cta_text && <span className="text-[10px] text-muted-foreground border border-border px-2 py-0.5">{s.cta_text}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleActive(s)} className="p-1.5 hover:bg-secondary border border-transparent hover:border-border transition-colors" title={s.is_active ? "Deactivate" : "Activate"}>
                      {s.is_active ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-secondary border border-transparent hover:border-border transition-colors"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          } else {
            // Only show Add Slide if less than 5 slides in slot
            if (slidesInSlot.length < 5) {
              return (
                <div
                  key={"empty-" + slot}
                  className="bg-white border border-dashed border-border flex items-center gap-4 p-4 min-h-[112px]"
                >
                  <div className="relative w-40 sm:w-56 flex-shrink-0 flex items-center justify-center bg-gray-50">
                    <span className="absolute top-2 left-2 bg-black/10 text-black text-[10px] px-1.5 py-0.5 font-mono rounded">Slide {i + 1}</span>
                    <span className="text-xs text-muted-foreground">No image</span>
                  </div>
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-muted-foreground">Empty Slide</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">No content configured for this slot.</p>
                    </div>
                    <button
                      className="p-2 px-4 bg-primary text-white rounded hover:bg-primary/90 text-xs"
                      onClick={() => {
                        setEditing(null);
                        setForm({ title: "", subtitle: "", cta_text: "", cta_link: "", display_order: String(slot), is_active: true });
                        setImageFile(null);
                        setPreview("");
                        setDialogOpen(true);
                      }}
                    >
                      Add Slide
                    </button>
                  </div>
                </div>
              );
            } else {
              // Hide Add Slide if max reached
              return null;
            }
          }
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Slide" : "New Slide"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Image preview */}
            <div>
              <Label>Slide Image *</Label>
              <label className="mt-1 flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer overflow-hidden" style={{ minHeight: 120 }}>
                {preview ? (
                  <img src={preview} alt="preview" className="w-full h-36 object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                    <Upload className="w-6 h-6" />
                    <span className="text-xs">Click to upload image</span>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={e => handleFileChange(e.target.files?.[0] || null)} />
              </label>
              {imageFile && <p className="text-xs text-muted-foreground mt-1">{imageFile.name}</p>}
            </div>
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Subtitle</Label><Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Optional tagline" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Button Text</Label><Input value={form.cta_text} onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))} placeholder="e.g. Shop Now" /></div>
              <div><Label>Button Link</Label><Input value={form.cta_link} onChange={e => setForm(f => ({ ...f, cta_link: e.target.value }))} placeholder="/products" /></div>
            </div>
            <div>
              <Label>Display Order</Label>
              <Input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))} />
              <p className="text-[11px] text-muted-foreground mt-1">
                Slot guide: <strong>0–9</strong> = Main hero · <strong>10–19</strong> = After trending · <strong>20–29</strong> = Between categories (1st) · <strong>30–39</strong> = Between categories (2nd) · <strong>40–49</strong> = Between categories (3rd)
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4" />
              Active (visible on homepage)
            </label>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : editing ? "Update Slide" : "Create Slide"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSlides;
