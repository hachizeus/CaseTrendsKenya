import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

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

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4 overflow-hidden"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card rounded-xl border border-border w-full h-screen md:h-auto md:max-w-6xl md:max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border p-3 md:p-6 flex items-center justify-between z-10 gap-4">
              <div className="min-w-0">
                <h2 className="text-lg md:text-2xl font-bold truncate">Compare Products</h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
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

            {/* Content - Responsive layout: Stack on mobile, row on desktop */}
            <div className="flex-1 flex flex-col md:flex-row gap-3 md:gap-4 px-3 md:px-6 py-3 md:py-4 min-h-0 overflow-y-auto md:overflow-hidden">
                {products.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex-1 flex flex-col border border-border rounded-lg bg-secondary/30 min-h-0 overflow-hidden"
                  >
                    {/* Scrollable content area */}
                    <div className="overflow-y-auto flex-1 min-h-0">
                      <div className="p-3 md:p-4 space-y-3 md:space-y-4">
                        {/* Image */}
                        <div className="bg-background rounded-lg p-2 md:p-3 h-32 md:h-48 flex items-center justify-center">
                          <img
                            src={getPrimaryImage(product)}
                            alt={product.name}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        {/* Product Name */}
                        <div>
                          <h3 className="font-bold text-xs md:text-sm line-clamp-2">{product.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{product.brand}</p>
                        </div>

                        {/* Price */}
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-base md:text-lg font-bold text-primary">
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
                          <div className="bg-background/50 p-2 md:p-3 rounded-lg border border-border/50">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Description</p>
                            <p className="text-xs leading-relaxed text-foreground line-clamp-4">
                              {product.description}
                            </p>
                          </div>
                        )}

                        {/* Specifications */}
                        {product.product_specifications && product.product_specifications.length > 0 && (
                          <div className="bg-background/50 p-2 md:p-3 rounded-lg border border-border/50">
                            <p className="text-xs font-semibold text-muted-foreground mb-2 md:mb-3">Specs</p>
                            <div className="space-y-2">
                              {product.product_specifications.slice(0, 5).map((spec, i) => (
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
                          <div className="bg-background/50 p-2 md:p-3 rounded-lg border border-border/50">
                            <p className="text-xs font-semibold text-muted-foreground mb-2 md:mb-3">Colors</p>
                            <div className="flex flex-wrap gap-2 md:gap-3">
                              {product.product_colors.slice(0, 6).map((color, i) => (
                                <div key={i} className="flex flex-col items-center gap-1">
                                  <div
                                    className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-border shadow-md"
                                    style={{
                                      backgroundColor: color.color.toLowerCase() === 'multicolor' ? '#e5e7eb' : color.color.toLowerCase(),
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
            <div className="border-t border-border bg-secondary/50 p-3 md:p-6">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 md:py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold text-sm md:text-base"
              >
                Done Comparing
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProductComparisonModal;
