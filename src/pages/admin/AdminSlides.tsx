import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { logAuditAction } from "@/lib/audit";
import { supabase } from "@/integrations/supabase/client";
import { useRefreshTrigger } from "@/contexts/RefreshContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Upload, Eye, EyeOff, ExternalLink, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { getOptimizedImageUrl } from "@/lib/imageOptimization";

const AdminSlides = () => {
  const { user } = useAuth();
  const [slides, setSlides] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", subtitle: "", cta_text: "", cta_link: "", display_order: "0", is_active: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [sectionId, setSectionId] = useState<string>("");
  const { refreshTrigger } = useRefreshTrigger();

  useEffect(() => { loadSlides(); loadHeroSectionId(); }, [refreshTrigger]);

  const loadSlides = async () => {
    const { data } = await supabase.from("hero_slides").select("*").order("display_order");
    setSlides(data || []);
  };

  const loadHeroSectionId = async () => {
    const { data } = await (supabase.from("hero_sections") as any)
      .select("id")
      .eq("section_number", 1)
      .limit(1)
      .single();

    if (data?.id) setSectionId(data.id);
  };

  const resolveHeroSectionId = async () => {
    if (sectionId) return sectionId;

    const { data, error } = await (supabase.from("hero_sections") as any)
      .select("id")
      .eq("section_number", 1)
      .limit(1)
      .single();

    if (error || !data?.id) return "";
    setSectionId(data.id);
    return data.id;
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
    const resolvedSectionId = editing?.section_id || (await resolveHeroSectionId());
    if (!resolvedSectionId) {
      toast.error("Main hero section not configured. Please create hero section #1 first.");
      setSaving(false);
      return;
    }

    const payload = {
      title: form.title,
      subtitle: form.subtitle || null,
      image_url: imageUrl,
      cta_text: form.cta_text || null,
      cta_link: form.cta_link || null,
      display_order: Number(form.display_order),
      is_active: form.is_active,
      section_id: resolvedSectionId,
    };

    if (editing) {
      const { error } = await (supabase.from("hero_slides") as any).update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Slide updated!");
      await logAuditAction({
        actor_id: user?.id ?? null,
        actor_email: user?.email ?? null,
        action_type: "slide_updated",
        entity: "hero_slides",
        entity_id: editing.id,
        details: { title: payload.title, is_active: payload.is_active, section_id: payload.section_id },
        user_id: null,
      });
    } else {
      const { error } = await (supabase.from("hero_slides") as any).insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Slide created!");
      await logAuditAction({
        actor_id: user?.id ?? null,
        actor_email: user?.email ?? null,
        action_type: "slide_created",
        entity: "hero_slides",
        entity_id: null,
        details: { title: payload.title, is_active: payload.is_active, section_id: payload.section_id },
        user_id: null,
      });
    }
    setSaving(false); setDialogOpen(false); loadSlides();
  };

  const toggleActive = async (s: any) => {
    const { error } = await (supabase.from("hero_slides") as any).update({ is_active: !s.is_active }).eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    await logAuditAction({
      actor_id: user?.id ?? null,
      actor_email: user?.email ?? null,
      action_type: s.is_active ? "slide_deactivated" : "slide_activated",
      entity: "hero_slides",
      entity_id: s.id,
      details: { is_active: !s.is_active },
      user_id: null,
    });
    loadSlides();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this slide?")) return;
    const { error } = await (supabase.from("hero_slides") as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    await logAuditAction({
      actor_id: user?.id ?? null,
      actor_email: user?.email ?? null,
      action_type: "slide_deleted",
      entity: "hero_slides",
      entity_id: id,
      details: null,
      user_id: null,
    });
    loadSlides();
  };

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/40 rounded-full"></div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Hero Slides
            </h1>
          </div>
          <p className="text-sm text-white/50 ml-3">{slides.length} slides configured</p>
        </div>
        <Button onClick={openNew} className="gap-2 bg-primary text-white hover:bg-primary/80">
          <Plus className="w-4 h-4" /> Add Slide
        </Button>
      </div>

      {/* Navigation Link */}
      <div className="mb-2">
        <Link to="/admin/slides-overview" className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
          <ExternalLink className="w-3 h-3" />
          View Homepage Slot Overview
        </Link>
      </div>

      {/* Slides Grid */}
      <div className="grid gap-3">
        {[0, 1, 2, 3, 4].map((slot, i) => {
          const slidesInSlot = slides.filter(slide => Number(slide.display_order) >= 0 && Number(slide.display_order) <= 4);
          const s = slides.find(slide => Number(slide.display_order) === slot);
          if (s) {
            return (
              <div
                key={s.id}
                className="bg-white/5 border border-white/10 rounded-xl flex overflow-hidden hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => openEdit(s)}
              >
                <div className="relative w-32 sm:w-40 md:w-48 flex-shrink-0">
                  <img 
                    src={getOptimizedImageUrl(s.image_url, {
                      width: 400,
                      height: 180,
                      quality: 70,
                      resize: "contain",
                    })} 
                    alt={s.title} 
                    loading="lazy" 
                    className="w-full h-24 sm:h-28 object-cover" 
                  />
                  <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 font-mono rounded">
                    Slide {i + 1}
                  </span>
                </div>
                <div className="flex-1 p-3 sm:p-4 flex items-center justify-between gap-3 min-w-0">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">{s.title}</h3>
                    {s.subtitle && <p className="text-sm text-white/50 truncate mt-0.5">{s.subtitle}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          s.is_active 
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                            : "bg-white/10 text-white/50 border border-white/10"
                        }`}
                      >
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                      {s.cta_text && (
                        <span className="text-[10px] text-white/40 border border-white/10 px-2 py-0.5 rounded-full">
                          {s.cta_text}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => toggleActive(s)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title={s.is_active ? "Deactivate" : "Activate"}
                    >
                      {s.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(s)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-white/60 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          } else {
            if (slidesInSlot.length < 5) {
              return (
                <div
                  key={"empty-" + slot}
                  className="bg-white/5 border border-dashed border-white/20 rounded-xl flex items-center gap-4 p-4 min-h-[112px]"
                >
                  <div className="relative w-32 sm:w-40 md:w-48 flex-shrink-0 flex items-center justify-center bg-black/30 rounded-lg">
                    <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 font-mono rounded">Slide {i + 1}</span>
                    <ImageIcon className="w-8 h-8 text-white/20" />
                  </div>
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white/50">Empty Slot</h3>
                      <p className="text-sm text-white/30 mt-0.5">No content configured for this slot.</p>
                    </div>
                    <button
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors text-sm"
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
              return null;
            }
          }
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[hsl(240,10%,6%)] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">{editing ? "Edit Slide" : "New Slide"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Image preview */}
            <div>
              <Label className="text-white/70">Slide Image *</Label>
              <label className="mt-1 flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-primary/50 transition-colors cursor-pointer overflow-hidden rounded-lg" style={{ minHeight: 120 }}>
                {preview ? (
                  <img src={getOptimizedImageUrl(preview, {
                    width: 1200,
                    height: 500,
                    quality: 70,
                    resize: "contain",
                  })} alt="preview" className="w-full h-36 object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 text-white/50">
                    <Upload className="w-6 h-6" />
                    <span className="text-xs">Click to upload image</span>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={e => handleFileChange(e.target.files?.[0] || null)} />
              </label>
              {imageFile && <p className="text-xs text-white/40 mt-1">{imageFile.name}</p>}
            </div>
            <div>
              <Label className="text-white/70">Title *</Label>
              <Input 
                value={form.title} 
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                className="mt-1 bg-black/30 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div>
              <Label className="text-white/70">Subtitle</Label>
              <Input 
                value={form.subtitle} 
                onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} 
                placeholder="Optional tagline" 
                className="mt-1 bg-black/30 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/70">Button Text</Label>
                <Input 
                  value={form.cta_text} 
                  onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))} 
                  placeholder="e.g. Shop Now" 
                  className="mt-1 bg-black/30 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div>
                <Label className="text-white/70">Button Link</Label>
                <Input 
                  value={form.cta_link} 
                  onChange={e => setForm(f => ({ ...f, cta_link: e.target.value }))} 
                  placeholder="/products" 
                  className="mt-1 bg-black/30 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
            </div>
            <div>
              <Label className="text-white/70">Display Order</Label>
              <Input 
                type="number" 
                value={form.display_order} 
                onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))} 
                className="mt-1 bg-black/30 border-white/10 text-white"
              />
              <p className="text-[11px] text-white/40 mt-1">
                Slot guide: <strong className="text-white/60">0–9</strong> = Main hero · <strong className="text-white/60">10–19</strong> = After trending · <strong className="text-white/60">20–29</strong> = Between categories (1st) · <strong className="text-white/60">30–39</strong> = Between categories (2nd) · <strong className="text-white/60">40–49</strong> = Between categories (3rd)
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer text-white/70">
              <input 
                type="checkbox" 
                checked={form.is_active} 
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} 
                className="w-4 h-4 rounded border-white/20 text-primary focus:ring-primary/50"
              />
              Active (visible on homepage)
            </label>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-primary text-white hover:bg-primary/80">
              {saving ? "Saving..." : editing ? "Update Slide" : "Create Slide"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSlides;