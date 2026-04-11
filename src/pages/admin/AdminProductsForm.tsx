import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { queryOptionalTable, mutateOptionalTable } from "@/lib/supabaseHelpers";
import { API_URL } from "@/lib/constants";
import { logAuditAction } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Upload, Loader2, Search, Star, TrendingUp, X, ArrowLeft, ChevronDown, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { getOptimizedImageUrl } from "@/lib/imageOptimization";

const colorOptions = ["Black", "White", "Blue", "Red", "Green", "Gold", "Silver", "Pink", "Purple", "Gray", "Orange", "Yellow"];

// Parser function to extract specifications from plain text
const parseSpecificationsFromText = (text: string): Array<{ key: string; value: string }> => {
  if (!text.trim()) return [];
  
  const lines = text.split("\n").map(line => line.trim()).filter(line => line);
  const specs: Array<{ key: string; value: string }> = [];
  
  // Common section headers to skip
  const skipHeaders = new Set([
    "finish", "capacity", "size and weight", "display", "splash water and dust resistant",
    "chip", "camera", "video recording", "truedepth camera", "face id", "apple pay",
    "cellular and wireless", "location", "video calling", "audio calling", "audio playback",
    "video playback", "siri", "external buttons and connectors", "power and battery",
    "magsafe", "sensors", "operating system", "accessibility", "built-in apps",
    "free apps from apple", "support", "sim card", "rating for hearing aids",
    "mail attachment support", "system requirements", "environmental requirements"
  ]);
  
  let lastKey = "";
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines
    if (!line) continue;
    
    // Check if this looks like a section header (single word or 2-3 words, no separators)
    const isHeader = skipHeaders.has(line.toLowerCase());
    if (isHeader) {
      lastKey = line;
      continue;
    }
    
    let key = "";
    let value = "";
    let hasValue = false;
    
    // Try colon separator: "Key: Value"
    if (line.includes(":")) {
      const colonIdx = line.indexOf(":");
      key = line.substring(0, colonIdx).trim();
      value = line.substring(colonIdx + 1).trim();
      hasValue = true;
    }
    // Try dash separator: "Key - Value"
    else if (line.includes(" - ")) {
      const idx = line.indexOf(" - ");
      key = line.substring(0, idx).trim();
      value = line.substring(idx + 3).trim();
      hasValue = true;
    }
    // Try pipe separator: "Key | Value"
    else if (line.includes("|")) {
      const idx = line.indexOf("|");
      key = line.substring(0, idx).trim();
      value = line.substring(idx + 1).trim();
      hasValue = true;
    }
    
    // If we found a colon-separated spec
    if (hasValue && key) {
      specs.push({ key, value });
    }
    // If this looks like a single value/feature (no separators)
    else if (!hasValue && line && line.length < 100) {
      // Look ahead to see if there are more similar single-value items
      const groupedItems = [line];
      let j = i + 1;
      
      while (j < lines.length && groupedItems.length < 5) {
        const nextLine = lines[j];
        // Check if next line is also likely a value in the same group (short, no colons)
        if (nextLine && !nextLine.includes(":") && nextLine.length < 50 && 
            !skipHeaders.has(nextLine.toLowerCase())) {
          groupedItems.push(nextLine);
          j++;
        } else {
          break;
        }
      }
      
      // If we found a group of related items, use last header or group them
      if (groupedItems.length > 1 && lastKey) {
        specs.push({ key: lastKey, value: groupedItems.join(", ") });
        i = j - 1; // Skip the items we processed
      } else if (groupedItems.length === 1) {
        // Single item - still add it
        specs.push({ key: groupedItems[0], value: "" });
      } else if (groupedItems.length > 1) {
        // Multiple items without a clear header - ask user to organize
        specs.push({ key: groupedItems[0], value: groupedItems.slice(1).join(", ") });
        i = j - 1;
      }
    }
  }
  
  return specs;
};

const specTemplates = [
  { key: "Brand", value: "" },
  { key: "Model", value: "" },
  { key: "Storage Capacity", value: "" },
  { key: "RAM", value: "" },
  { key: "Screen Size", value: "" },
  { key: "Processor", value: "" },
  { key: "Operating System", value: "" },
  { key: "Camera Resolution", value: "" },
  { key: "Battery Capacity", value: "" },
  { key: "Network", value: "" },
  { key: "Condition", value: "" },
  { key: "Connectivity", value: "" },
  { key: "Features", value: "" },
  { key: "Warranty", value: "" },
];

const AdminProductFormPage = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ 
    name: "", description: "", price: "", original_price: "", category: "", brand: "", 
    stock_status: "in_stock", stock_quantity: 0, is_featured: false, is_trending: false 
  });
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [specifications, setSpecifications] = useState<Array<{ key: string; value: string }>>([]);
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  const [showSpecTemplate, setShowSpecTemplate] = useState(false);
  const [showPasteMode, setShowPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [parsedSpecs, setParsedSpecs] = useState<Array<{ key: string; value: string }>>([]);
  const [processingImages, setProcessingImages] = useState(false);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    const load = async () => {
      const { data: cats } = await supabase
        .from("categories")
        .select("name")
        .eq("is_active", true)
        .order("display_order");
      setCategories(cats || []);

      if (id) {
        const { data: product } = await supabase
          .from("products")
          .select("*, product_images(*)")
          .eq("id", id)
          .single();

        if (product) {
          setEditing(product);
          setForm({
            name: product.name,
            description: product.description || "",
            price: String(product.price),
            original_price: product.original_price ? String(product.original_price) : "",
            category: product.category,
            brand: product.brand,
            stock_status: product.stock_status,
            stock_quantity: product.stock_quantity || 0,
            is_featured: product.is_featured,
            is_trending: product.is_trending,
          });
          setExistingImages(product.product_images || []);
          
          // Load existing colors and specifications (silently handles 404s for pending migrations)
          const [colorsData, specsData] = await Promise.all([
            queryOptionalTable<any>("product_colors", "color", [{ column: "product_id", value: id }], { column: "display_order", asc: true }),
            queryOptionalTable<any>("product_specifications", "spec_key, spec_value", [{ column: "product_id", value: id }], { column: "display_order", asc: true })
          ]);
          
          if (colorsData.length > 0) {
            setSelectedColors(colorsData.map((c: any) => c.color));
          }
          
          if (specsData.length > 0) {
            setSpecifications(specsData.map((s: any) => ({ key: s.spec_key, value: s.spec_value })));
          }
        }
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category || !form.brand) { 
      toast.error("Fill in required fields"); 
      return; 
    }

    setSaving(true);
    try {
      const payload = { 
        name: form.name, 
        description: form.description || null, 
        price: Number(form.price), 
        original_price: form.original_price ? Number(form.original_price) : null, 
        category: form.category, 
        brand: form.brand, 
        stock_status: form.stock_status,
        stock_quantity: Number(form.stock_quantity) || 0, 
        is_featured: form.is_featured, 
        is_trending: form.is_trending 
      };

      let productId = editing?.id;

      if (editing) {
        const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
        if (error) { toast.error(error.message); return; }
        await logAuditAction({
          actor_id: user?.id ?? null,
          actor_email: user?.email ?? null,
          action_type: "product_updated",
          entity: "products",
          entity_id: editing.id,
          details: { name: payload.name, category: payload.category, price: payload.price, stock_status: payload.stock_status },
          user_id: null,
        });
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select();
        if (error) { toast.error(error.message); return; }
        productId = data?.[0]?.id;
        await logAuditAction({
          actor_id: user?.id ?? null,
          actor_email: user?.email ?? null,
          action_type: "product_created",
          entity: "products",
          entity_id: productId ?? null,
          details: { name: payload.name, category: payload.category, price: payload.price, stock_status: payload.stock_status },
          user_id: null,
        });
      }

      // Upload images if any selected
      if (selectedFiles.length > 0 && productId) {
        await handleImageUploadFromForm(productId, selectedFiles);
      }

      // Save colors
      if (productId && selectedColors.length > 0) {
        try {
          // Delete existing colors if editing
          if (editing) {
            await (supabase.from("product_colors" as any).delete().eq("product_id", productId) as any);
          }
          
          // Insert new colors with display order
          const colorsToInsert = selectedColors.map((color, idx) => ({
            product_id: productId,
            color: color,
            display_order: idx,
            status: "available"
          }));
          
          const { error: colorError } = await (supabase.from("product_colors" as any).insert(colorsToInsert) as any);
          if (colorError) {
            console.warn("Colors table not available (migration pending):", colorError.message);
          }
        } catch (err) {
          console.warn("Colors table operation failed:", err);
        }
      }

      // Save specifications
      if (productId && specifications.length > 0) {
        try {
          // Delete existing specs if editing
          if (editing) {
            await (supabase.from("product_specifications" as any).delete().eq("product_id", productId) as any);
          }
          
          // Insert new specs with display order
          const specsToInsert = specifications.map((spec, idx) => ({
            product_id: productId,
            spec_key: spec.key,
            spec_value: spec.value,
            display_order: idx
          }));
          
          const { error: specError } = await (supabase.from("product_specifications" as any).insert(specsToInsert) as any);
          if (specError) {
            console.warn("Specifications table not available (migration pending):", specError.message);
          }
        } catch (err) {
          console.warn("Specifications table operation failed:", err);
        }
      }

      toast.success(editing ? "Product updated!" : "Product created!");
      navigate("/admin/products");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUploadFromForm = async (productId: string, files: File[]) => {
    if (existingImages.length + files.length > 10) { 
      toast.error("Max 10 images per product"); 
      return; 
    }

    setProcessingImages(true);
    let processedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop();
      const path = `${productId}/${Date.now()}_${i}.${ext}`;
      const processedFile = file;

      toast.loading(`Uploading image ${i + 1}/${files.length}...`, {
        id: `processing-${i}`,
        duration: 10000,
      });

      try {
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, processedFile);
        if (uploadError) { 
          toast.error(`Failed to upload image ${i + 1}: ${uploadError.message}`); 
          continue; 
        }

        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
        await supabase.from("product_images").insert({
          product_id: productId,
          image_url: urlData.publicUrl,
          display_order: existingImages.length + i,
          is_primary: existingImages.length === 0 && i === 0,
        });
        
        processedCount++;
      } catch (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error(`Failed to save image ${i + 1}`);
      }
    }

    setProcessingImages(false);
    
    // Final summary toast
    if (processedCount > 0) {
      if (failedCount === 0) {
        toast.success(`🎉 All ${processedCount} images uploaded successfully!`);
      } else {
        toast.success(`✅ ${processedCount} images uploaded. ${failedCount} failed to upload.`);
      }
    } else {
      toast.error("No images were uploaded successfully");
    }
  };

  const handleFormImageSelect = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);

    if (selectedFiles.length + fileArray.length > 10) {
      toast.error("Max 10 images per product");
      return;
    }

    const newPreviews = fileArray.map(file => URL.createObjectURL(file));
    setSelectedFiles([...selectedFiles, ...fileArray]);
    setFilePreviews([...filePreviews, ...newPreviews]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setFilePreviews(filePreviews.filter((_, i) => i !== index));
  };

  const deleteExistingImage = async (imgId: string) => {
    if (!confirm("Delete this image?")) return;
    
    try {
      // Find the image to get its storage path
      const imageToDelete = existingImages.find((img) => img.id === imgId);
      
      if (imageToDelete?.image_url) {
        // Extract the storage path from the image URL
        // URL format: https://{storage-url}/object/public/product-images/{product_id}/{filename}
        const urlParts = imageToDelete.image_url.split("/product-images/");
        if (urlParts.length === 2) {
          const storagePath = `${urlParts[1]}`; // e.g., "product_id/timestamp_0.png"
          
          // Delete from storage
          const { error: storageError } = await supabase.storage
            .from("product-images")
            .remove([storagePath]);
          
          if (storageError && !storageError.message.includes("not found")) {
            toast.error("Failed to delete image from storage");
            return;
          }
        }
      }
      
      // Delete from database
      const { error: dbError } = await supabase
        .from("product_images")
        .delete()
        .eq("id", imgId);
      
      if (dbError) {
        toast.error("Failed to delete image from database");
        return;
      }
      
      setExistingImages(existingImages.filter((img) => img.id !== imgId));
      toast.success("Image deleted successfully");
    } catch (err) {
      console.error("Error deleting image:", err);
      toast.error("Error deleting image");
    }
  };

  const setPrimary = async (imgId: string) => {
    const allImages = [...existingImages];
    const promises = allImages.map((img: any) =>
      supabase.from("product_images").update({ is_primary: img.id === imgId }).eq("id", img.id)
    );
    await Promise.all(promises);
    setExistingImages(allImages.map((img) => ({ ...img, is_primary: img.id === imgId })));
  };

  const addSpecification = (key?: string) => {
    const specKey = key || newSpecKey;
    const specValue = key ? "" : newSpecValue;
    
    if (!specKey.trim()) {
      toast.error("Specification name cannot be empty");
      return;
    }
    
    // Check if spec already exists
    if (specifications.some(s => s.key.toLowerCase() === specKey.toLowerCase())) {
      toast.error(`${specKey} already added`);
      return;
    }
    
    setSpecifications([...specifications, { key: specKey, value: specValue }]);
    setNewSpecKey("");
    setNewSpecValue("");
    setShowSpecTemplate(false);
  };

  const removeSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  const updateSpecification = (index: number, key: string, value: string) => {
    const updated = [...specifications];
    updated[index] = { key, value };
    setSpecifications(updated);
  };

  const handleParsePaste = () => {
    if (!pastedText.trim()) {
      toast.error("Please paste some text first");
      return;
    }

    const parsed = parseSpecificationsFromText(pastedText);
    if (parsed.length === 0) {
      toast.error("Could not parse any specifications from the text");
      return;
    }

    setParsedSpecs(parsed);
    toast.success(`Parsed ${parsed.length} specifications`);
  };

  const addParsedSpecs = () => {
    const existingKeys = specifications.map(s => s.key.toLowerCase());
    let addedCount = 0;

    for (const spec of parsedSpecs) {
      if (!existingKeys.includes(spec.key.toLowerCase())) {
        setSpecifications(prev => [...prev, spec]);
        existingKeys.push(spec.key.toLowerCase());
        addedCount++;
      }
    }

    if (addedCount > 0) {
      toast.success(`Added ${addedCount} specifications`);
      setPastedText("");
      setParsedSpecs([]);
      setShowPasteMode(false);
    } else {
      toast.error("All specifications already exist");
    }
  };

  const removeParsedSpec = (index: number) => {
    setParsedSpecs(parsedSpecs.filter((_, i) => i !== index));
  };

  const updateParsedSpec = (index: number, key: string, value: string) => {
    const updated = [...parsedSpecs];
    updated[index] = { key, value };
    setParsedSpecs(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[content] py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container py-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/admin/products")}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{editing ? "Edit Product" : "New Product"}</h1>
            <p className="text-sm text-muted-foreground">Fill in the details below</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl space-y-6 mx-auto w-full"
        >
          {/* Basic Info */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Basic Information</h2>

            <div>
              <Label>Product Name *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Enter product name"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Description</Label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Enter product description"
                className="w-full mt-2 p-3 border border-input text-sm h-24 resize-none bg-background outline-none focus:ring-1 focus:ring-ring rounded-lg"
              />
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Pricing & Inventory</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Current Price (KSh) *</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Original Price (for discount)</Label>
                <Input
                  type="number"
                  value={form.original_price}
                  onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))}
                  placeholder="0"
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stock Status</Label>
                <select
                  value={form.stock_status}
                  onChange={e => setForm(f => ({ ...f, stock_status: e.target.value }))}
                  className="w-full mt-2 p-2 border border-input bg-background text-sm outline-none focus:ring-1 focus:ring-ring rounded-lg"
                >
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
              <div>
                <Label>Stock Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.stock_quantity}
                  onChange={e => setForm(f => ({ ...f, stock_quantity: parseInt(e.target.value) || 0 }))}
                  placeholder="50"
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Category & Brand */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Category & Brand</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full mt-2 p-2 border border-input bg-background text-sm outline-none focus:ring-1 focus:ring-ring rounded-lg"
                >
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Brand *</Label>
                <Input
                  value={form.brand}
                  onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                  placeholder="Enter brand"
                  className="mt-2"
                />
              </div>
            </div>

            {/* Available Colors */}
            <div>
              <Label>Available Colors</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
                {colorOptions.map(color => (
                  <label key={color} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-secondary rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedColors.includes(color)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedColors([...selectedColors, color]);
                        } else {
                          setSelectedColors(selectedColors.filter(c => c !== color));
                        }
                      }}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium">{color}</span>
                  </label>
                ))}
              </div>
              {selectedColors.length > 0 && (
                <div className="mt-3 p-3 bg-secondary rounded-lg">
                  <p className="text-sm font-medium mb-2">Selected: {selectedColors.join(", ")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Flags */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Product Flags</h2>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                  className="w-4 h-4"
                />
                <Star className="w-3.5 h-3.5 text-yellow-500" /> Featured
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                <input
                  type="checkbox"
                  checked={form.is_trending}
                  onChange={e => setForm(f => ({ ...f, is_trending: e.target.checked }))}
                  className="w-4 h-4"
                />
                <TrendingUp className="w-3.5 h-3.5 text-primary" /> Trending
              </label>
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Product Specifications</h2>

            {/* Add from Template */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowSpecTemplate(!showSpecTemplate)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add from Template
                <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showSpecTemplate ? "rotate-180" : ""}`} />
              </Button>

              {showSpecTemplate && (
                <div className="bg-secondary p-3 rounded-lg max-h-48 overflow-y-auto grid grid-cols-2 gap-2">
                  {specTemplates.map((template) => (
                    <button
                      key={template.key}
                      type="button"
                      onClick={() => addSpecification(template.key)}
                      className="text-left text-sm p-2 rounded hover:bg-primary/10 transition-colors"
                    >
                      {template.key}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Paste & Auto-Parse Mode */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowPasteMode(!showPasteMode)}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Paste & Auto-Parse
                <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showPasteMode ? "rotate-180" : ""}`} />
              </Button>

              {showPasteMode && (
                <div className="bg-secondary p-4 rounded-lg space-y-3">
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-2">Supported formats:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Key: Value</li>
                      <li>Key - Value</li>
                      <li>Key | Value</li>
                      <li>Features on separate lines (without values)</li>
                    </ul>
                  </div>
                  
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste specifications here. Examples:&#10;Storage: 256GB&#10;RAM: 8GB&#10;Processor - Snapdragon 888&#10;Features&#10;5G Connectivity&#10;Wireless Charging"
                    className="w-full p-3 border border-input text-sm h-32 resize-none bg-background outline-none focus:ring-1 focus:ring-ring rounded-lg"
                  />

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleParsePaste}
                      className="flex-1"
                      disabled={!pastedText.trim()}
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Parse Text
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasteMode(false);
                        setPastedText("");
                        setParsedSpecs([]);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>

                  {/* Parsed Specs Preview */}
                  {parsedSpecs.length > 0 && (
                    <div className="border-t pt-3 space-y-2">
                      <p className="text-sm font-medium">Parsed Specifications - Edit if needed:</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {parsedSpecs.map((spec, idx) => (
                          <div key={idx} className="flex gap-2">
                            <Input
                              value={spec.key}
                              onChange={(e) => updateParsedSpec(idx, e.target.value, spec.value)}
                              placeholder="Specification name"
                              className="font-medium text-xs"
                              size={32}
                            />
                            <Input
                              value={spec.value}
                              onChange={(e) => updateParsedSpec(idx, spec.key, e.target.value)}
                              placeholder="Value (optional)"
                              className="flex-1 text-xs"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeParsedSpec(idx)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        onClick={addParsedSpecs}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Parsed Specifications
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Existing Specifications */}
            {specifications.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground">Added Specifications</p>
                {specifications.map((spec, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={spec.key}
                      onChange={(e) => updateSpecification(idx, e.target.value, spec.value)}
                      placeholder="Specification name"
                      className="font-medium"
                    />
                    <Input
                      value={spec.value}
                      onChange={(e) => updateSpecification(idx, spec.key, e.target.value)}
                      placeholder="Specification value"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeSpecification(idx)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Custom Specification */}
            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Add Custom Specification</p>
              <div className="flex gap-2">
                <Input
                  value={newSpecKey}
                  onChange={(e) => setNewSpecKey(e.target.value)}
                  placeholder="e.g., Interface"
                  className="font-medium"
                  onKeyPress={(e) => e.key === "Enter" && addSpecification()}
                />
                <Input
                  value={newSpecValue}
                  onChange={(e) => setNewSpecValue(e.target.value)}
                  placeholder="e.g., USB 3.0"
                  className="flex-1"
                  onKeyPress={(e) => e.key === "Enter" && addSpecification()}
                />
                <Button
                  type="button"
                  onClick={() => addSpecification()}
                  disabled={!newSpecKey.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Product Images (Max 10)</h2>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Current Images</p>
                <div className="grid grid-cols-4 gap-3">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={getOptimizedImageUrl(img.image_url, {
                          width: 400,
                          height: 400,
                          quality: 70,
                          resize: "contain",
                        })}
                        alt=""
                        className={`w-full aspect-square object-cover rounded-lg border-2 cursor-pointer transition-all ${
                          img.is_primary ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary"
                        }`}
                        onClick={() => setPrimary(img.id)}
                      />
                      {img.is_primary && (
                        <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                          Primary
                        </span>
                      )}
                      <button
                        onClick={() => deleteExistingImage(img.id)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload new images */}
            {existingImages.length < 10 && (
              <>
                <label className="flex items-center justify-center gap-2 w-full p-6 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-secondary/50 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to select new images</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={e => handleFormImageSelect(e.target.files)}
                  />
                </label>

                {/* New Image Previews */}
                {filePreviews.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {filePreviews.length} new image{filePreviews.length !== 1 ? "s" : ""} added
                    </p>
                    <div className="grid grid-cols-4 gap-3">
                      {filePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={getOptimizedImageUrl(preview, {
                              width: 400,
                              height: 400,
                              quality: 70,
                              resize: "contain",
                            })}
                            alt={`preview ${index}`}
                            className="w-full aspect-square object-cover rounded-lg border border-border"
                          />
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(index)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 sticky bottom-0 bg-background py-4 border-t border-border">
            <Button
              onClick={() => navigate("/admin/products")}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || processingImages}
              className="flex-1"
            >
              {(saving || processingImages) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {processingImages ? "Processing Images..." : saving ? "Saving..." : editing ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminProductFormPage;
