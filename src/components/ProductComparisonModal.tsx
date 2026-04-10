import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

interface ComparisonProduct {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  brand: string;
  category: string;
  stock_status: string;
  stock_quantity?: number;
  description?: string;
  product_images?: Array<{ image_url: string; is_primary: boolean }>;
  product_specifications?: Array<{ spec_key: string; spec_value: string; display_order: number }>;
  product_colors?: Array<{ color: string; display_order: number }>;
}

interface ProductComparisonModalProps {
  isOpen: boolean;
  products: ComparisonProduct[];
  onClose: () => void;
}

const ProductComparisonModal = ({ isOpen, products, onClose }: ProductComparisonModalProps) => {
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const { isOpen: cartOpen } = useCart();

  // Close compare modal when cart drawer opens on mobile
  useEffect(() => {
    if (cartOpen && isMobile && isOpen) {
      onClose();
    }
  }, [cartOpen, isMobile, isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  // Track mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleProductExpanded = (productId: string) => {
    // Only one accordion can be open at a time
    if (expandedProducts.has(productId)) {
      // Close the currently open accordion
      setExpandedProducts(new Set());
    } else {
      // Close any open accordion and open the clicked one
      setExpandedProducts(new Set([productId]));
    }
  };

  const getPrimaryImage = (product: ComparisonProduct) => {
    if (!product.product_images) return "/placeholder.svg";
    return (
      product.product_images.find((img) => img.is_primary)?.image_url ||
      product.product_images[0]?.image_url ||
      "/placeholder.svg"
    );
  };

  const discount = (product: ComparisonProduct) => {
    if (!product.original_price) return 0;
    return Math.round(
      ((product.original_price - product.price) / product.original_price) * 100
    );
  };

  const stockStatusColor = (status: string) => {
    switch (status) {
      case "in_stock":
        return "bg-green-100 text-green-700";
      case "low_stock":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-red-100 text-red-600";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && products.length > 0 && (
        // Mobile: Accordion interface
        isMobile ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end lg:items-center justify-center overflow-hidden p-2 sm:p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ translateY: "100%" }}
              animate={{ translateY: 0 }}
              exit={{ translateY: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="bg-card rounded-t-2xl w-full h-[75vh] flex flex-col overflow-hidden sm:rounded-xl sm:max-w-2xl lg:max-w-4xl sm:h-auto sm:max-h-[93vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-card border-b border-border p-2 sm:p-3 flex items-center justify-between z-10 gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm sm:text-base lg:text-lg font-bold truncate">Compare Products</h2>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{products.length} product{products.length !== 1 ? "s" : ""}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 sm:p-2 hover:bg-secondary rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-4 sm:w-5 h-4 sm:h-5" />
                </button>
              </div>

              {/* Accordion Content */}
              <div className="flex-1 overflow-y-auto space-y-1.5 sm:space-y-2 p-2 sm:p-3">
                {products.map((product) => (
                  <div key={product.id} className="border border-border rounded-lg overflow-hidden bg-secondary/30">
                    {/* Accordion Header (always visible) */}
                    <button
                      onClick={() => toggleProductExpanded(product.id)}
                      className="w-full flex items-start gap-1.5 sm:gap-2 p-2 sm:p-3 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex-shrink-0 bg-background rounded-lg flex items-center justify-center overflow-hidden">
                        <img
                          src={getPrimaryImage(product)}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[11px] sm:text-xs lg:text-sm line-clamp-2">{product.name}</h3>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{product.brand}</p>
                        <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1 sm:mt-1.5">
                          <span className="text-[10px] sm:text-xs lg:text-sm font-bold text-primary">
                            KSh {product.price.toLocaleString()}
                          </span>
                          {product.original_price && (
                            <span className="text-[9px] sm:text-xs text-muted-foreground line-through">
                              KSh {product.original_price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0 transition-transform ${
                          expandedProducts.has(product.id) ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Accordion Content (expands when clicked) */}
                    <AnimatePresence>
                      {expandedProducts.has(product.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border overflow-hidden"
                        >
                          <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2 bg-background/50">
                            {/* Stock Status */}
                            <div>
                              <span
                                className={`inline-block text-xs font-semibold px-2 py-1 rounded ${stockStatusColor(
                                  product.stock_status
                                )}`}
                              >
                                {product.stock_status === "in_stock"
                                  ? "In Stock"
                                  : product.stock_status === "low_stock"
                                  ? "Low Stock"
                                  : "Sold Out"}
                              </span>
                              {product.stock_quantity && product.stock_quantity > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">{product.stock_quantity} available</p>
                              )}
                            </div>

                            {/* Description */}
                            {product.description && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-1">Description</p>
                                <p className="text-xs leading-relaxed text-foreground">{product.description}</p>
                              </div>
                            )}

                            {/* Specifications */}
                            {product.product_specifications && product.product_specifications.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2">Specifications</p>
                                <div className="space-y-2">
                                  {product.product_specifications.slice(0, 8).map((spec, i) => (
                                    <div key={i} className="flex items-start gap-2 pb-2 border-b border-border/30 last:border-b-0 last:pb-0">
                                      <span className="font-semibold text-xs text-primary min-w-fit">{spec.spec_key}</span>
                                      <span className="text-xs text-foreground">{spec.spec_value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Colors */}
                            {product.product_colors && product.product_colors.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2">Colors</p>
                                <div className="flex flex-wrap gap-2">
                                  {product.product_colors.slice(0, 8).map((color, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                      <div
                                        className="w-6 h-6 rounded-full border-2 border-border shadow-md"
                                        style={{
                                          backgroundColor:
                                            color.color.toLowerCase() === "multicolor" ? "#e5e7eb" : color.color.toLowerCase(),
                                        }}
                                        title={color.color}
                                      />
                                      <span className="text-xs text-muted-foreground text-center">{color.color}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-border bg-secondary/50 p-2 sm:p-3">
                <button
                  onClick={onClose}
                  className="w-full px-4 py-1.5 sm:py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold text-xs sm:text-sm"
                >
                  Done Comparing
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          // Desktop: Modal interface
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4 overflow-hidden pt-[100px]"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`bg-card rounded-xl border border-border w-full flex flex-col overflow-hidden mt-[60px] ${
                windowWidth < 1536 ? "max-h-[85vh] max-w-5xl" : "max-h-[82vh] max-w-7xl"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-card border-b border-border p-3 sm:p-4 lg:p-6 flex items-center justify-between z-10 gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">Compare Products</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {products.length} product{products.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-row gap-2 sm:gap-3 lg:gap-4 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 min-h-0 overflow-y-auto scrollbar-hide">
                {products.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex-1 flex flex-col border border-border rounded-lg bg-secondary/30 min-h-0 overflow-hidden"
                  >
                    {/* Scrollable content area */}
                    <div className="overflow-y-auto flex-1 min-h-0 scrollbar-hide">
                      <div className="p-2 sm:p-3 lg:p-4 space-y-2 sm:space-y-3 lg:space-y-4">
                        {/* Image */}
                        <div className="bg-background rounded-lg p-1.5 sm:p-2 lg:p-3 h-32 sm:h-40 lg:h-48 flex items-center justify-center">
                          <img
                            src={getPrimaryImage(product)}
                            alt={product.name}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        {/* Product Name */}
                        <div>
                          <h3 className="font-bold text-xs sm:text-sm lg:text-base line-clamp-2">{product.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5 lg:mt-1">{product.brand}</p>
                        </div>

                        {/* Price */}
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm sm:text-base lg:text-lg font-bold text-primary">
                              KSh {product.price.toLocaleString()}
                            </span>
                            {product.original_price && (
                              <span className="text-xs text-muted-foreground line-through">
                                KSh {product.original_price.toLocaleString()}
                              </span>
                            )}
                          </div>
                          {discount(product) > 0 && (
                            <span className="inline-block bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">
                              -{discount(product)}%
                            </span>
                          )}
                        </div>

                        {/* Stock Status */}
                        <div>
                          <span
                            className={`inline-block text-xs font-semibold px-2 py-1 rounded ${stockStatusColor(
                              product.stock_status
                            )}`}
                          >
                            {product.stock_status === "in_stock"
                              ? "In Stock"
                              : product.stock_status === "low_stock"
                              ? "Low Stock"
                              : "Sold Out"}
                          </span>
                          {product.stock_quantity && product.stock_quantity > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {product.stock_quantity} available
                            </p>
                          )}
                        </div>

                        {/* Description */}
                        {product.description && (
                          <div className="bg-background/50 p-1.5 sm:p-2 lg:p-3 rounded-lg border border-border/50">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Description</p>
                            <p className="text-xs leading-relaxed text-foreground line-clamp-4">
                              {product.description}
                            </p>
                          </div>
                        )}

                        {/* Specifications */}
                        {product.product_specifications && product.product_specifications.length > 0 && (
                          <div className="bg-background/50 p-1.5 sm:p-2 lg:p-3 rounded-lg border border-border/50">
                            <p className="text-xs font-semibold text-muted-foreground mb-2 lg:mb-3">Specs</p>
                            <div className="space-y-2">
                              {product.product_specifications.map((spec, i) => (
                                <div key={i} className="flex items-start gap-2 pb-2 border-b border-border/30 last:border-b-0 last:pb-0">
                                  <span className="font-semibold text-xs text-primary min-w-fit">{spec.spec_key}</span>
                                  <span className="text-xs text-foreground break-words">{spec.spec_value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Colors */}
                        {product.product_colors && product.product_colors.length > 0 && (
                          <div className="bg-background/50 p-1.5 sm:p-2 lg:p-3 rounded-lg border border-border/50">
                            <p className="text-xs font-semibold text-muted-foreground mb-2 lg:mb-3">Colors</p>
                            <div className="flex flex-wrap gap-2 lg:gap-3">
                              {product.product_colors.map((color, i) => (
                                <div key={i} className="flex flex-col items-center gap-1">
                                  <div
                                    className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 rounded-full border-2 border-border shadow-md"
                                    style={{
                                      backgroundColor: color.color.toLowerCase() === "multicolor" ? "#e5e7eb" : color.color.toLowerCase(),
                                    }}
                                    title={color.color}
                                  />
                                  <span className="text-xs text-muted-foreground text-center max-w-[50px] truncate">{color.color}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-border bg-secondary/50 p-3 sm:p-4 lg:p-6">
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold text-xs sm:text-sm lg:text-base"
                >
                  Done Comparing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )
      )}
    </AnimatePresence>
  );
};

export default ProductComparisonModal;
