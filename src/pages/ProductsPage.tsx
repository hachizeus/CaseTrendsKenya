import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/queries";
import { getDisplayCategoryName, productMatchesCategoryFilter } from "@/lib/utils";
import { MAIN_CATEGORIES, getSubcategoriesByCategory } from "@/lib/categoryData";
import { 
  SlidersHorizontal, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Grid, List, Sparkles, TrendingUp, Clock, Star, Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

// HARDCODED BRANDS - Not fetching from database
const HARDCODED_BRANDS = [
  "All Laptop Brands",
  "Apple",
  "Google Pixel",
  "HAVIT",
  "Huawei",
  "Infinix",
  "iPhone",
  "Itel",
  "Motorola",
  "Nokia",
  "OnePlus",
  "Oppo",
  "Oraimo",
  "Realme",
  "Redmi",
  "Samsung",
  "Samsung Z fold",
  "Soundcore",
  "Tecno",
  "Universal",
  "Vivo",
  "Xiaomi",
  "Z fold 3/4/5/6/7",
];

const Badge = ({ children, variant, className }: any) => (
  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground ${className || ''}`}>
    {children}
  </span>
);

const ScrollArea = ({ children, className }: any) => (
  <div className={`overflow-y-auto ${className || ''}`}>
    {children}
  </div>
);

const Select = ({ value, onValueChange, children }: any) => {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className="px-2 sm:px-3 py-2 bg-card border border-border rounded-lg text-sm cursor-pointer min-w-[130px] sm:min-w-[180px]"
    >
      {children}
    </select>
  );
};

const Skeleton = ({ className }: any) => (
  <div className={`bg-muted animate-pulse rounded ${className || ''}`} />
);

const Alert = ({ children, variant }: any) => (
  <div className={`p-4 rounded-lg border ${
    variant === 'destructive' 
      ? 'bg-destructive/10 border-destructive/20 text-destructive' 
      : 'bg-muted border-border'
  }`}>
    {children}
  </div>
);

const AlertDescription = ({ children, className }: any) => (
  <div className={className}>{children}</div>
);

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const priceRanges = [
  { label: "Under KSh 5,000", min: 0, max: 5000 },
  { label: "KSh 5,000 - 15,000", min: 5000, max: 15000 },
  { label: "KSh 15,000 - 30,000", min: 15000, max: 30000 },
  { label: "KSh 30,000 - 60,000", min: 30000, max: 60000 },
  { label: "KSh 60,000 - 100,000", min: 60000, max: 100000 },
  { label: "Over KSh 100,000", min: 100000, max: Infinity },
];

const homepageCategories = MAIN_CATEGORIES.map((cat) => cat.slug);

const colorOptions = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Red", hex: "#EF4444" },
  { name: "Green", hex: "#10B981" },
  { name: "Gold", hex: "#FBBF24" },
  { name: "Silver", hex: "#9CA3AF" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Purple", hex: "#8B5CF6" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Orange", hex: "#F97316" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Navy", hex: "#1E3A8A" },
  { name: "Maroon", hex: "#991B1B" },
  { name: "Teal", hex: "#0D9488" },
  { name: "Coral", hex: "#FB7185" },
  { name: "Lavender", hex: "#C084FC" },
  { name: "Mint", hex: "#34D399" },
];

// Custom List View Product Card Component
const ProductListItem = ({ product, index }: { product: any; index: number }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const primaryImage = product.product_images?.[0]?.image_url || 
                      product.product_images?.[0]?.url || 
                      null;
  
  const discountPercentage = product.original_price 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const productColors = product.product_colors || [];
  
  const getColorHex = (colorName: string) => {
    const colorOption = colorOptions.find(c => c.name.toLowerCase() === colorName.toLowerCase());
    return colorOption?.hex || '#CCCCCC';
  };

  const handleViewDetails = () => {
    navigate(`/product/${product.id}`);
  };

  const handleAddToCart = () => {
    console.log('Add to cart:', product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/20"
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative sm:w-48 md:w-56 lg:w-64 flex-shrink-0 cursor-pointer" onClick={handleViewDetails}>
          <div className="aspect-square sm:aspect-auto sm:h-full bg-gradient-to-br from-muted/50 to-muted/30">
            {primaryImage && !imageError ? (
              <img
                src={primaryImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-12 h-12 text-muted-foreground/40" />
              </div>
            )}
          </div>
          
          {discountPercentage > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
              -{discountPercentage}%
            </div>
          )}
          
          {product.stock_status === 'out_of_stock' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-semibold">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 p-4 sm:p-5 flex flex-col">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {product.brand && (
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                {product.brand}
              </span>
            )}
            {product.category && (
              <span className="text-xs text-muted-foreground">
                {getDisplayCategoryName(product.category)}
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            <button onClick={handleViewDetails} className="hover:underline text-left">
              {product.name}
            </button>
          </h3>

          {product.rating && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium ml-1">{product.rating}</span>
              </div>
              {product.review_count > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({product.review_count} reviews)
                </span>
              )}
            </div>
          )}

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl sm:text-2xl font-bold text-primary">
              KSh {Number(product.price).toLocaleString()}
            </span>
            {product.original_price && (
              <span className="text-sm text-muted-foreground line-through">
                KSh {Number(product.original_price).toLocaleString()}
              </span>
            )}
          </div>

          {productColors && productColors.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted-foreground">Colors:</span>
              <div className="flex gap-1.5 flex-wrap">
                {productColors.slice(0, 5).map((colorItem: any, idx: number) => {
                  const colorName = colorItem.color || colorItem.name;
                  const colorHex = colorItem.color_hex || getColorHex(colorName);
                  return (
                    <div
                      key={idx}
                      className="w-6 h-6 rounded-full border-2 border-border shadow-sm transition-transform hover:scale-110 cursor-pointer"
                      style={{ backgroundColor: colorHex }}
                      title={colorName}
                    />
                  );
                })}
                {productColors.length > 5 && (
                  <span className="text-xs text-muted-foreground flex items-center">
                    +{productColors.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mt-auto pt-3">
            <Button 
              size="sm" 
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={product.stock_status === 'out_of_stock'}
              onClick={handleAddToCart}
            >
              {product.stock_status === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleViewDetails}
              className="flex-shrink-0"
            >
              View Details
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const PAGE_SIZE = 12;

  // Fetch ALL products (not paginated) for filtering
  const { data: allProductsData, isLoading, error } = useProducts();
  const allProducts = (allProductsData as any[]) || [];

  const selectedCategory = searchParams.get("category") || "";
  const selectedSubcategory = searchParams.get("subcategory") || "";
  const selectedBrand = searchParams.get("brand") || "";
  const selectedModel = searchParams.get("model") || "";
  const selectedCompatibility = searchParams.get("compatibility") || "";
  const selectedColor = searchParams.get("color") || "";
  const selectedPrice = searchParams.get("price") || "";
  const searchQuery = searchParams.get("q") || "";
  const sortBy = searchParams.get("sort") || "newest";

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true, 
    subcategory: true, 
    price: true, 
    color: true,
    brand: false,
    model: false,
  });

  const toggleSection = (key: string) => setOpenSections(s => ({ ...s, [key]: !s[key] }));

  const splitModels = (value?: string) =>
    (value || "").split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean);

  // ENHANCED: Smart category matching that checks product names and descriptions
  const matchesCategorySmart = (product: any, categorySlug: string): boolean => {
    const productName = product.name?.toLowerCase() || "";
    const productDesc = product.description?.toLowerCase() || "";
    const productCategory = product.category?.toLowerCase() || "";
    const productBrand = product.brand?.toLowerCase() || "";
    
    // First try exact category match
    if (productMatchesCategoryFilter(product, categorySlug)) {
      return true;
    }
    
    // Smart matching based on category type
    switch (categorySlug) {
      case "phone-cases":
        return productName.includes("case") || 
               productName.includes("cover") ||
               productDesc.includes("case") ||
               productDesc.includes("cover") ||
               productCategory === "phone-cases" ||
               productCategory === "phone cases";
               
      case "protectors":
        return productName.includes("protector") || 
               productName.includes("screen protector") ||
               productName.includes("lens protector") ||
               productDesc.includes("protector") ||
               productCategory === "protectors";
               
      case "android-phones-protectors":
        return (productBrand !== "apple" || productName.includes("android")) &&
               (productName.includes("protector") || productDesc.includes("protector"));
               
      case "iphone-model-protectors":
        return (productBrand === "apple" || productName.includes("iphone")) &&
               (productName.includes("protector") || productDesc.includes("protector"));
               
      case "audio":
        return productName.includes("headphone") ||
               productName.includes("earbud") ||
               productName.includes("speaker") ||
               productCategory === "audio";
               
      case "power-banks":
        return productName.includes("power bank") ||
               productName.includes("powerbank") ||
               productName.includes("portable charger") ||
               productCategory === "power-banks";
               
      default:
        return false;
    }
  };

  // ENHANCED: Filter products with smart matching
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Search query filtering
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => {
        const nameMatch = p.name?.toLowerCase().includes(q);
        const brandMatch = p.brand?.toLowerCase().includes(q);
        const categoryMatch = p.category?.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        const modelMatch = (p.model?.toLowerCase() || "").includes(q);
        
        return nameMatch || brandMatch || categoryMatch || descMatch || modelMatch;
      });
    }
    
    // Category filter with smart matching
    if (selectedCategory) {
      result = result.filter(p => matchesCategorySmart(p, selectedCategory));
    }
    
    // Brand filter - using hardcoded brands
    if (selectedBrand) {
      result = result.filter(p => 
        p.brand?.toLowerCase() === selectedBrand.toLowerCase()
      );
    }
    
    // Model filter
    if (selectedModel) {
      result = result.filter(p => 
        splitModels(p.model).some(model => 
          model.toLowerCase() === selectedModel.toLowerCase()
        )
      );
    }
    
    // Compatibility filter
    if (selectedCompatibility) {
      result = result.filter(p => 
        (p.compatibility_type || "").toLowerCase().includes(selectedCompatibility.toLowerCase())
      );
    }
    
    // Color filter
    if (selectedColor) {
      result = result.filter(p => 
        p.product_colors?.some((pc: any) => 
          pc.color?.toLowerCase() === selectedColor.toLowerCase()
        )
      );
    }

    // Price filter
    if (selectedPrice) {
      const range = priceRanges[Number(selectedPrice)];
      if (range) {
        result = result.filter(p => 
          Number(p.price) >= range.min && Number(p.price) < range.max
        );
      }
    }

    // Sorting
    switch (sortBy) {
      case "price_asc": 
        result.sort((a, b) => a.price - b.price); 
        break;
      case "price_desc": 
        result.sort((a, b) => b.price - a.price); 
        break;
      case "name": 
        result.sort((a, b) => a.name.localeCompare(b.name)); 
        break;
      default: 
        if (sortBy === "newest" && result[0]?.created_at) {
          result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        break;
    }

    return result;
  }, [allProducts, searchQuery, selectedCategory, selectedBrand, selectedModel, 
      selectedCompatibility, selectedColor, selectedPrice, sortBy]);

  // Calculate pagination based on filtered results
  const totalFilteredProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalFilteredProducts / PAGE_SIZE);
  
  // Get current page products
  const currentPageProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, page, PAGE_SIZE]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory, selectedBrand, selectedModel, 
      selectedCompatibility, selectedColor, selectedPrice, sortBy]);

  // Use HARDCODED brands instead of fetching from database
  const brands = HARDCODED_BRANDS;

  const availableModels = useMemo(() => {
    const filteredByBrand = selectedBrand 
      ? filteredProducts.filter((p: any) => p.brand === selectedBrand) 
      : filteredProducts;
    const models = new Set<string>();
    filteredByBrand.forEach((p: any) => 
      splitModels(p.model).forEach(model => models.add(model))
    );
    return Array.from(models).sort();
  }, [filteredProducts, selectedBrand]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    homepageCategories.forEach((cat) => {
      counts[cat] = allProducts.filter((p: any) => matchesCategorySmart(p, cat)).length;
    });
    return counts;
  }, [allProducts]);

  const currentSubcategories = selectedCategory 
    ? getSubcategoriesByCategory(selectedCategory) 
    : [];

  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    currentSubcategories.forEach((sub) => {
      counts[sub.slug] = allProducts.filter((p: any) => 
        productMatchesCategoryFilter(p, selectedCategory, sub.slug)
      ).length;
    });
    return counts;
  }, [allProducts, selectedCategory, currentSubcategories]);

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key === "category" && selectedSubcategory && value !== selectedCategory) {
      params.delete("subcategory");
    }
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const activeFilterCount = [
    selectedCategory, selectedSubcategory, selectedBrand, selectedModel, 
    selectedCompatibility, selectedColor, selectedPrice, searchQuery
  ].filter(Boolean).length;

  const FilterSidebar = () => (
    <ScrollArea className="h-full pr-2">
      <div className="space-y-1 pb-20">
        <FilterSection 
          title="Category" 
          isOpen={openSections.category} 
          toggle={() => toggleSection("category")}
          badge={selectedCategory ? 1 : undefined}
        > 
          <div className="space-y-1">
            {homepageCategories.map(cat => (
              <FilterButton
                key={cat}
                label={getDisplayCategoryName(cat)}
                count={categoryCounts[cat]}
                active={selectedCategory === cat}
                onClick={() => setFilter("category", selectedCategory === cat ? "" : cat)}
              />
            ))}
          </div>
        </FilterSection>

        {selectedCategory && currentSubcategories.length > 0 && (
          <FilterSection 
            title="Subcategory" 
            isOpen={openSections.subcategory} 
            toggle={() => toggleSection("subcategory")}
            badge={selectedSubcategory ? 1 : undefined}
          > 
            <div className="space-y-1">
              {currentSubcategories.map(sub => (
                <FilterButton
                  key={sub.slug}
                  label={sub.name}
                  count={subcategoryCounts[sub.slug] || 0}
                  active={selectedSubcategory === sub.slug}
                  onClick={() => setFilter("subcategory", selectedSubcategory === sub.slug ? "" : sub.slug)}
                />
              ))}
            </div>
          </FilterSection>
        )}

        {brands.length > 0 && (
          <FilterSection 
            title="Brand" 
            isOpen={openSections.brand} 
            toggle={() => toggleSection("brand")}
            badge={selectedBrand ? 1 : undefined}
          >
            <div className="space-y-1 max-h-60 overflow-y-auto scrollbar-hide">
              {brands.map(brand => (
                <FilterButton
                  key={brand}
                  label={brand}
                  active={selectedBrand === brand}
                  onClick={() => setFilter("brand", selectedBrand === brand ? "" : brand)}
                />
              ))}
            </div>
          </FilterSection>
        )}

        {availableModels.length > 0 && (
          <FilterSection 
            title="Model" 
            isOpen={openSections.model} 
            toggle={() => toggleSection("model")}
            badge={selectedModel ? 1 : undefined}
          >
            <div className="space-y-1 max-h-60 overflow-y-auto scrollbar-hide">
              {availableModels.map(model => (
                <FilterButton
                  key={model}
                  label={model}
                  active={selectedModel === model}
                  onClick={() => setFilter("model", selectedModel === model ? "" : model)}
                />
              ))}
            </div>
          </FilterSection>
        )}

        <FilterSection 
          title="Price Range" 
          isOpen={openSections.price} 
          toggle={() => toggleSection("price")}
          badge={selectedPrice ? 1 : undefined}
        >
          <div className="space-y-1">
            {priceRanges.map((range, i) => (
              <FilterButton 
                key={i} 
                label={range.label} 
                active={selectedPrice === String(i)} 
                onClick={() => setFilter("price", selectedPrice === String(i) ? "" : String(i))} 
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection 
          title="Color" 
          isOpen={openSections.color} 
          toggle={() => toggleSection("color")}
          badge={selectedColor ? 1 : undefined}
        >
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-1">
            {colorOptions.map(color => (
              <button
                key={color.name}
                onClick={() => setFilter("color", selectedColor === color.name ? "" : color.name)}
                className={cn(
                  "relative group flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                  "hover:bg-muted/50",
                  selectedColor === color.name && "bg-primary/10 ring-2 ring-primary"
                )}
                title={color.name}
              >
                <div 
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-border shadow-sm transition-transform group-hover:scale-110"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-[8px] sm:text-[10px] text-muted-foreground truncate w-full text-center">
                  {color.name}
                </span>
              </button>
            ))}
          </div>
        </FilterSection>
      </div>
    </ScrollArea>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      <Header />
      
      <main className="flex-1">
        <div className="container px-4 sm:px-6 py-4 sm:py-8">
          <nav className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <a href="/" className="hover:text-primary transition-colors">Home</a>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">All Products</span>
            {selectedCategory && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground font-medium">
                  {getDisplayCategoryName(selectedCategory)}
                </span>
              </>
            )}
          </nav>

          <div className="flex gap-8">
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-20">
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="p-4 bg-muted/30 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-5 h-5" />
                        <h3 className="font-semibold">Filters</h3>
                      </div>
                      {activeFilterCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="text-destructive hover:text-destructive h-auto px-2"
                        >
                          Clear all
                        </Button>
                      )}
                    </div>
                    {activeFilterCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <FilterSidebar />
                </div>
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 sm:mb-6">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">
                    {selectedCategory && selectedCategory !== "All Accessories" 
                      ? getDisplayCategoryName(selectedCategory)
                      : "All Products"
                    }
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Showing {currentPageProducts.length} of {totalFilteredProducts} products
                  </p>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <div className="hidden sm:flex items-center gap-1 bg-muted rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-8 w-8 p-0"
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8 w-8 p-0"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>

                  <Select value={sortBy} onValueChange={(value: string) => setFilter("sort", value)}>
                    <option value="newest">✨ Newest</option>
                    <option value="price_asc">💰 Low to High</option>
                    <option value="price_desc">💰 High to Low</option>
                    <option value="name">📝 A-Z</option>
                  </Select>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setMobileFiltersOpen(true)}
                    className="lg:hidden gap-2"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden xs:inline">Filters</span>
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="flex flex-nowrap sm:flex-wrap gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                  {selectedCategory && selectedCategory !== "All Accessories" && (
                    <FilterTag 
                      label={`Category: ${getDisplayCategoryName(selectedCategory)}`} 
                      onRemove={() => setFilter("category", "")} 
                    />
                  )}
                  {selectedSubcategory && (
                    <FilterTag 
                      label={`Subcategory: ${currentSubcategories.find(s => s.slug === selectedSubcategory)?.name || selectedSubcategory}`} 
                      onRemove={() => setFilter("subcategory", "")} 
                    />
                  )}
                  {selectedBrand && (
                    <FilterTag 
                      label={`Brand: ${selectedBrand}`} 
                      onRemove={() => setFilter("brand", "")} 
                    />
                  )}
                  {selectedModel && (
                    <FilterTag 
                      label={`Model: ${selectedModel}`} 
                      onRemove={() => setFilter("model", "")} 
                    />
                  )}
                  {selectedCompatibility && (
                    <FilterTag 
                      label={`Compatibility: ${selectedCompatibility}`} 
                      onRemove={() => setFilter("compatibility", "")} 
                    />
                  )}
                  {selectedPrice && (
                    <FilterTag 
                      label={priceRanges[Number(selectedPrice)]?.label || ""} 
                      onRemove={() => setFilter("price", "")} 
                    />
                  )}
                  {selectedColor && (
                    <FilterTag 
                      label={`Color: ${selectedColor}`} 
                      onRemove={() => setFilter("color", "")} 
                    />
                  )}
                  {searchQuery && (
                    <FilterTag 
                      label={`Search: "${searchQuery}"`} 
                      onRemove={() => setFilter("q", "")} 
                    />
                  )}
                </div>
              )}

              {error ? (
                <Alert variant="destructive">
                  <AlertDescription className="flex items-center justify-between flex-col sm:flex-row gap-3">
                    <span>Failed to load products. Please try again.</span>
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : isLoading ? (
                <div className={cn(
                  "grid gap-3 sm:gap-4",
                  viewMode === 'grid' 
                    ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                    : "grid-cols-1"
                )}>
                  {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    viewMode === 'grid' ? (
                      <div key={i} className="bg-card rounded-lg border border-border overflow-hidden">
                        <Skeleton className="aspect-square" />
                        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                          <Skeleton className="h-3 sm:h-4 w-1/3" />
                          <Skeleton className="h-4 sm:h-5 w-full" />
                          <Skeleton className="h-3 sm:h-4 w-2/3" />
                          <div className="flex gap-2 pt-2">
                            <Skeleton className="h-7 sm:h-8 flex-1" />
                            <Skeleton className="h-7 sm:h-8 w-16 sm:w-20" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="bg-card rounded-lg border border-border overflow-hidden">
                        <div className="flex flex-col sm:flex-row">
                          <Skeleton className="sm:w-48 md:w-56 lg:w-64 aspect-square sm:aspect-auto sm:h-48" />
                          <div className="flex-1 p-4 space-y-3">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-8 w-1/4" />
                            <div className="flex gap-2">
                              <Skeleton className="h-9 flex-1" />
                              <Skeleton className="h-9 w-24" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              ) : currentPageProducts.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <div className="max-w-md mx-auto px-4">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-muted flex items-center justify-center">
                      <SlidersHorizontal className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2">No products found</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                      We couldn't find any products matching your criteria. Try adjusting your filters.
                    </p>
                    <Button onClick={clearFilters} size="sm" className="sm:h-auto sm:py-2">
                      Clear all filters
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={cn(
                    "grid gap-3 sm:gap-4",
                    viewMode === 'grid' 
                      ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                      : "grid-cols-1"
                  )}>
                    {currentPageProducts.map((product, i) => (
                      viewMode === 'grid' ? (
                        <div key={product.id} className="h-full">
                          <ProductCard
                            id={product.id}
                            name={product.name}
                            images={product.product_images || []}
                            price={Number(product.price)}
                            originalPrice={product.original_price ? Number(product.original_price) : null}
                            category={product.category}
                            brand={product.brand}
                            model={product.model}
                            stockStatus={product.stock_status}
                            rating={product.rating}
                            reviewCount={product.review_count}
                            index={i}
                          />
                        </div>
                      ) : (
                        <ProductListItem key={product.id} product={product} index={i} />
                      )
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-0 sm:justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border">
                      <p className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                        Page {page} of {totalPages}
                      </p>
                      <div className="flex items-center gap-2 order-1 sm:order-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { 
                            setPage(p => Math.max(1, p - 1)); 
                            window.scrollTo({ top: 0, behavior: "smooth" }); 
                          }}
                          disabled={page === 1}
                          className="text-xs sm:text-sm"
                        >
                          <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Prev
                        </Button>
                        
                        <div className="hidden sm:flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (page <= 3) {
                              pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = page - 2 + i;
                            }
                            
                            if (pageNum > totalPages) return null;
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={page === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => { 
                                  setPage(pageNum); 
                                  window.scrollTo({ top: 0, behavior: "smooth" }); 
                                }}
                                className="w-8 h-8"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        <span className="sm:hidden text-sm font-medium">
                          {page} / {totalPages}
                        </span>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { 
                            setPage(p => Math.min(totalPages, p + 1)); 
                            window.scrollTo({ top: 0, behavior: "smooth" }); 
                          }}
                          disabled={page === totalPages}
                          className="text-xs sm:text-sm"
                        >
                          Next
                          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-[75vw] sm:w-[66vw] md:w-[50vw] lg:hidden bg-card z-50 overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-border bg-card sticky top-0 z-10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">Filters</h3>
                  <button 
                    onClick={() => setMobileFiltersOpen(false)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Refine your product search
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <FilterSidebar />
              </div>
              {activeFilterCount > 0 && (
                <div className="p-4 border-t border-border bg-card sticky bottom-0">
                  <Button 
                    onClick={() => {
                      clearFilters();
                      setMobileFiltersOpen(false);
                    }}
                    variant="destructive"
                    className="w-full"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 480px) {
          .xs\\:inline {
            display: inline;
          }
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

const FilterSection = ({ 
  title, 
  isOpen, 
  toggle, 
  children, 
  badge 
}: { 
  title: string; 
  isOpen: boolean; 
  toggle: () => void; 
  children: React.ReactNode;
  badge?: number;
}) => (
  <div className="border-b border-border last:border-0">
    <button 
      onClick={toggle} 
      className="flex items-center justify-between w-full py-3 px-1 text-sm font-semibold hover:text-primary transition-colors"
    >
      <div className="flex items-center gap-2">
        {title}
        {badge && (
          <Badge variant="secondary">
            {badge}
          </Badge>
        )}
      </div>
      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }} 
          animate={{ height: "auto", opacity: 1 }} 
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="pb-3">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const FilterButton = ({ 
  label, 
  count, 
  active, 
  onClick 
}: { 
  label: string; 
  count?: number; 
  active: boolean; 
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-all",
      "hover:bg-muted/50 active:bg-muted/70",
      active && "bg-primary/10 text-primary font-medium border-l-2 border-l-primary"
    )}
  >
    <span className="truncate text-left">{label}</span>
    {typeof count === "number" && count > 0 && (
      <Badge variant="secondary">
        {count}
      </Badge>
    )}
  </button>
);

const FilterTag = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <Badge variant="secondary" className="gap-1 pl-3 pr-2 py-1.5 text-xs whitespace-nowrap">
    {label}
    <button 
      onClick={onRemove}
      className="ml-1 hover:bg-muted rounded-full p-0.5 transition-colors"
    >
      <X className="w-3 h-3" />
    </button>
  </Badge>
);

export default ProductsPage;