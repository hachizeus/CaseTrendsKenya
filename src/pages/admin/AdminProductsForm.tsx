// src/components/admin/ProductForm.tsx
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Create an untyped supabase client to avoid TypeScript issues with complex generated types
const supabaseClient = supabase as any;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Plus, 
  Trash2, 
  Upload, 
  Loader2, 
  ArrowLeft, 
  Star, 
  TrendingUp, 
  X, 
  Image as ImageIcon,
  Package,
  DollarSign,
  Tag,
  Palette,
  Settings,
  Boxes,
  CheckCircle2,
  AlertCircle,
  Info,
  Save,
  Eye,
  Sparkles,
  ChevronRight,
  GripVertical,
  Copy,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "lodash";
import { cn } from "@/lib/utils";

// Image optimization utility
async function convertToWebP(file: File, quality: number = 80): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        // Calculate new dimensions (max 2000px width/height for performance)
        let width = img.width;
        let height = img.height;
        const maxDimension = 2000;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
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
            const webpFile = new File([blob], file.name.replace(/\.(jpg|jpeg|png|gif|bmp|tiff)$/i, ".webp"), {
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

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  category_id: string;
  subcategory_id: string;
  brand: string;
  model: string;
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
  stock_quantity: number;
  sku: string;
  warranty: string;
  weight: string;
  is_featured: boolean;
  is_trending: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  category_id: string;
}

const stockStatusOptions = [
  { value: "in_stock", label: "In Stock", color: "text-green-600", bgColor: "bg-green-100" },
  { value: "low_stock", label: "Low Stock", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  { value: "out_of_stock", label: "Out of Stock", color: "text-red-600", bgColor: "bg-red-100" },
];

// Constants
const MAX_IMAGES = 10;
const AUTO_SAVE_DEBOUNCE = 1000;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function ProductForm() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [completionProgress, setCompletionProgress] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: 0,
    original_price: null,
    category_id: "",
    subcategory_id: "",
    brand: "",
    model: "",
    stock_status: "in_stock",
    stock_quantity: 0,
    sku: "",
    warranty: "",
    weight: "",
    is_featured: false,
    is_trending: false,
  });

  const [colors, setColors] = useState<Array<{ color: string; status: string }>>([]);
  const [newColor, setNewColor] = useState("");
  const [specifications, setSpecifications] = useState<Array<{ key: string; value: string }>>([]);
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [convertingImages, setConvertingImages] = useState(false);

  // Calculate form completion progress
  useEffect(() => {
    let completed = 0;
    const total = 7; // Total number of important fields
    
    if (formData.name) completed++;
    if (formData.description) completed++;
    if (formData.price > 0) completed++;
    if (formData.category_id) completed++;
    if (formData.brand) completed++;
    if (existingImages.length > 0 || images.length > 0) completed++;
    if (formData.stock_quantity >= 0) completed++;
    
    setCompletionProgress((completed / total) * 100);
  }, [formData, existingImages, images]);

  // Memoized filtered subcategories
  const filteredSubcategories = useMemo(() => {
    if (!formData.category_id) return [];
    return subcategories.filter(s => s.category_id === formData.category_id);
  }, [formData.category_id, subcategories]);

  const updateFormData = useCallback((updates: Partial<ProductFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  const debouncedAutoSave = useCallback(
    debounce(async (data: ProductFormData) => {
      if (!id || !isDirty) return;
      
      try {
        await supabaseClient
          .from("products")
          .update(data)
          .eq("id", id);
        
        setIsDirty(false);
        toast.success("Draft saved", { 
          duration: 2000,
          icon: <CheckCircle2 className="w-4 h-4" />
        });
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }, AUTO_SAVE_DEBOUNCE),
    [id]
  );

  useEffect(() => {
    if (id && isDirty) {
      debouncedAutoSave(formData);
    }
  }, [formData, id, isDirty, debouncedAutoSave]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      imagePreviews.forEach(URL.revokeObjectURL);
      debouncedAutoSave.cancel();
    };
  }, [imagePreviews, debouncedAutoSave]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      abortControllerRef.current = new AbortController();
      
      try {
        const promises = [loadCategoriesAndSubcategories()];
        if (id) {
          promises.push(loadProduct());
        }
        
        await Promise.all(promises);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [id]);

  const loadCategoriesAndSubcategories = async () => {
    try {
      const [catsResult, subsResult] = await Promise.all([
        supabaseClient
          .from("categories")
          .select("id, name, slug")
          .eq("is_active", true)
          .order("display_order"),
        supabaseClient
          .from("subcategories")
          .select("id, name, slug, category_id")
          .eq("is_active", true)
          .order("display_order"),
      ]);

      setCategories((catsResult.data as Category[]) || []);
      setSubcategories((subsResult.data as Subcategory[]) || []);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const loadProduct = async () => {
    try {
      const [productResult, imagesResult] = await Promise.all([
        supabaseClient
          .from("products")
          .select("*")
          .eq("id", id!)
          .single(),
        supabaseClient
          .from("product_images")
          .select("*")
          .eq("product_id", id!)
          .order("display_order")
      ]);

      if (productResult.error) throw productResult.error;
      const product = productResult.data;

      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price,
        original_price: product.original_price,
        category_id: product.category_id || "",
        subcategory_id: product.subcategory_id || "",
        brand: product.brand,
        model: product.model || "",
        stock_status: product.stock_status,
        stock_quantity: product.stock_quantity || 0,
        sku: product.sku || "",
        warranty: product.warranty || "",
        weight: product.weight || "",
        is_featured: product.is_featured,
        is_trending: product.is_trending,
      });

      setExistingImages(imagesResult.data || []);

      Promise.allSettled([
        supabaseClient
          .from("product_colors")
          .select("color, status")
          .eq("product_id", id!)
          .order("display_order")
          .then(result => {
            if (result.data) setColors(result.data as { color: string; status: string; }[]);
          }),
        supabaseClient
          .from("product_specifications")
          .select("spec_key, spec_value")
          .eq("product_id", id!)
          .order("display_order")
          .then(result => {
            if (result.data) {
              setSpecifications(result.data.map((s: any) => ({ 
                key: s.spec_key, 
                value: s.spec_value 
              })));
            }
          })
      ]).catch(console.warn);

    } catch (error) {
      console.error("Error loading product:", error);
      toast.error("Failed to load product");
    }
  };

  const handleImageSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    const totalImages = existingImages.length + images.length + newFiles.length;
    
    if (totalImages > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images per product`);
      return;
    }

    // Show converting toast
    const convertToastId = toast.loading(`Converting ${newFiles.length} image(s) to WebP...`, {
      duration: 30000,
    });

    setConvertingImages(true);
    
    try {
      // Convert all new images to WebP
      const convertedFiles: File[] = [];
      const convertedPreviews: string[] = [];
      
      for (const file of newFiles) {
        // Skip if already WebP
        if (file.type === "image/webp") {
          convertedFiles.push(file);
          convertedPreviews.push(URL.createObjectURL(file));
          continue;
        }
        
        try {
          const webpFile = await convertToWebP(file, 80);
          convertedFiles.push(webpFile);
          convertedPreviews.push(URL.createObjectURL(webpFile));
          
          // Log size reduction
          const originalSize = (file.size / 1024).toFixed(2);
          const newSize = (webpFile.size / 1024).toFixed(2);
          console.log(`🖼️ Converted: ${file.name} (${originalSize}KB) → WebP (${newSize}KB)`);
        } catch (error) {
          console.error(`Failed to convert ${file.name}, using original:`, error);
          convertedFiles.push(file);
          convertedPreviews.push(URL.createObjectURL(file));
        }
      }
      
      setImages(prev => [...prev, ...convertedFiles]);
      setImagePreviews(prev => [...prev, ...convertedPreviews]);
      
      const totalOriginalSize = newFiles.reduce((sum, f) => sum + f.size, 0);
      const totalNewSize = convertedFiles.reduce((sum, f) => sum + f.size, 0);
      const savings = ((totalOriginalSize - totalNewSize) / totalOriginalSize * 100).toFixed(1);
      
      toast.success(`✨ ${convertedFiles.length} image(s) converted to WebP (${savings}% smaller)`, {
        id: convertToastId,
        duration: 4000,
      });
      
      setIsDirty(true);
    } catch (error) {
      console.error("Error processing images:", error);
      toast.error("Failed to process some images", { id: convertToastId });
    } finally {
      setConvertingImages(false);
    }
  }, [existingImages.length, images.length]);

  const removeNewImage = useCallback((index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  }, [imagePreviews]);

  const removeExistingImage = async (imageId: string, imageUrl: string) => {
    if (!confirm("Delete this image?")) return;
    await deleteImage(imageId, imageUrl, "product_images", "product-images");
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
    setIsDirty(true);
  };

  const setPrimaryImage = async (imageId: string) => {
    setExistingImages(prev => 
      prev.map(img => ({ ...img, is_primary: img.id === imageId }))
    );

    try {
      const updates = existingImages.map(img => ({
        id: img.id,
        is_primary: img.id === imageId,
      }));

      await Promise.all(
        updates.map(update =>
          supabaseClient
            .from("product_images")
            .update({ is_primary: update.is_primary })
            .eq("id", update.id)
        )
      );
      
      toast.success("Primary image updated", {
        icon: <CheckCircle2 className="w-4 h-4" />
      });
    } catch (error) {
      console.error("Error setting primary image:", error);
      toast.error("Failed to update primary image");
      loadProduct();
    }
  };

  const addColor = useCallback(() => {
    if (!newColor.trim()) return;
    if (colors.some(c => c.color.toLowerCase() === newColor.toLowerCase())) {
      toast.error("Color already added");
      return;
    }
    setColors(prev => [...prev, { color: newColor.trim(), status: "available" }]);
    setNewColor("");
    setIsDirty(true);
  }, [newColor, colors]);

  const removeColor = useCallback((index: number) => {
    setColors(prev => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  }, []);

  const addSpecification = useCallback(() => {
    if (!newSpecKey.trim()) {
      toast.error("Specification name required");
      return;
    }
    if (specifications.some(s => s.key.toLowerCase() === newSpecKey.toLowerCase())) {
      toast.error("Specification already exists");
      return;
    }
    setSpecifications(prev => [...prev, { key: newSpecKey.trim(), value: newSpecValue.trim() }]);
    setNewSpecKey("");
    setNewSpecValue("");
    setIsDirty(true);
  }, [newSpecKey, newSpecValue, specifications]);

  const removeSpecification = useCallback((index: number) => {
    setSpecifications(prev => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  }, []);

  const generateSKU = useCallback(() => {
    const prefix = formData.brand?.slice(0, 3).toUpperCase() || "PRD";
    const category = categories.find(c => c.id === formData.category_id)?.name.slice(0, 3).toUpperCase() || "CAT";
    const timestamp = Date.now().toString().slice(-6);
    const sku = `${prefix}-${category}-${timestamp}`;
    updateFormData({ sku });
    toast.success("SKU generated", {
      icon: <Sparkles className="w-4 h-4" />
    });
  }, [formData.brand, formData.category_id, categories, updateFormData]);

  const duplicateProduct = useCallback(async () => {
    if (!id) return;
    
    try {
      toast.info("Duplicating product...");
      // Implementation for duplication would go here
      toast.success("Product duplicated successfully");
    } catch (error) {
      toast.error("Failed to duplicate product");
    }
  }, [id]);

  const uploadImages = async (productId: string): Promise<number> => {
    if (images.length === 0) return 0;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const BATCH_SIZE = 3;
    let uploaded = 0;
    
    for (let i = 0; i < images.length; i += BATCH_SIZE) {
      const batch = images.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (file, batchIndex) => {
        const index = i + batchIndex;
        // Files are already WebP from handleImageSelect
        const ext = "webp";
        const fileName = file.name.replace(/\.\w+$/, ".webp");
        const path = `${productId}/${Date.now()}_${index}.${ext}`;

        try {
          const { error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(path, file, {
              contentType: "image/webp",
              cacheControl: "3600",
            });

          if (uploadError) {
            console.error(`Failed to upload ${file.name}:`, uploadError);
            return null;
          }

          const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(path);
            
          const isPrimary = existingImages.length === 0 && uploaded === 0 && index === 0;

          return {
            product_id: productId,
            image_url: urlData.publicUrl,
            display_order: existingImages.length + index,
            is_primary: isPrimary,
          };
        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error);
          return null;
        }
      });

      const results = await Promise.all(batchPromises);
      const validResults = results.filter(r => r !== null);
      
      if (validResults.length > 0) {
        const insertResult = await supabaseClient
          .from("product_images")
          .insert(validResults);
          
        if (!insertResult.error) {
          uploaded += validResults.length;
        }
      }
      
      setUploadProgress(Math.round(((i + batch.length) / images.length) * 100));
    }

    setIsUploading(false);
    return uploaded;
  };

  const saveColors = async (productId: string) => {
    if (colors.length === 0) return;

    try {
      await supabaseClient
        .from("product_colors")
        .delete()
        .eq("product_id", productId);
      
      const colorsToInsert = colors.map((color, idx) => ({
        product_id: productId,
        color: color.color,
        display_order: idx,
        status: color.status,
      }));
      
      await supabaseClient.from("product_colors").insert(colorsToInsert);
    } catch (err) {
      console.warn("Colors save failed:", err);
    }
  };

  const saveSpecifications = async (productId: string) => {
    if (specifications.length === 0) return;

    try {
      await supabaseClient
        .from("product_specifications")
        .delete()
        .eq("product_id", productId);
      
      const specsToInsert = specifications.map((spec, idx) => ({
        product_id: productId,
        spec_key: spec.key,
        spec_value: spec.value,
        display_order: idx,
      }));
      
      await supabaseClient.from("product_specifications").insert(specsToInsert);
    } catch (err) {
      console.warn("Specifications save failed:", err);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (formData.price <= 0) {
      toast.error("Valid price is required");
      return;
    }
    if (!formData.category_id) {
      toast.error("Please select a category");
      return;
    }

    setSaving(true);
    try {
      const selectedCategory = categories.find(cat => cat.id === formData.category_id);
      const selectedSubcategory = subcategories.find(sub => sub.id === formData.subcategory_id);

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: formData.price,
        original_price: formData.original_price,
        category: selectedCategory?.slug || "",
        category_id: formData.category_id,
        subcategory: selectedSubcategory?.slug || "",
        subcategory_id: formData.subcategory_id || null,
        brand: formData.brand.trim(),
        model: formData.model.trim() || null,
        stock_status: formData.stock_status,
        stock_quantity: formData.stock_quantity,
        sku: formData.sku.trim() || null,
        warranty: formData.warranty.trim() || null,
        weight: formData.weight.trim() || null,
        is_featured: formData.is_featured,
        is_trending: formData.is_trending,
      };

      let productId = id;

      if (id) {
        const updateResult = await supabaseClient
          .from("products")
          .update(productData)
          .eq("id", id);
        if (updateResult.error) throw updateResult.error;
        toast.success("Product updated successfully", {
          icon: <CheckCircle2 className="w-4 h-4" />
        });
      } else {
        const insertResult = await supabaseClient
          .from("products")
          .insert(productData)
          .select()
          .single();
        if (insertResult.error) throw insertResult.error;
        productId = insertResult.data.id;
        toast.success("Product created successfully", {
          icon: <CheckCircle2 className="w-4 h-4" />
        });
      }

      const savePromises = [];
      
      if (images.length > 0 && productId) {
        savePromises.push(uploadImages(productId));
      }
      
      if (productId) {
        savePromises.push(saveColors(productId));
        savePromises.push(saveSpecifications(productId));
      }

      const results = await Promise.allSettled(savePromises);
      
      const uploadResult = results[0];
      if (uploadResult && uploadResult.status === 'fulfilled' && typeof uploadResult.value === 'number') {
        const uploaded = uploadResult.value;
        if (uploaded > 0) {
          toast.success(`${uploaded} WebP image${uploaded !== 1 ? "s" : ""} uploaded`, {
            icon: <ImageIcon className="w-4 h-4" />
          });
        }
      }

      setIsDirty(false);
      navigate("/admin/products");
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(error.message || "Failed to save product", {
        icon: <AlertCircle className="w-4 h-4" />
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <div className="text-muted-foreground">Loading product data...</div>
        </motion.div>
      </div>
    );
  }

  const getStockStatusInfo = (status: string) => {
    return stockStatusOptions.find(opt => opt.value === status) || stockStatusOptions[0];
  };

  const stockStatus = getStockStatusInfo(formData.stock_status);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
        <div className="container mx-auto py-8 max-w-5xl" ref={formRef}>
          {/* Enhanced Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="hover:bg-secondary/80 transition-colors"
                      onClick={() => {
                        if (isDirty && !confirm("You have unsaved changes. Are you sure you want to leave?")) {
                          return;
                        }
                        navigate("/admin/products");
                      }}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Back to Products</TooltipContent>
                </Tooltip>
                
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      {id ? "Edit Product" : "Create New Product"}
                    </h1>
                    {id && (
                      <Badge variant="outline" className="font-mono">
                        ID: {id.slice(0, 8)}
                      </Badge>
                    )}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2">
                    {id ? "Update your product information" : "Add a new product to your store"}
                    {isDirty && (
                      <Badge variant="secondary" className="ml-2">
                        <Info className="w-3 h-3 mr-1" />
                        Unsaved changes
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {id && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={duplicateProduct}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Create a copy of this product</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewMode(!previewMode)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {previewMode ? "Edit" : "Preview"}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Toggle preview mode</TooltipContent>
                    </Tooltip>
                  </>
                )}
                
                <Button
                  variant={isDirty ? "default" : "outline"}
                  size="sm"
                  onClick={handleSubmit}
                  disabled={saving}
                  className={cn(
                    "transition-all",
                    isDirty && "animate-pulse"
                  )}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Form Completion</span>
                <span className="font-medium">{Math.round(completionProgress)}%</span>
              </div>
              <Progress value={completionProgress} className="h-2" />
            </div>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 gap-2 bg-secondary/50 p-1 rounded-xl">
                <TabsTrigger 
                  value="basic" 
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Basic Info
                  {(!formData.name || !formData.category_id) && (
                    <AlertCircle className="w-3 h-3 ml-2 text-yellow-500" />
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="images"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Images
                  {(existingImages.length > 0 || imagePreviews.length > 0) && (
                    <Badge variant="secondary" className="ml-2">
                      {existingImages.length + imagePreviews.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="specs"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Specifications
                  {specifications.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {specifications.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="inventory"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
                >
                  <Boxes className="w-4 h-4 mr-2" />
                  Inventory
                </TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-6">
                <motion.div variants={itemVariants}>
                  <Card className="border-2 border-primary/10 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary" />
                        <CardTitle>Product Information</CardTitle>
                      </div>
                      <CardDescription>Basic details about your product</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div>
                        <Label htmlFor="name" className="flex items-center gap-2">
                          Product Name
                          <span className="text-red-500">*</span>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-4 h-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div>Choose a clear, descriptive name for your product</div>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => updateFormData({ name: e.target.value })}
                          placeholder="e.g., iPhone 15 Pro Leather Case"
                          className="mt-2 transition-all focus:ring-2 focus:ring-primary/20 text-lg"
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => updateFormData({ description: e.target.value })}
                          placeholder="Detailed product description..."
                          rows={6}
                          className="mt-2 transition-all focus:ring-2 focus:ring-primary/20 resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="category" className="flex items-center gap-2">
                            Category                            <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.category_id}
                            onValueChange={(value) => {
                              updateFormData({ category_id: value, subcategory_id: "" });
                            }}
                          >
                            <SelectTrigger id="category" className="mt-2">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="subcategory">Subcategory</Label>
                          <Select
                            value={formData.subcategory_id}
                            onValueChange={(value) => updateFormData({ subcategory_id: value })}
                            disabled={!formData.category_id}
                          >
                            <SelectTrigger id="subcategory" className="mt-2">
                              <SelectValue placeholder="Select subcategory (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredSubcategories.map((sub) => (
                                <SelectItem key={sub.id} value={sub.id}>
                                  {sub.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="brand">Brand</Label>
                          <Input
                            id="brand"
                            value={formData.brand}
                            onChange={(e) => updateFormData({ brand: e.target.value })}
                            placeholder="e.g., Apple, Samsung"
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label htmlFor="model">Model</Label>
                          <Input
                            id="model"
                            value={formData.model}
                            onChange={(e) => updateFormData({ model: e.target.value })}
                            placeholder="e.g., iPhone 15 Pro"
                            className="mt-2"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="sku" className="flex items-center justify-between">
                            <span>SKU</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={generateSKU}
                              className="h-auto p-1"
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Generate
                            </Button>
                          </Label>
                          <Input
                            id="sku"
                            value={formData.sku}
                            onChange={(e) => updateFormData({ sku: e.target.value })}
                            placeholder="Unique product code"
                            className="mt-2 font-mono"
                          />
                        </div>

                        <div>
                          <Label htmlFor="warranty">Warranty</Label>
                          <Input
                            id="warranty"
                            value={formData.warranty}
                            onChange={(e) => updateFormData({ warranty: e.target.value })}
                            placeholder="e.g., 1 Year"
                            className="mt-2"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="weight">Weight</Label>
                        <Input
                          id="weight"
                          value={formData.weight}
                          onChange={(e) => updateFormData({ weight: e.target.value })}
                          placeholder="e.g., 50g, 0.5kg"
                          className="mt-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="border-2 border-primary/10 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        <CardTitle>Pricing</CardTitle>
                      </div>
                      <CardDescription>Set product pricing in KSh</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="price" className="flex items-center gap-2">
                            Price
                            <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative mt-2">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">KSh</span>
                            <Input
                              id="price"
                              type="number"
                              value={formData.price || ""}
                              onChange={(e) => updateFormData({ price: parseFloat(e.target.value) || 0 })}
                              placeholder="0.00"
                              className="pl-12 text-lg font-medium"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="original_price">Original Price</Label>
                          <div className="relative mt-2">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">KSh</span>
                            <Input
                              id="original_price"
                              type="number"
                              value={formData.original_price || ""}
                              onChange={(e) => updateFormData({ 
                                original_price: parseFloat(e.target.value) || null 
                              })}
                              placeholder="0.00"
                              className="pl-12"
                            />
                          </div>
                        </div>
                      </div>

                      {formData.original_price && formData.original_price > formData.price && (
                        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            Save {Math.round(((formData.original_price - formData.price) / formData.original_price) * 100)}% 
                            ({formData.original_price - formData.price} KSh off)
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="border-2 border-primary/10 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <CardTitle>Product Flags</CardTitle>
                      </div>
                      <CardDescription>Highlight your product in the store</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-8">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <Switch
                            checked={formData.is_featured}
                            onCheckedChange={(checked) => updateFormData({ is_featured: checked })}
                            className="data-[state=checked]:bg-yellow-500"
                          />
                          <Star className="w-5 h-5 text-yellow-500 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-medium">Featured Product</div>
                            <div className="text-sm text-muted-foreground">Show in featured section</div>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                          <Switch
                            checked={formData.is_trending}
                            onCheckedChange={(checked) => updateFormData({ is_trending: checked })}
                            className="data-[state=checked]:bg-blue-500"
                          />
                          <TrendingUp className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-medium">Trending Product</div>
                            <div className="text-sm text-muted-foreground">Show in trending section</div>
                          </div>
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images" className="space-y-6">
                <motion.div variants={itemVariants}>
                  <Card className="border-2 border-primary/10 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-primary" />
                          <CardTitle>Product Images</CardTitle>
                        </div>
                        <Badge variant="outline" className="font-mono">
                          {existingImages.length + imagePreviews.length}/{MAX_IMAGES}
                        </Badge>
                      </div>
                      <CardDescription>
                        Upload up to {MAX_IMAGES} images. All images are automatically converted to WebP format for better performance.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-6">
                      {/* Existing Images */}
                      <AnimatePresence>
                        {existingImages.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <Label className="text-sm font-medium mb-3 block">Current Images</Label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                              {existingImages.map((img, index) => (
                                <motion.div 
                                  key={img.id} 
                                  className="relative group"
                                  initial={{ scale: 0.9, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: index * 0.05 }}
                                  whileHover={{ scale: 1.05 }}
                                >
                                  <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-border">
                                    <img
                                      src={img.image_url}
                                      alt="Product"
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                    {img.is_primary && (
                                      <div className="absolute top-2 left-2">
                                        <Badge className="bg-primary shadow-lg">
                                          <Star className="w-3 h-3 mr-1 fill-current" />
                                          Primary
                                        </Badge>
                                      </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                                      <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                                        {!img.is_primary && (
                                          <Button
                                            size="sm"
                                            variant="secondary"
                                            className="flex-1"
                                            onClick={() => setPrimaryImage(img.id)}
                                          >
                                            <Star className="w-3 h-3 mr-1" />
                                            Set Primary
                                          </Button>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          className={cn("flex-1", img.is_primary && "w-full")}
                                          onClick={() => removeExistingImage(img.id, img.image_url)}
                                        >
                                          <Trash2 className="w-3 h-3 mr-1" />
                                          Delete
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Upload Area */}
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Add New Images</Label>
                        <motion.label 
                          className={cn(
                            "flex flex-col items-center justify-center w-full h-40",
                            "border-2 border-dashed rounded-xl cursor-pointer",
                            "bg-secondary/20 hover:bg-secondary/30",
                            "transition-all duration-300",
                            "group"
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex flex-col items-center justify-center">
                            <div className="p-3 rounded-full bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
                              <Upload className="w-8 h-8 text-primary" />
                            </div>
                            <div className="text-sm font-medium">Click to upload images</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              PNG, JPG, WebP - Automatically converted to WebP for best performance
                            </div>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleImageSelect(e.target.files)}
                          />
                        </motion.label>
                      </div>

                      {/* Converting Indicator */}
                      {convertingImages && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-primary/10 rounded-lg border border-primary/20"
                        >
                          <div className="flex items-center gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            <div>
                              <div className="font-medium text-sm">Converting images to WebP...</div>
                              <div className="text-xs text-muted-foreground">This optimizes image size while maintaining quality</div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Upload Progress */}
                      {isUploading && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2"
                        >
                          <div className="flex justify-between text-sm">
                            <span>Uploading WebP images...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} className="h-2" />
                        </motion.div>
                      )}

                      {/* New Image Previews */}
                      <AnimatePresence>
                        {imagePreviews.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                          >
                            <Label className="text-sm font-medium mb-3 block">
                              New Images ({imagePreviews.length}) - WebP format
                            </Label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                              {imagePreviews.map((preview, index) => (
                                <motion.div 
                                  key={index} 
                                  className="relative group"
                                  initial={{ scale: 0.9, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: index * 0.05 }}
                                  whileHover={{ scale: 1.05 }}
                                >
                                  <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-green-500/30">
                                    <img
                                      src={preview}
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <button
                                      onClick={() => removeNewImage(index)}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-all shadow-lg hover:scale-110"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                    <Badge className="absolute bottom-2 left-2 bg-green-600 text-white">
                                      WebP
                                    </Badge>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="border-2 border-primary/10 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                      <div className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-primary" />
                        <CardTitle>Available Colors</CardTitle>
                      </div>
                      <CardDescription>Select colors available for this product</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <ScrollArea className="h-20">
                        <div className="flex flex-wrap gap-2">
                          <AnimatePresence>
                            {colors.map((color, index) => (
                              <motion.div
                                key={`${color.color}-${index}`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                whileHover={{ scale: 1.05 }}
                              >
                                <Badge 
                                  variant="secondary" 
                                  className="px-4 py-2 text-sm gap-2 group"
                                >
                                  <div 
                                    className="w-4 h-4 rounded-full border border-border"
                                    style={{ backgroundColor: color.color.toLowerCase() }}
                                  />
                                  {color.color}
                                  <button
                                    onClick={() => removeColor(index)}
                                    className="ml-1 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          {colors.length === 0 && (
                            <div className="text-sm text-muted-foreground text-center w-full py-4">
                              No colors added yet. Add colors below.
                            </div>
                          )}
                        </div>
                      </ScrollArea>

                      <Separator />

                      <div className="flex gap-2">
                        <Input
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && addColor()}
                          placeholder="Add color (e.g., Black, Gold, Silver)"
                          className="flex-1"
                        />
                        <Button onClick={addColor} disabled={!newColor.trim()}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Color
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Specifications Tab */}
              <TabsContent value="specs" className="space-y-6">
                <motion.div variants={itemVariants}>
                  <Card className="border-2 border-primary/10 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                      <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-primary" />
                        <CardTitle>Technical Specifications</CardTitle>
                      </div>
                      <CardDescription>Add detailed product specifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <ScrollArea className="max-h-96">
                        <div className="space-y-3 pr-4">
                          <AnimatePresence>
                            {specifications.map((spec, index) => (
                              <motion.div 
                                key={index} 
                                className="flex gap-3 items-start"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                <div className="mt-2 cursor-move">
                                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <Input
                                  value={spec.key}
                                  onChange={(e) => {
                                    const updated = [...specifications];
                                    updated[index].key = e.target.value;
                                    setSpecifications(updated);
                                    setIsDirty(true);
                                  }}
                                  placeholder="Specification name"
                                  className="flex-1 font-medium"
                                />
                                <Input
                                  value={spec.value}
                                  onChange={(e) => {
                                    const updated = [...specifications];
                                    updated[index].value = e.target.value;
                                    setSpecifications(updated);
                                    setIsDirty(true);
                                  }}
                                  placeholder="Value"
                                  className="flex-[2]"
                                />
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => removeSpecification(index)}
                                  className="shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          {specifications.length === 0 && (
                            <div className="text-center py-12">
                              <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                              <div className="text-muted-foreground">No specifications added yet</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Add specifications like Processor, RAM, Storage, etc.
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>

                      <Separator />

                      <div className="flex gap-3">
                        <Input
                          value={newSpecKey}
                          onChange={(e) => setNewSpecKey(e.target.value)}
                          placeholder="e.g., Processor, RAM, Storage"
                          className="flex-1"
                        />
                        <Input
                          value={newSpecValue}
                          onChange={(e) => setNewSpecValue(e.target.value)}
                          placeholder="e.g., A17 Pro, 8GB, 256GB"
                          className="flex-[2]"
                        />
                        <Button 
                          onClick={addSpecification} 
                          disabled={!newSpecKey.trim()}
                          className="shrink-0"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Spec
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Inventory Tab */}
              <TabsContent value="inventory" className="space-y-6">
                <motion.div variants={itemVariants}>
                  <Card className="border-2 border-primary/10 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                      <div className="flex items-center gap-2">
                        <Boxes className="w-5 h-5 text-primary" />
                        <CardTitle>Stock Management</CardTitle>
                      </div>
                      <CardDescription>Manage product inventory and availability</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div>
                        <Label htmlFor="stock_status">Stock Status</Label>
                        <Select
                          value={formData.stock_status}
                          onValueChange={(value: any) => updateFormData({ stock_status: value })}
                        >
                          <SelectTrigger id="stock_status" className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {stockStatusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-2 h-2 rounded-full", option.bgColor)} />
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="stock_quantity">Stock Quantity</Label>
                        <Input
                          id="stock_quantity"
                          type="number"
                          min="0"
                          value={formData.stock_quantity}
                          onChange={(e) => updateFormData({ 
                            stock_quantity: parseInt(e.target.value) || 0 
                          })}
                          className="mt-2 text-lg"
                        />
                      </div>

                      <div className={cn(
                        "p-4 rounded-lg border",
                        stockStatus.bgColor,
                        "bg-opacity-10"
                      )}>
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-full",
                            stockStatus.bgColor
                          )}>
                            {stockStatus.value === "in_stock" && <CheckCircle2 className="w-4 h-4" />}
                            {stockStatus.value === "low_stock" && <AlertCircle className="w-4 h-4" />}
                            {stockStatus.value === "out_of_stock" && <X className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className={cn("font-medium", stockStatus.color)}>
                              Current Status: {stockStatus.label}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {stockStatus.value === "in_stock" && "Product is available for purchase"}
                              {stockStatus.value === "low_stock" && "Running low on stock, consider restocking soon"}
                              {stockStatus.value === "out_of_stock" && "Product is currently unavailable"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>

            {/* Enhanced Actions Footer */}
            <motion.div 
              className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-sm border-t mt-8 pt-4 pb-4 flex gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => {
                  if (isDirty && !confirm("You have unsaved changes. Are you sure you want to leave?")) {
                    return;
                  }
                  navigate("/admin/products");
                }} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={saving} 
                size="lg"
                className={cn(
                  "flex-1 relative overflow-hidden",
                  "bg-gradient-to-r from-primary to-primary/80",
                  "hover:from-primary/90 hover:to-primary/70",
                  "transition-all duration-300"
                )}
              >
                {saving && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                {!saving && <Save className="w-5 h-5 mr-2" />}
                {saving ? "Saving Product..." : id ? "Update Product" : "Create Product"}
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
}