import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Upload, Eye, EyeOff, X, Loader2, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { compressImage, formatFileSize, getImageDimensions } from "@/lib/imageOptimization";
import type { CompressedImage } from "@/lib/imageOptimization";

export default function AdminSlidesOverview() {
  const { isAdmin, loading: authLoading } = useAuth();
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
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    setLoading(true);
    try {
      // Query hero sections with type bypass for newly created table
      const { data: sectionsData, error } = await (supabase
        .from("hero_sections" as any)
        .select("*")
        .order("section_number") as any);

      if (error) {
        console.error("AdminSlidesOverview - Error loading sections:", error);
        console.log("If you see PGRST errors, you may need to:");
        console.log("1. Run the SQL migrations in Supabase");
        console.log("2. Ensure RLS policies allow public read access");
        console.log("3. Refresh the Supabase schema cache");
        setSections([]);
        setLoading(false);
        return;
      }

      setSections(sectionsData || []);

      // Fetch slides for each section
      if (sectionsData && sectionsData.length > 0) {
        const slidesData: { [key: string]: any[] } = {};
        
        for (const section of sectionsData) {
          const { data: sectionSlides, error: slidesError } = await (supabase
            .from("hero_slides" as any)
            .select("*")
            .eq("section_id", section.id)
            .order("display_order") as any);
          
          if (slidesError) {
            console.error(`Error loading slides for section ${section.id}:`, slidesError);
          }
          
          slidesData[section.id] = sectionSlides || [];
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
        const { error } = await (supabase
          .from("hero_sections" as any)
          .insert([section])
          .select() as any);

        if (error && !error.message.includes("duplicate key")) {
          throw error;
        }
      }

      console.log("Hero sections created successfully");
      await loadSections();
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
      // Compress the image automatically
      const compressed = await compressImage(file, {
        maxWidth: 1400,
        maxHeight: 800,
        quality: 0.8,
        mimeType: "image/webp", // WebP for better compression
      });

      // Create a new File object from the compressed blob
      const compressedFile = new File([compressed.blob], file.name.replace(/\.\w+$/, ".webp"), {
        type: "image/webp",
      });

      setImageFile(compressedFile);
      setCompressionStats(compressed);
      setPreview(URL.createObjectURL(compressed.blob));

      toast.success(
        `✨ Image compressed! ${formatFileSize(file.size)} → ${formatFileSize(compressed.size)} (${compressed.compressionRatio}% smaller)`,
        { duration: 5000 }
      );
    } catch (error) {
      console.error("Error compressing image:", error);
      toast.error("Failed to compress image. Using original.");
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    } finally {
      setCompressing(false);
    }
  };

  const handleSaveSlide = async () => {
    if (!slideForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      let imageUrl = editingSlide?.image_url || "";
      if (imageFile) {
        // Upload compressed image
        const path = `slides/${Date.now()}_${imageFile.name}`;
        const { error } = await supabase.storage.from("product-images").upload(path, imageFile);
        if (error) throw error;
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        imageUrl = data.publicUrl;
        
        // Log compression stats
        if (compressionStats) {
          console.log("✅ Image uploaded successfully", {
            originalSize: compressionStats.size,
            width: compressionStats.width,
            height: compressionStats.height,
            format: compressionStats.mimeType,
            compressionRatio: compressionStats.compressionRatio,
          });
        }
      }
      if (!imageUrl) {
        toast.error("Please upload an image");
        setSaving(false);
        return;
      }

      const payload = {
        title: slideForm.title,
        subtitle: slideForm.subtitle || null,
        image_url: imageUrl,
        cta_text: slideForm.cta_text || null,
        cta_link: slideForm.cta_link || null,
        is_active: slideForm.is_active,
        section_id: selectedSectionId,
        display_order: editingSlide?.display_order || (slides[selectedSectionId]?.length || 0),
      };

      if (editingSlide) {
        const { error } = await (supabase
          .from("hero_slides" as any)
          .update(payload)
          .eq("id", editingSlide.id) as any);
        if (error) throw error;
        toast.success("Slide updated!");
      } else {
        const { error } = await (supabase
          .from("hero_slides" as any)
          .insert([payload]) as any);
        if (error) throw error;
        toast.success("Slide created!");
      }
      setSlideDialogOpen(false);
      await loadSections();
    } catch (err: any) {
      console.error("Error saving slide:", err);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteSlide = async (slideId: string) => {
    if (!confirm("Delete this slide?")) return;
    try {
      await (supabase.from("hero_slides" as any).delete().eq("id", slideId) as any);
      toast.success("Slide deleted!");
      await loadSections();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleSlideActive = async (sectionId: string, slide: any) => {
    try {
      await (supabase
        .from("hero_slides" as any)
        .update({ is_active: !slide.is_active })
        .eq("id", slide.id) as any);
      await loadSections();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Homepage Hero Sections</h2>
          <p className="text-sm text-muted-foreground">Manage hero sections and their carousel slides</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sections.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg space-y-4">
          <div>
            <p className="text-muted-foreground font-medium mb-2">No hero sections found</p>
            <p className="text-sm text-muted-foreground mb-4">You need to create the 5 hero sections first. Click the button below to initialize them.</p>
          </div>
          <Button
            onClick={seedHeroSections}
            disabled={seeding}
            className="gap-2"
          >
            {seeding ? "Creating sections..." : "Create Hero Sections"}
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            This will create 5 hero section placeholders where you can add carousel slides.
          </p>
        </div>
      ) : (
        <>
          {sections.map((section) => {
            const sectionSlides = slides[section.id] || [];
            return (
              <Card key={section.id} className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="font-semibold text-base">{section.label}</div>
                    <div className="text-xs text-muted-foreground">Hero Section {section.section_number}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{sectionSlides.length}/5 Slides</Badge>
                    {sectionSlides.length < 5 && (
                      <Button
                        onClick={() => openNewSlide(section.id)}
                        size="sm"
                        className="gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Slide
                      </Button>
                    )}
                  </div>
                </div>

                {sectionSlides.length === 0 ? (
                  <div className="text-center py-8 bg-secondary/20 rounded border border-border">
                    <p className="text-muted-foreground text-sm">No slides added yet</p>
                    <Button
                      onClick={() => openNewSlide(section.id)}
                      variant="ghost"
                      size="sm"
                      className="mt-2 gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add First Slide
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {sectionSlides.map((slide, idx) => (
                      <div
                        key={slide.id}
                        className="bg-white border border-border flex overflow-hidden hover:border-primary transition-colors"
                      >
                        <div className="relative w-32 sm:w-40 flex-shrink-0">
                          <img src={slide.image_url} alt={slide.title} className="w-full h-24 sm:h-28 object-cover" />
                          <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1 py-0.5 font-mono rounded">
                            Slide {idx + 1}
                          </span>
                        </div>
                        <div className="flex-1 p-3 sm:p-4 flex items-center justify-between gap-4 min-w-0">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">{slide.title}</h3>
                            {slide.subtitle && (
                              <p className="text-xs text-muted-foreground truncate mt-1">{slide.subtitle}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge
                                variant={slide.is_active ? "default" : "secondary"}
                                className="text-[10px]"
                              >
                                {slide.is_active ? "Active" : "Inactive"}
                              </Badge>
                              {slide.cta_text && (
                                <span className="text-[10px] text-muted-foreground border border-border px-2 py-0.5 rounded">
                                  {slide.cta_text}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => toggleSlideActive(section.id, slide)}
                              className="p-1.5 hover:bg-secondary border border-transparent hover:border-border transition-colors rounded"
                              title={slide.is_active ? "Deactivate" : "Activate"}
                            >
                              {slide.is_active ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                            <button
                              onClick={() => openEditSlide(section.id, slide)}
                              className="p-1.5 hover:bg-secondary border border-transparent hover:border-border transition-colors rounded"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteSlide(slide.id)}
                              className="p-1.5 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 transition-colors rounded"
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSlide ? "Edit Slide" : "Add New Slide"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
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
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />
              </label>
              {imageFile && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-900 space-y-1 flex-1">
                      <p className="font-semibold">✨ Image Optimized</p>
                      {compressionStats && (
                        <>
                          <p>📦 Size: {formatFileSize(compressionStats.size)} ({compressionStats.compressionRatio}% smaller)</p>
                          <p>📏 Dimensions: {compressionStats.width}×{compressionStats.height}px</p>
                          <p>🎨 Format: {compressionStats.mimeType === "image/webp" ? "WebP" : "Original"} (modern & efficient)</p>
                        </>
                      )}
                      <p className="text-[11px] text-blue-700 mt-2">
                        Images are automatically compressed for faster loading and better performance. ✅
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label>Title *</Label>
              <Input
                value={slideForm.title}
                onChange={(e) => setSlideForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Slide title"
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input
                value={slideForm.subtitle}
                onChange={(e) => setSlideForm((f) => ({ ...f, subtitle: e.target.value }))}
                placeholder="Optional tagline"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Button Text</Label>
                <Input
                  value={slideForm.cta_text}
                  onChange={(e) => setSlideForm((f) => ({ ...f, cta_text: e.target.value }))}
                  placeholder="e.g. Shop Now"
                />
              </div>
              <div>
                <Label>Button Link</Label>
                <Input
                  value={slideForm.cta_link}
                  onChange={(e) => setSlideForm((f) => ({ ...f, cta_link: e.target.value }))}
                  placeholder="e.g. /products"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={slideForm.is_active}
                onChange={(e) => setSlideForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="is_active" className="mb-0">Active (visible on website)</Label>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setSlideDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSlide} disabled={saving || compressing} className="gap-2">
                {compressing && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {compressing ? "Compressing..." : saving ? "Uploading..." : editingSlide ? "Update Slide" : "Create Slide"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
