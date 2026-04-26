import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/queries";
import { getDisplayCategoryName } from "@/lib/utils";
import { 
  SlidersHorizontal, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Grid, List, Package, Check, FilterX
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

// Updated BRANDS with specific phone models
const BRANDS = [
  { name: "Samsung", models: ["Galaxy S Series", "Galaxy A Series", "Galaxy M Series", "Galaxy Z Series (Fold / Flip)"] },
  { name: "Apple", models: ["iPhone 11 – iPhone 17 lineup", "iPhone Pro / Pro Max", "iPhone SE"] },
  { name: "Xiaomi", models: ["Xiaomi flagship series (14, 15, 17)", "Xiaomi T Series"] },
  { name: "Redmi", models: ["Redmi A Series", "Redmi Note Series", "Redmi Number Series"] },
  { name: "Poco", models: ["Poco C Series", "Poco X Series", "Poco F Series"] },
  { name: "Tecno", models: ["Spark Series", "Camon Series", "Phantom Series"] },
  { name: "Infinix", models: ["Smart Series", "Hot Series", "Note Series", "Zero Series"] },
  { name: "Oppo", models: ["A Series", "Reno Series", "Find Series"] },
  { name: "Vivo", models: ["Y Series", "V Series", "X Series"] },
  { name: "Huawei", models: ["Nova Series", "P Series", "Mate Series"] },
  { name: "Nokia", models: [] },
  { name: "Realme", models: [] },
  { name: "Honor", models: [] },
  { name: "Google", models: ["Pixel series"] },
  { name: "OnePlus", models: ["Number series", "Nord series"] },
  { name: "Motorola", models: [] },
  { name: "Nothing Phone", models: ["Nothing phone 1", "Nothing Phone 2", "Nothing Phone 3"] }
];

const Badge = ({ children, className }: any) => (
  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground ${className || ''}`}>
    {children}
  </span>
);

const ScrollArea = ({ children, className }: any) => (
  <div className={`overflow-y-auto ${className || ''}`}>{children}</div>
);

const Select = ({ value, onValueChange, children }: any) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    className="px-2 sm:px-3 py-2 bg-card border border-border rounded-lg text-sm cursor-pointer min-w-[130px] sm:min-w-[180px]"
  >
    {children}
  </select>
);

const Skeleton = ({ className }: any) => (
  <div className={`bg-muted animate-pulse rounded ${className || ''}`} />
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

// Categories from your database
const homepageCategories = [
  "smartphones",
  "android-phones",
  "iphone-model",
  "audio",
  "smart-watch",
  "charging-devices",
  "power-banks",
  "camera-lens-protectors",
  "protectors",
  "phone-cases",
  "gaming",
  "magsafe-cases",
  "stickers",
  "phone-holders",
  "accessories",
  "tablets",
  "streaming",
  "wearables"
];

const ProductListItem = ({ product, index }: { product: any; index: number }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const primaryImage = product.product_images?.[0]?.image_url || 
                      product.product_images?.[0]?.url || null;
  
  const discountPercentage = product.original_price 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/20"
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative sm:w-48 md:w-56 lg:w-64 flex-shrink-0 cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
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
        </div>

        <div className="flex-1 p-4 sm:p-5 flex flex-col">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {product.brand && (
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                {product.brand}
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            <button onClick={() => navigate(`/product/${product.id}`)} className="hover:underline text-left">
              {product.name}
            </button>
          </h3>

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

          <div className="flex items-center gap-2 mt-auto pt-3">
            <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90">
              Add to Cart
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate(`/product/${product.id}`)}>
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

  const { data: allProductsData, isLoading, error } = useProducts();
  const allProducts = (allProductsData as any[]) || [];

  const selectedCategory = searchParams.get("category") || "";
  const selectedBrand = searchParams.get("brand") || "";
  const selectedModel = searchParams.get("model") || "";
  const selectedPrice = searchParams.get("price") || "";
  const searchQuery = searchParams.get("q") || "";
  const sortBy = searchParams.get("sort") || "newest";

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true,
    brand: true,
    model: false,
    price: true,
  });

  const toggleSection = (key: string) => setOpenSections(s => ({ ...s, [key]: !s[key] }));

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    
    // Category filter
    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    // Brand filter
    if (selectedBrand) {
      result = result.filter(p => p.brand?.toLowerCase() === selectedBrand.toLowerCase());
    }

    // Model filter
    if (selectedModel) {
      result = result.filter(p => {
        const productModels = p.model?.split(/[\r\n,]+/).map((m: string) => m.trim().toLowerCase()) || [];
        return productModels.includes(selectedModel.toLowerCase());
      });
    }

    // Price filter
    if (selectedPrice) {
      const range = priceRanges[Number(selectedPrice)];
      if (range) {
        result = result.filter(p => {
          const price = Number(p.price);
          if (range.max === Infinity) {
            return price >= range.min;
          }
          return price >= range.min && price <= range.max;
        });
      }
    }

    // Sorting
    switch (sortBy) {
      case "price_asc": 
        result.sort((a, b) => Number(a.price) - Number(b.price)); 
        break;
      case "price_desc": 
        result.sort((a, b) => Number(b.price) - Number(a.price)); 
        break;
      case "name": 
        result.sort((a, b) => a.name?.localeCompare(b.name || '')); 
        break;
      case "newest":
      default:
        if (result[0]?.created_at) {
          result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        break;
    }

    return result;
  }, [allProducts, searchQuery, selectedCategory, selectedBrand, selectedModel, selectedPrice, sortBy]);

  const totalFilteredProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalFilteredProducts / PAGE_SIZE);
  
  const currentPageProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, page]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory, selectedBrand, selectedModel, selectedPrice, sortBy]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    homepageCategories.forEach((cat) => {
      counts[cat] = allProducts.filter((p: any) => p.category === cat).length;
    });
    return counts;
  }, [allProducts]);

  // Get available models for selected brand
  const availableModels = useMemo(() => {
    if (!selectedBrand) return [];
    const brand = BRANDS.find(b => b.name === selectedBrand);
    return brand?.models || [];
  }, [selectedBrand]);

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => setSearchParams({}, { replace: true });

  const removeFilter = (filterType: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const params = new URLSearchParams(searchParams);
    params.delete(filterType);
    setSearchParams(params, { replace: true });
  };

  const removeBrandAndModel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const params = new URLSearchParams(searchParams);
    params.delete("brand");
    params.delete("model");
    setSearchParams(params, { replace: true });
  };

  const activeFilterCount = [selectedCategory, selectedBrand, selectedModel, selectedPrice, searchQuery].filter(Boolean).length;

  // Filter out categories with 0 products
  const activeCategories = homepageCategories.filter(cat => categoryCounts[cat] > 0);

  // Get display name for price range
  const getPriceRangeLabel = (priceIndex: string) => {
    const index = parseInt(priceIndex);
    return priceRanges[index]?.label || "";
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <TopBar />
        <Header />
        <main className="flex-1 container px-4 py-8">
          <div className="text-center py-16">
            <p className="text-red-500">Error loading products. Please try again.</p>
            <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      <Header />
      
      <main className="flex-1">
        <div className="container px-4 sm:px-6 py-4 sm:py-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4 flex-wrap">
            <a href="/" className="hover:text-primary transition-colors">Home</a>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">All Products</span>
            {selectedCategory && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">
                  {getDisplayCategoryName(selectedCategory)}
                </span>
              </>
            )}
            {selectedBrand && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">{selectedBrand}</span>
              </>
            )}
            {selectedModel && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">{selectedModel}</span>
              </>
            )}
          </nav>

          {/* Active Filters Bar */}
          {activeFilterCount > 0 && (
            <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <FilterX className="w-3 h-3" />
                  Active Filters:
                </span>
                {searchQuery && (
                  <FilterChip 
                    label={`Search: "${searchQuery}"`} 
                    onRemove={(e) => removeFilter("q", e)}
                  />
                )}
                {selectedCategory && (
                  <FilterChip 
                    label={`Category: ${getDisplayCategoryName(selectedCategory)}`} 
                    onRemove={(e) => removeFilter("category", e)}
                  />
                )}
                {selectedBrand && (
                  <FilterChip 
                    label={`Brand: ${selectedBrand}`} 
                    onRemove={removeBrandAndModel}
                  />
                )}
                {selectedModel && (
                  <FilterChip 
                    label={`Model: ${selectedModel}`} 
                    onRemove={(e) => removeFilter("model", e)}
                  />
                )}
                {selectedPrice && (
                  <FilterChip 
                    label={`Price: ${getPriceRangeLabel(selectedPrice)}`} 
                    onRemove={(e) => removeFilter("price", e)}
                  />
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="ml-auto text-destructive hover:text-destructive"
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-8">
            {/* Sidebar Filters */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-20 bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-4 bg-muted/30 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5" />
                      <h3 className="font-semibold">Filters</h3>
                    </div>
                    {activeFilterCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive text-xs">
                        Clear all
                      </Button>
                    )}
                  </div>
                </div>
                <ScrollArea className="h-full pr-2">
                  <div className="space-y-1 pb-20 p-4">
                    <FilterSectionWithCheckbox
                      title="Category"
                      isOpen={openSections.category}
                      toggle={() => toggleSection("category")}
                    >
                      {activeCategories.map(cat => (
                        <CheckboxFilterButton
                          key={cat}
                          label={getDisplayCategoryName(cat)}
                          count={categoryCounts[cat]}
                          checked={selectedCategory === cat}
                          onChange={() => setFilter("category", selectedCategory === cat ? "" : cat)}
                        />
                      ))}
                    </FilterSectionWithCheckbox>

                    <FilterSectionWithCheckbox
                      title="Brand"
                      isOpen={openSections.brand}
                      toggle={() => toggleSection("brand")}
                    >
                      <div className="space-y-1">
                        {BRANDS.map(brand => (
                          <CheckboxFilterButton
                            key={brand.name}
                            label={brand.name}
                            checked={selectedBrand === brand.name}
                            onChange={() => {
                              setFilter("brand", selectedBrand === brand.name ? "" : brand.name);
                              if (selectedBrand === brand.name) {
                                setFilter("model", "");
                              }
                            }}
                          />
                        ))}
                      </div>
                    </FilterSectionWithCheckbox>

                    {selectedBrand && availableModels.length > 0 && (
                      <FilterSectionWithCheckbox
                        title="Model"
                        isOpen={openSections.model}
                        toggle={() => toggleSection("model")}
                      >
                        <div className="space-y-1">
                          {availableModels.map(model => (
                            <CheckboxFilterButton
                              key={model}
                              label={model}
                              checked={selectedModel === model}
                              onChange={() => setFilter("model", selectedModel === model ? "" : model)}
                            />
                          ))}
                        </div>
                      </FilterSectionWithCheckbox>
                    )}

                    <FilterSectionWithCheckbox
                      title="Price Range"
                      isOpen={openSections.price}
                      toggle={() => toggleSection("price")}
                    >
                      <div className="space-y-1">
                        {priceRanges.map((range, i) => (
                          <CheckboxFilterButton
                            key={i}
                            label={range.label}
                            checked={selectedPrice === String(i)}
                            onChange={() => setFilter("price", selectedPrice === String(i) ? "" : String(i))}
                          />
                        ))}
                      </div>
                    </FilterSectionWithCheckbox>
                  </div>
                </ScrollArea>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">
                    {selectedCategory ? getDisplayCategoryName(selectedCategory) : "All Products"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Showing {currentPageProducts.length} of {totalFilteredProducts} products
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex bg-muted rounded-lg p-1">
                    <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="h-8 w-8 p-0">
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="h-8 w-8 p-0">
                      <List className="w-4 h-4" />
                    </Button>
                  </div>

                  <Select value={sortBy} onValueChange={(value: string) => setFilter("sort", value)}>
                    <option value="newest">✨ Newest</option>
                    <option value="price_asc">💰 Low to High</option>
                    <option value="price_desc">💰 High to Low</option>
                    <option value="name">📝 A-Z</option>
                  </Select>

                  <Button variant="outline" size="sm" onClick={() => setMobileFiltersOpen(true)} className="lg:hidden">
                    <SlidersHorizontal className="w-4 h-4" />
                    {activeFilterCount > 0 && (
                      <Badge className="ml-2">{activeFilterCount}</Badge>
                    )}
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className={cn("grid gap-4", viewMode === 'grid' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1")}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-80 rounded-lg" />
                  ))}
                </div>
              ) : currentPageProducts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <SlidersHorizontal className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-4">
                    {allProducts.length === 0 
                      ? "No products in the database yet. Add some products first!"
                      : "Try adjusting your filters or search term."}
                  </p>
                  <Button onClick={clearFilters}>Clear Filters</Button>
                </div>
              ) : (
                <>
                  <div className={cn("grid gap-4", viewMode === 'grid' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1")}>
                    {currentPageProducts.map((product, i) => (
                      viewMode === 'grid' ? (
                        <ProductCard
                          key={product.id}
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
                      ) : (
                        <ProductListItem key={product.id} product={product} index={i} />
                      )
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                      <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum = page;
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
                              onClick={() => setPage(pageNum)}
                              className="w-8 h-8"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Mobile Filter Modal */}
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
              transition={{ type: "spring", damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-[80vw] bg-card z-50 overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Filters</h3>
                  <button onClick={() => setMobileFiltersOpen(false)} className="p-2 hover:bg-muted rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive mt-2 w-full">
                    Clear All Filters
                  </Button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Category</h4>
                  <div className="space-y-1">
                    {activeCategories.map(cat => (
                      <CheckboxFilterButton
                        key={cat}
                        label={getDisplayCategoryName(cat)}
                        count={categoryCounts[cat]}
                        checked={selectedCategory === cat}
                        onChange={() => {
                          setFilter("category", selectedCategory === cat ? "" : cat);
                          setMobileFiltersOpen(false);
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Brand</h4>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {BRANDS.map(brand => (
                      <CheckboxFilterButton
                        key={brand.name}
                        label={brand.name}
                        checked={selectedBrand === brand.name}
                        onChange={() => {
                          setFilter("brand", selectedBrand === brand.name ? "" : brand.name);
                          setFilter("model", "");
                          setMobileFiltersOpen(false);
                        }}
                      />
                    ))}
                  </div>
                </div>

                {selectedBrand && availableModels.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Model</h4>
                    <div className="space-y-1">
                      {availableModels.map(model => (
                        <CheckboxFilterButton
                          key={model}
                          label={model}
                          checked={selectedModel === model}
                          onChange={() => {
                            setFilter("model", selectedModel === model ? "" : model);
                            setMobileFiltersOpen(false);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Price Range</h4>
                  <div className="space-y-1">
                    {priceRanges.map((range, i) => (
                      <CheckboxFilterButton
                        key={i}
                        label={range.label}
                        checked={selectedPrice === String(i)}
                        onChange={() => {
                          setFilter("price", selectedPrice === String(i) ? "" : String(i));
                          setMobileFiltersOpen(false);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Filter section component
const FilterSectionWithCheckbox = ({ title, isOpen, toggle, children }: any) => (
  <div className="border-b border-border last:border-0">
    <button onClick={toggle} className="flex items-center justify-between w-full py-3 text-sm font-semibold hover:text-primary transition-colors">
      <span>{title}</span>
      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
          <div className="pb-3 space-y-1">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// FIXED: Checkbox filter button with proper click handling
const CheckboxFilterButton = ({ label, count, checked, onChange }: any) => (
  <label
    className={cn(
      "flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg cursor-pointer transition-all",
      "hover:bg-muted/50",
      checked && "bg-primary/10 text-primary font-medium"
    )}
  >
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-2 border-border bg-background accent-primary cursor-pointer"
      />
      <span className="truncate">{label}</span>
    </div>
    {typeof count === "number" && count > 0 && <Badge>{count}</Badge>}
  </label>
);

// FIXED: Filter chip component with proper event handling
const FilterChip = ({ label, onRemove }: { label: string; onRemove: (e: React.MouseEvent) => void }) => (
  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
    {label}
    <button 
      onClick={onRemove}
      className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
      type="button"
    >
      <X className="w-3 h-3" />
    </button>
  </span>
);

export default ProductsPage;