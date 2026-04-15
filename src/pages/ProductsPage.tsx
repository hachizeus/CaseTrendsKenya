import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useProductsPaginated } from "@/hooks/queries";
import { categoryMatches, getDisplayCategoryName } from "@/lib/utils";
import { SlidersHorizontal, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const priceRanges = [
  { label: "Under KSh 5,000", min: 0, max: 5000 },
  { label: "KSh 5,000 - 15,000", min: 5000, max: 15000 },
  { label: "KSh 15,000 - 30,000", min: 15000, max: 30000 },
  { label: "KSh 30,000 - 60,000", min: 30000, max: 60000 },
  { label: "KSh 60,000 - 100,000", min: 60000, max: 100000 },
  { label: "Over KSh 100,000", min: 100000, max: Infinity },
];

const homepageCategories = [
  "All Accessories",
  "Phone Cases",
  "Wearables",
  "Audio & Earbuds",
  "Screen Protectors",
];

const colorOptions = ["Black", "White", "Blue", "Red", "Green", "Gold", "Silver", "Pink", "Purple"];

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const PAGE_SIZE = 12;

  // Fetch paginated products and categories
  const { data: paginatedData, isLoading, error } = useProductsPaginated(page, PAGE_SIZE);
  const paginated = paginatedData as any;

  const products = (paginated?.data as any[]) || [];
  const totalProducts = (paginated?.total as number) || 0;
  const totalPages = Math.ceil(totalProducts / PAGE_SIZE);

  // Filter state
  const selectedCategory = searchParams.get("category") || "";
  const selectedBrand = searchParams.get("brand") || "";
  const selectedModel = searchParams.get("model") || "";
  const selectedCompatibility = searchParams.get("compatibility") || "";
  const selectedColor = searchParams.get("color") || "";
  const selectedPrice = searchParams.get("price") || "";
  const searchQuery = searchParams.get("q") || "";
  const sortBy = searchParams.get("sort") || "newest";

  // Collapsible filter sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true, brand: true, model: true, compatibility: true, price: true, color: true,
  });

  const toggleSection = (key: string) => setOpenSections(s => ({ ...s, [key]: !s[key] }));

  // Derive unique brands from current products
  const brands = useMemo(() => {
    const set = new Set<string>(products.map((p: any) => p.brand).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  // Derive unique colors from current products
  const availableColors = useMemo(() => {
    const set = new Set<string>(products.map((p: any) => p.color).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  const splitModels = (value?: string) =>
    (value || "")
      .split(/[\r\n,]+/)
      .map(s => s.trim())
      .filter(Boolean);

  const availableModels = useMemo(() => {
    const filteredByBrand = selectedBrand ? products.filter((p: any) => p.brand === selectedBrand) : products;
    const models = new Set<string>();
    filteredByBrand.forEach((p: any) => splitModels(p.model).forEach(model => models.add(model)));
    return Array.from(models).sort();
  }, [products, selectedBrand]);

  const availableCompatibilities = useMemo(() => {
    const set = new Set<string>(products.map((p: any) => p.compatibility_type || "" ).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    homepageCategories.forEach(cat => {
      counts[cat] = products.filter((p: any) => cat === "All Accessories" ? true : categoryMatches(p, cat)).length;
    });
    return counts;
  }, [products]);

  const brandCounts = useMemo(() => {
    const counts = products.reduce((acc: Record<string, number>, product: any) => {
      if (product.brand) {
        acc[product.brand] = (acc[product.brand] || 0) + 1;
      }
      return acc;
    }, {});
    return counts;
  }, [products]);

  const modelCounts = useMemo(() => {
    const counts = products.reduce((acc: Record<string, number>, product: any) => {
      splitModels(product.model).forEach(model => {
        acc[model] = (acc[model] || 0) + 1;
      });
      return acc;
    }, {});
    return counts;
  }, [products]);

  const compatibilityCounts = useMemo(() => {
    const counts = products.reduce((acc: Record<string, number>, product: any) => {
      const compatibility = product.compatibility_type || "Other";
      acc[compatibility] = (acc[compatibility] || 0) + 1;
      return acc;
    }, {});
    return counts;
  }, [products]);

  // Apply client-side filters to paginated results
  const filtered = useMemo(() => {
    let result = [...products];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.brand.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) || 
        (p.model?.toLowerCase() || "").includes(q) || 
        (p.compatibility_type?.toLowerCase() || "").includes(q)
      );
    }
    if (selectedCategory && selectedCategory !== "All Accessories") result = result.filter(p => categoryMatches(p, selectedCategory));
    if (selectedBrand) result = result.filter(p => p.brand === selectedBrand);
    if (selectedModel) result = result.filter(p => splitModels(p.model).some(model => model.toLowerCase() === selectedModel.toLowerCase()));
    if (selectedCompatibility) result = result.filter(p => (p.compatibility_type || "").toLowerCase().includes(selectedCompatibility.toLowerCase()));
    if (selectedColor) result = result.filter(p => p.color === selectedColor);

    if (selectedPrice) {
      const range = priceRanges[Number(selectedPrice)];
      if (range) result = result.filter(p => Number(p.price) >= range.min && Number(p.price) < range.max);
    }

    // Sort
    switch (sortBy) {
      case "price_asc": result.sort((a, b) => a.price - b.price); break;
      case "price_desc": result.sort((a, b) => b.price - a.price); break;
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: break; // newest — already sorted by created_at desc
    }

    return result;
  }, [products, searchQuery, selectedCategory, selectedBrand, selectedColor, selectedPrice, sortBy]);

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => setSearchParams({}, { replace: true });

const activeFilterCount = [selectedCategory, selectedBrand, selectedModel, selectedCompatibility, selectedColor, selectedPrice].filter(Boolean).length;

  const FilterSidebar = () => (
    <div className="space-y-1">
      {/* Category */}
      <FilterSection title="Category" isOpen={openSections.category} toggle={() => toggleSection("category")}> 
        {homepageCategories.map(cat => (
          <FilterButton
            key={cat}
            label={cat}
            count={categoryCounts[cat]}
            active={selectedCategory === cat}
            onClick={() => setFilter("category", selectedCategory === cat ? "" : cat)}
          />
        ))}
      </FilterSection>

      {/* Brand */}
      <FilterSection title="Brand" isOpen={openSections.brand} toggle={() => toggleSection("brand")}>
        {brands.map(brand => (
          <FilterButton
            key={brand}
            label={brand}
            active={selectedBrand === brand}
            onClick={() => {
              if (selectedBrand === brand) {
                setFilter("brand", "");
                setFilter("model", "");
              } else {
                setFilter("brand", brand);
                setFilter("model", "");
              }
            }}
          />
        ))}
        {brands.length === 0 && <p className="text-xs text-muted-foreground px-3">No brands available</p>}
      </FilterSection>

      {availableModels.length > 0 && (
        <FilterSection title="Model" isOpen={openSections.model} toggle={() => toggleSection("model")}>
          {availableModels.map(model => (
            <FilterButton
              key={model}
              label={model}
              count={modelCounts[model] || 0}
              active={selectedModel === model}
              onClick={() => setFilter("model", selectedModel === model ? "" : model)}
            />
          ))}
        </FilterSection>
      )}

      {availableCompatibilities.length > 0 && (
        <FilterSection title="Compatibility" isOpen={openSections.compatibility} toggle={() => toggleSection("compatibility")}>
          {availableCompatibilities.map(compatibility => (
            <FilterButton
              key={compatibility}
              label={compatibility}
              count={compatibilityCounts[compatibility] || 0}
              active={selectedCompatibility === compatibility}
              onClick={() => setFilter("compatibility", selectedCompatibility === compatibility ? "" : compatibility)}
            />
          ))}
        </FilterSection>
      )}

      {/* Price */}
      <FilterSection title="Price Range" isOpen={openSections.price} toggle={() => toggleSection("price")}>
        {priceRanges.map((range, i) => (
          <FilterButton key={i} label={range.label} active={selectedPrice === String(i)} onClick={() => setFilter("price", selectedPrice === String(i) ? "" : String(i))} />
        ))}
      </FilterSection>

      {/* Color */}
      <FilterSection title="Color" isOpen={openSections.color} toggle={() => toggleSection("color")}>
        <div className="flex flex-wrap gap-2 px-3 py-1">
          {(availableColors.length > 0 ? availableColors : colorOptions).map(color => (
            <button
              key={color}
              onClick={() => setFilter("color", selectedColor === color ? "" : color)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                selectedColor === color ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary"
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </FilterSection>

      {activeFilterCount > 0 && (
        <button onClick={clearFilters} className="w-full mt-4 py-2 text-sm text-destructive hover:underline">
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <CategoryNav />
      <main className="flex-1">
        <div className="container py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <a href="/" className="hover:text-primary">Home</a>
            <span>/</span>
            <span className="text-foreground font-medium">All Products</span>
            {selectedCategory && (
              <>
                <span>/</span>
                <span className="text-foreground font-medium">{selectedCategory}</span>
              </>
            )}
          </div>

          <div className="flex gap-6">
            {/* Desktop sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-20 bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    <h3 className="font-bold text-sm">Filters</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeFilterCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">{activeFilterCount}</span>
                    )}
                    {activeFilterCount > 0 && (
                      <button onClick={clearFilters} className="text-xs text-destructive hover:underline">Clear All</button>
                    )}
                  </div>
                </div>
                <FilterSidebar />
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Top bar */}
              <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <div>
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold">
                    {selectedCategory && selectedCategory !== "All Accessories" ? selectedCategory : "All Products"}
                  </h1>
                  <p className="text-sm text-muted-foreground">{filtered.length} products found</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileFiltersOpen(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium"
                  >
                    <SlidersHorizontal className="w-4 h-4" /> Filters
                    {activeFilterCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
                    )}
                  </button>
                  <select
                    value={sortBy}
                    onChange={e => setFilter("sort", e.target.value)}
                    className="px-3 py-2 bg-card border border-border rounded-lg text-sm"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name">Name A-Z</option>
                  </select>
                </div>
              </div>

              {/* Active filter tags */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedCategory && selectedCategory !== "All Accessories" && <FilterTag label={`Category: ${selectedCategory}`} onRemove={() => setFilter("category", "")} />}
                  {selectedBrand && <FilterTag label={`Brand: ${selectedBrand}`} onRemove={() => setFilter("brand", "")} />}
                  {selectedModel && <FilterTag label={`Model: ${selectedModel}`} onRemove={() => setFilter("model", "")} />}
                  {selectedCompatibility && <FilterTag label={`Compatibility: ${selectedCompatibility}`} onRemove={() => setFilter("compatibility", "")} />}
                  {selectedPrice && <FilterTag label={priceRanges[Number(selectedPrice)]?.label || ""} onRemove={() => setFilter("price", "")} />}
                  {selectedColor && <FilterTag label={`Color: ${selectedColor}`} onRemove={() => setFilter("color", "")} />}
                </div>
              )}

              {/* Product grid */}
              {error ? (
                <div className="text-center py-16">
                  <p className="text-lg font-medium text-destructive">Failed to load products</p>
                  <p className="text-sm text-muted-foreground mb-4">{error instanceof Error ? error.message : "Please try again later"}</p>
                  <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
              ) : isLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <div key={i} className="bg-card rounded-lg border border-border animate-pulse">
                      <div className="aspect-square bg-secondary" />
                      <div className="p-4 space-y-2">
                        <div className="h-3 bg-secondary rounded w-1/2" />
                        <div className="h-4 bg-secondary rounded" />
                        <div className="h-4 bg-secondary rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-lg font-medium text-muted-foreground">No products match your filters</p>
                  <button onClick={clearFilters} className="mt-3 text-primary hover:underline text-sm">Clear all filters</button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((product, i) => (
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
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        const pageNum = page > 3 ? page + i - 2 : i + 1;
                        if (pageNum > totalPages) return null;
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => { setPage(pageNum); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
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

      {/* Mobile filters drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/50 z-50 lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-card z-50 overflow-y-auto p-4 lg:hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Filters</h3>
                <button onClick={() => setMobileFiltersOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <FilterSidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-components
const FilterSection = ({ title, isOpen, toggle, children }: { title: string; isOpen: boolean; toggle: () => void; children: React.ReactNode }) => (
  <div className="border-b border-border last:border-0">
    <button onClick={toggle} className="flex items-center justify-between w-full py-3 px-1 text-sm font-semibold hover:text-primary transition-colors">
      {title}
      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
          <div className="pb-3">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const FilterButton = ({ label, count, active, onClick }: { label: string; count?: number; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`block w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
      active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
    }`}
  >
    <div className="flex items-center justify-between gap-2">
      <span>{label}</span>
      {typeof count === "number" && <span className="text-[11px] text-muted-foreground">{count}</span>}
    </div>
  </button>
);

const FilterTag = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
    {label}
    <button onClick={onRemove}><X className="w-3 h-3" /></button>
  </span>
);

export default ProductsPage;
