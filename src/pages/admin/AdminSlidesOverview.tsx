// @ts-nocheck
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRefreshTrigger } from "@/contexts/RefreshContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Upload, Eye, EyeOff, X, Loader2, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { logAuditAction } from "@/lib/audit";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { compressImage, formatFileSize, getImageDimensions, getOptimizedImageUrl } from "@/lib/imageOptimization";
import type { CompressedImage } from "@/lib/imageOptimization";

// Helper function to normalize links
const normalizeLink = (link: string): string => {
  if (!link) return "/products";
  if (link.startsWith("http") || link.startsWith("/")) return link;
  return `/${link}`;
};

// Helper function to delete image/slide
const deleteImage = async (slideId: string, imageUrl: string, tableName: string, storageBucket: string) => {
  try {
    const { error } = await (supabase
      .from(tableName as any)
      .delete()
      .eq("id", slideId));
    
    if (error) throw error;
    
    toast.success("Slide deleted successfully");
  } catch (error) {
    console.error("Error deleting slide:", error);
    toast.error("Failed to delete slide");
    throw error;
  }
};

// WebP conversion utility for slides
async function convertToWebP(file: File, quality: number = 85): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        let width = img.width;
        let height = img.height;
        const maxWidth = 1920;
        const maxHeight = 800;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to convert image to WebP"));
              return;
            }
            const webpFile = new File([blob], file.name.replace(/\.\w+$/, ".webp"), {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(webpFile);
          },
          "image/webp",
          quality / 100
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
  });
}

export default function AdminSlidesOverview() {
  const { user, isAdmin, isModerator, loading: authLoading } = useAuth();
  const { refreshTrigger } = useRefreshTrigger();
  const anySupabase = supabase as any;
  const [sections, setSections] = useState<any[]>([]);
  const [slides, setSlides] = useState<{ [sectionId: string]: any[] }>({});
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  
  // Slide form state
  const [slideDialogOpen, setSlideDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<any>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [slideForm, setSlideForm] = useState({
    title: "",
    subtitle: "",
    cta_text: "",
    cta_link: "",
    is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<CompressedImage | null>(null);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12 bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin && !isModerator) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    loadSections();
  }, [refreshTrigger]);

  const loadSections = async () => {
    setLoading(true);
    try {
      const { data: sectionsData, error } = await (anySupabase
        .from("hero_sections")
        .select("*")
        .order("section_number"));

      if (error) {
        console.error("AdminSlidesOverview - Error loading sections:", error);
        setSections([]);
        setLoading(false);
        return;
      }

      setSections(sectionsData || []);

      if (sectionsData && sectionsData.length > 0) {
        const slidesData: { [key: string]: any[] } = {};
        
        for (const section of sectionsData) {
          const { data: sectionSlides, error: slidesError } = await (anySupabase
            .from("hero_slides")
            .select("*")
            .eq("section_id", section.id)
            .order("display_order"));
          
          if (!slidesError) {
            slidesData[section.id] = sectionSlides || [];
          }
        }
        
        setSlides(slidesData);
      }
    } catch (err) {
      console.error("AdminSlidesOverview - Error in loadSections:", err);
    } finally {
      setLoading(false);
    }
  };

  const seedHeroSections = async () => {
    setSeeding(true);
    try {
      const heroSectionsData = [
        { section_number: 1, label: "Main Hero" },
        { section_number: 2, label: "After Trending Products" },
        { section_number: 3, label: "Between Category 1 & 2" },
        { section_number: 4, label: "Between Category 3 & 4" },
        { section_number: 5, label: "Between Category 5 & 6" },
      ];

      for (const section of heroSectionsData) {
        const { error } = await (anySupabase
          .from("hero_sections")
          .insert([section])
          .select());

        if (error && !error.message.includes("duplicate key")) {
          throw error;
        }
      }

      await logAuditAction({
        actor_id: user?.id ?? null,
        actor_email: user?.email ?? null,
        action_type: "hero_sections_seeded",
        entity: "hero_sections",
        entity_id: null,
        details: { count: heroSectionsData.length },
        user_id: null,
      });
      await loadSections();
      toast.success("Hero sections created successfully!");
    } catch (err: any) {
      console.error("Error seeding hero sections:", err);
      toast.error(`Error creating sections: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const openNewSlide = (sectionId: string) => {
    const sectionSlides = slides[sectionId] || [];
    if (sectionSlides.length >= 5) {
      toast.error("Maximum 5 slides per section");
      return;
    }
    setSelectedSectionId(sectionId);
    setEditingSlide(null);
    setSlideForm({
      title: "",
      subtitle: "",
      cta_text: "",
      cta_link: "",
      is_active: true,
    });
    setImageFile(null);
    setPreview("");
    setCompressionStats(null);
    setSlideDialogOpen(true);
  };

  const openEditSlide = (sectionId: string, slide: any) => {
    setSelectedSectionId(sectionId);
    setEditingSlide(slide);
    setSlideForm({
      title: slide.title,
      subtitle: slide.subtitle || "",
      cta_text: slide.cta_text || "",
      cta_link: slide.cta_link || "",
      is_active: slide.is_active,
    });
    setImageFile(null);
    setPreview(slide.image_url);
    setCompressionStats(null);
    setSlideDialogOpen(true);
  };

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      setImageFile(null);
      setPreview("");
      setCompressionStats(null);
      return;
    }

    setCompressing(true);
    try {
      let webpFile: File;
      
      if (file.type === "image/webp") {
        webpFile = file;
      } else {
        webpFile = await convertToWebP(file, 85);
      }
      
      const compressed = await compressImage(webpFile, {
        maxWidth: 1920,
        maxHeight: 800,
        quality: 0.85,
        mimeType: "image/webp",
      });

      const finalFile = new File([compressed.blob], webpFile.name, {
        type: "image/webp",
      });

      setImageFile(finalFile);
      setCompressionStats(compressed);
      setPreview(URL.createObjectURL(compressed.blob));

      toast.success(
        `✨ Image converted to WebP! ${formatFileSize(file.size)} → ${formatFileSize(compressed.size)} (${compressed.compressionRatio}% smaller)`,
        { duration: 5000 }
      );
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to optimize image. Using original.");
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    } finally {
      setCompressing(false);
    }
  };

  const saveSlide = async () => {
    if (!selectedSectionId) {
      toast.error("No section selected");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = preview;
      
      if (imageFile) {
        const fileName = `hero_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.webp`;
        const { data: uploadData, error: uploadError } = await anySupabase
          .storage
          .from("product-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = anySupabase
          .storage
          .from("product-images")
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      const payload = {
        title: slideForm.title,
        subtitle: slideForm.subtitle || null,
        image_url: imageUrl,
        cta_text: slideForm.cta_text || null,
        cta_link: normalizeLink(slideForm.cta_link || ""),
        is_active: slideForm.is_active,
        section_id: selectedSectionId,
        display_order: editingSlide?.display_order ?? (slides[selectedSectionId]?.length ?? 0),
      };

      if (editingSlide) {
        const { error } = await anySupabase
          .from("hero_slides")
          .update(payload)
          .eq("id", editingSlide.id);
        if (error) throw error;
        toast.success("Slide updated successfully!");
      } else {
        const { error } = await anySupabase
          .from("hero_slides")
          .insert([payload]);
        if (error) throw error;
        toast.success("Slide created successfully!");
      }

      setSlideDialogOpen(false);
      await loadSections();
    } catch (error: any) {
      console.error("Error saving slide:", error);
      toast.error(error.message || "Failed to save slide");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlide = async (slideId: string, imageUrl: string) => {
    if (!confirm("Delete this slide?")) return;
    try {
      const { error } = await anySupabase
        .from("hero_slides")
        .delete()
        .eq("id", slideId);
      
      if (error) throw error;
      
      toast.success("Slide deleted successfully");
      await loadSections();
    } catch (error: any) {
      console.error("Error deleting slide:", error);
      toast.error(error.message || "Failed to delete slide");
    }
  };

  const toggleSlideActive = async (sectionId: string, slide: any) => {
    try {
      const { error } = await (anySupabase
        .from("hero_slides")
        .update({ is_active: !slide.is_active })
        .eq("id", slide.id));
      if (error) throw error;
      await logAuditAction({
        actor_id: user?.id ?? null,
        actor_email: user?.email ?? null,
        action_type: slide.is_active ? "slide_deactivated" : "slide_activated",
        entity: "hero_slides",
        entity_id: slide.id,
        details: { is_active: !slide.is_active },
        user_id: null,
      });
      await loadSections();
      toast.success(`Slide ${slide.is_active ? "deactivated" : "activated"}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/40 rounded-full"></div>
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Homepage Hero Sections
            </h2>
          </div>
          <p className="text-sm text-white/50 ml-3">Manage hero sections and their carousel slides (WebP optimized)</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sections.length === 0 ? (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl space-y-4">
          <div>
            <p className="text-white/70 font-medium mb-2">No hero sections found</p>
            <p className="text-sm text-white/40 mb-4">You need to create the 5 hero sections first. Click the button below to initialize them.</p>
          </div>
          <Button
            onClick={seedHeroSections}
            disabled={seeding}
            className="gap-2 bg-primary text-white hover:bg-primary/80"
          >
            {seeding ? "Creating sections..." : "Create Hero Sections"}
          </Button>
          <p className="text-xs text-white/30 mt-4">
            This will create 5 hero section placeholders where you can add carousel slides.
          </p>
        </div>
      ) : (
        <>
          {sections.map((section) => {
            const sectionSlides = slides[section.id] || [];
            return (
              <Card key={section.id} className="p-6 bg-white/5 border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="font-semibold text-base text-white">{section.label}</div>
                    <div className="text-xs text-white/40">Hero Section {section.section_number}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-white/10 text-white/70 hover:bg-white/15">
                      {sectionSlides.length}/5 Slides
                    </Badge>
                    {sectionSlides.length < 5 && (
                      <Button
                        onClick={() => openNewSlide(section.id)}
                        size="sm"
                        className="gap-1 bg-primary text-white hover:bg-primary/80"
                      >
                        <Plus className="w-3 h-3" /> Add Slide
                      </Button>
                    )}
                  </div>
                </div>

                {sectionSlides.length === 0 ? (
                  <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-white/50 text-sm">No slides added yet</p>
                    <Button
                      onClick={() => openNewSlide(section.id)}
                      variant="ghost"
                      size="sm"
                      className="mt-2 gap-1 text-primary hover:bg-primary/10"
                    >
                      <Plus className="w-3 h-3" /> Add First Slide
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {sectionSlides.map((slide, idx) => (
                      <div
                        key={slide.id}
                        className="bg-white/5 border border-white/10 rounded-xl flex overflow-hidden hover:border-primary/50 transition-all cursor-pointer group"
                      >
                        <div className="relative w-32 sm:w-40 flex-shrink-0">
                          <img src={getOptimizedImageUrl(slide.image_url, {
                            width: 480,
                            height: 228,
                            quality: 70,
                            resize: "contain",
                          })} alt={slide.title} loading="lazy" className="w-full h-24 sm:h-28 object-cover" />
                          <span className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm text-white text-[9px] px-1 py-0.5 font-mono rounded">
                            {slide.image_url.includes(".webp") ? "WebP" : `Slide ${idx + 1}`}
                          </span>
                        </div>
                        <div className="flex-1 p-3 sm:p-4 flex items-center justify-between gap-4 min-w-0">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm text-white truncate">{slide.title}</h3>
                            {slide.subtitle && (
                              <p className="text-xs text-white/50 truncate mt-1">{slide.subtitle}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge
                                variant={slide.is_active ? "default" : "secondary"}
                                className={`text-[10px] ${slide.is_active ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-white/10 text-white/50 border-white/10"}`}
                              >
                                {slide.is_active ? "Active" : "Inactive"}
                              </Badge>
                              {slide.cta_text && (
                                <span className="text-[10px] text-white/40 border border-white/10 px-2 py-0.5 rounded-full">
                                  {slide.cta_text}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => toggleSlideActive(section.id, slide)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                              title={slide.is_active ? "Deactivate" : "Activate"}
                            >
                              {slide.is_active ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => openEditSlide(section.id, slide)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSlide(slide.id, slide.image_url)}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-white/60 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </>
      )}

      {/* Slide Add/Edit Modal */}
      <Dialog open={slideDialogOpen} onOpenChange={setSlideDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[hsl(240,10%,6%)] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">{editingSlide ? "Edit Slide" : "Add New Slide"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-white/70">Slide Image * (WebP format recommended)</Label>
              <label className="mt-1 flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-primary/50 transition-colors cursor-pointer overflow-hidden rounded-lg" style={{ minHeight: 120 }}>
                {preview ? (
                  <img src={getOptimizedImageUrl(preview, {
                    width: 1200,
                    height: 500,
                    quality: 70,
                    resize: "contain",
                  })} alt="preview" loading="lazy" className="w-full h-36 object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 text-white/50">
                    <Upload className="w-6 h-6" />
                    <span className="text-xs">Click to upload image (will be converted to WebP)</span>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />
              </label>
              {imageFile && compressionStats && (
                <div className="mt-3 p-3 bg-emerald-500/20 rounded-lg border border-emerald-500/30 space-y-2">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-emerald-300 space-y-1 flex-1">
                      <p className="font-semibold">✨ WebP Optimized!</p>
                      <p>📦 Size: {formatFileSize(compressionStats.size)} ({compressionStats.compressionRatio}% smaller)</p>
                      <p>📏 Dimensions: {compressionStats.width}×{compressionStats.height}px</p>
                      <p>🎨 Format: WebP (modern browser format)</p>
                      <p className="text-[11px] text-emerald-400 mt-2">
                        Images are automatically converted to WebP format for faster loading and better user experience. ✅
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label className="text-white/70">Title *</Label>
              <Input
                value={slideForm.title}
                onChange={(e) => setSlideForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Slide title"
                className="mt-1 bg-black/30 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div>
              <Label className="text-white/70">Subtitle</Label>
              <Input
                value={slideForm.subtitle}
                onChange={(e) => setSlideForm((f) => ({ ...f, subtitle: e.target.value }))}
                placeholder="Optional tagline"
                className="mt-1 bg-black/30 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/70">Button Text</Label>
                <Input
                  value={slideForm.cta_text}
                  onChange={(e) => setSlideForm((f) => ({ ...f, cta_text: e.target.value }))}
                  placeholder="e.g. Shop Now"
                  className="mt-1 bg-black/30 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div>
                <Label className="text-white/70">Button Link</Label>
                <Input
                  value={slideForm.cta_link}
                  onChange={(e) => setSlideForm((f) => ({ ...f, cta_link: e.target.value }))}
                  placeholder="e.g. /products"
                  className="mt-1 bg-black/30 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={slideForm.is_active}
                onChange={(e) => setSlideForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="w-4 h-4 rounded border-white/20 text-primary focus:ring-primary/50"
              />
              <Label htmlFor="is_active" className="mb-0 text-white/70">Active (visible on website)</Label>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setSlideDialogOpen(false)} className="border-white/20 text-white hover:bg-white/10">
                Cancel
              </Button>
              <Button onClick={saveSlide} disabled={saving || compressing} className="gap-2 bg-primary text-white hover:bg-primary/80">
                {compressing && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {compressing ? "Converting to WebP..." : saving ? "Saving..." : editingSlide ? "Update Slide" : "Create Slide"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}