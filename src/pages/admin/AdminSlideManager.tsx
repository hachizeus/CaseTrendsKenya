import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { logAuditAction } from "@/lib/audit";
import { supabase } from "@/integrations/supabase/client";
import { useRefreshTrigger } from "@/contexts/RefreshContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Upload, Eye, EyeOff, ChevronLeft, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { getOptimizedImageUrl } from "@/lib/imageOptimization";

const AdminSlideManager = () => {
  const { user } = useAuth();
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const { refreshTrigger } = useRefreshTrigger();
  const anySupabase = supabase as any;

  const [section, setSection] = useState<any>(null);
  const [slides, setSlides] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    cta_text: "",
    cta_link: "",
    is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    if (!sectionId) return;
    loadSection();
    loadSlides();
  }, [sectionId, refreshTrigger]);

  const loadSection = async () => {
    const { data } = await anySupabase
      .from("hero_sections")
      .select("*")
      .eq("id", sectionId)
      .single();
    setSection(data);
  };

  const loadSlides = async () => {
    const { data } = await anySupabase
      .from("hero_slides")
      .select("*")
      .eq("section_id", sectionId)
      .order("display_order");
    setSlides(data || []);
  };

  const openNew = () => {
    if (slides.length >= 5) {
      toast.error("Maximum 5 slides per section");
      return;
    }
    setEditing(null);
    setForm({
      title: "",
      subtitle: "",
      cta_text: "",
      cta_link: "",
      is_active: true,
    });
    setImageFile(null);
    setPreview("");
    setDialogOpen(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      title: s.title,
      subtitle: s.subtitle || "",
      cta_text: s.cta_text || "",
      cta_link: s.cta_link || "",
      is_active: s.is_active,
    });
    setImageFile(null);
    setPreview(s.image_url);
    setDialogOpen(true);
  };

  const handleFileChange = (file: File | null) => {
    setImageFile(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const normalizeLink = (link: string) => {
    const trimmed = link.trim();
    if (!trimmed) return null;
    if (/^\//.test(trimmed) || /^#/.test(trimmed)) return trimmed;
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    let imageUrl = editing?.image_url || "";

    const uploadNewImage = async () => {
      if (!imageFile) return imageUrl;
      const path = `slides/section_${sectionId}/${Date.now()}_${imageFile.name}`;
      const { error } = await anySupabase.storage.from("product-images").upload(path, imageFile);
      if (error) {
        toast.error(error.message);
        return null;
      }
      const { data } = anySupabase.storage.from("product-images").getPublicUrl(path);
      if (!data?.publicUrl) {
        toast.error("Unable to get uploaded image URL");
        return null;
      }
      if (editing?.image_url) {
        const oldPathMatch = editing.image_url.match(/product-images\/(.+)$/);
        if (oldPathMatch?.[1]) {
          await anySupabase.storage.from("product-images").remove([oldPathMatch[1]]);
        }
      }
      return data.publicUrl;
    };

    if (imageFile) {
      const uploadedUrl = await uploadNewImage();
      if (!uploadedUrl) {
        setSaving(false);
        return;
      }
      imageUrl = uploadedUrl;
    }

    if (!imageUrl) {
      toast.error("Please upload an image");
      setSaving(false);
      return;
    }

    const payload = {
      title: form.title,
      subtitle: form.subtitle || null,
      image_url: imageUrl,
      cta_text: form.cta_text || null,
      cta_link: normalizeLink(form.cta_link || ""),
      is_active: form.is_active,
      section_id: sectionId,
      display_order: editing?.display_order ?? slides.length,
    };

    if (editing) {
      const { error } = await anySupabase
        .from("hero_slides")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
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
      const { data, error } = await anySupabase.from("hero_slides").insert(payload).select();
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success("Slide created!");
      await logAuditAction({
        actor_id: user?.id ?? null,
        actor_email: user?.email ?? null,
        action_type: "slide_created",
        entity: "hero_slides",
        entity_id: (data as any)?.[0]?.id ?? null,
        details: { title: payload.title, is_active: payload.is_active, section_id: payload.section_id },
        user_id: null,
      });
    }

    setSaving(false);
    setDialogOpen(false);
    loadSlides();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this slide?")) return;
    const { error } = await anySupabase.from("hero_slides").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
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

  const swapSlideOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const current = slides[index];
    const target = slides[targetIndex];
    if (!current || !target) return;

    const { error: currentError } = await anySupabase
      .from("hero_slides")
      .update({ display_order: target.display_order })
      .eq("id", current.id);

    const { error: targetError } = await anySupabase
      .from("hero_slides")
      .update({ display_order: current.display_order })
      .eq("id", target.id);

    if (currentError || targetError) {
      toast.error(currentError?.message || targetError?.message || "Unable to reorder slides");
      return;
    }

    setSlides(prev => {
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const toggleActive = async (s: any) => {
    const { error } = await anySupabase
      .from("hero_slides")
      .update({ is_active: !s.is_active })
      .eq("id", s.id);
    if (error) {
      toast.error(error.message);
      return;
    }
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

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/slides-overview")}
          className="p-2 hover:bg-secondary border border-transparent hover:border-border transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold">{section?.label}</h1>
          <p className="text-sm text-muted-foreground">{slides.length}/5 slides</p>
        </div>
      </div>

      {slides.length < 5 && (
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Add Slide
        </Button>
      )}

      <div className="grid gap-3">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className="bg-white border border-border flex overflow-hidden hover:border-primary transition-colors cursor-pointer"
            onClick={() => openEdit(s)}
            title="Edit Slide"
          >
            <div className="relative w-40 sm:w-56 flex-shrink-0">
              <img src={getOptimizedImageUrl(s.image_url, {
                width: 560,
                height: 180,
                quality: 70,
                resize: "contain",
              })} alt={s.title} loading="lazy" decoding="async" className="w-full h-28 object-cover" />
              <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 font-mono rounded">
                Slide {i + 1}
              </span>
            </div>
            <div className="flex-1 p-4 flex items-center justify-between gap-4 min-w-0">
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{s.title}</h3>
                {s.subtitle && <p className="text-sm text-muted-foreground truncate mt-0.5">{s.subtitle}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 ${
                      s.is_active ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {s.is_active ? "Active" : "Inactive"}
                  </span>
                  {s.cta_text && (
                    <span className="text-[10px] text-muted-foreground border border-border px-2 py-0.5">
                      {s.cta_text}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => swapSlideOrder(i, "up")}
                  disabled={i === 0}
                  className={`p-1.5 border border-transparent transition-colors ${i === 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-secondary hover:border-border"}`}
                  title="Move up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => swapSlideOrder(i, "down")}
                  disabled={i === slides.length - 1}
                  className={`p-1.5 border border-transparent transition-colors ${i === slides.length - 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-secondary hover:border-border"}`}
                  title="Move down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleActive(s)}
                  className="p-1.5 hover:bg-secondary border border-transparent hover:border-border transition-colors"
                  title={s.is_active ? "Deactivate" : "Activate"}
                >
                  {s.is_active ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => openEdit(s)}
                  className="p-1.5 hover:bg-secondary border border-transparent hover:border-border transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-1.5 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Slide" : "New Slide"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Slide Image *</Label>
              <label className="mt-1 flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer overflow-hidden" style={{ minHeight: 120 }}>
                {preview ? (
                  <img src={getOptimizedImageUrl(preview, {
                    width: 1200,
                    height: 500,
                    quality: 70,
                    resize: "contain",
                  })} alt="preview" loading="lazy" decoding="async" className="w-full h-36 object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                    <Upload className="w-6 h-6" />
                    <span className="text-xs">Click to upload image</span>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />
              </label>
              <p className="text-xs text-muted-foreground mt-1">16:9 recommended for best slide display.</p>
              {imageFile && <p className="text-xs text-muted-foreground mt-1">{imageFile.name}</p>}
            </div>
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                placeholder="Optional tagline"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Button Text</Label>
                <Input
                  value={form.cta_text}
                  onChange={(e) => setForm((f) => ({ ...f, cta_text: e.target.value }))}
                  placeholder="e.g. Shop Now"
                />
              </div>
              <div>
                <Label>Button Link</Label>
                <Input
                  value={form.cta_link}
                  onChange={(e) => setForm((f) => ({ ...f, cta_link: e.target.value }))}
                  placeholder="/products"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="w-4 h-4"
              />
              Active (visible on homepage carousel)
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

export default AdminSlideManager;
