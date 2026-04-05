import { Minus, Plus, Trash2, X, ShoppingBag, Scale } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CartDrawer = () => {
  const { items, removeFromCart, updateQuantity, totalItems, totalPrice, isOpen, setIsOpen, setShowComparison, setComparisonProducts } = useCart();
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());
  const [comparingLoading, setComparingLoading] = useState(false);
  const navigate = useNavigate();

  const toggleCompareSelection = (productId: string) => {
    const newSelected = new Set(selectedForCompare);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else if (newSelected.size < 3) {
      newSelected.add(productId);
    }
    setSelectedForCompare(newSelected);
  };

  const handleCompare = async () => {
    if (selectedForCompare.size === 0) return;
    
    setComparingLoading(true);
    try {
      const productIds = Array.from(selectedForCompare);
      const promises = productIds.map(id =>
        supabase
          .from("products")
          .select("id, name, price, original_price, brand, category, stock_status, stock_quantity, description, product_images(image_url, is_primary), product_specifications(spec_key, spec_value, display_order), product_colors(color, display_order)")
          .eq("id", id)
          .single()
      );

      const results = await Promise.all(promises);
      const products = results
        .map(r => r.data)
        .filter((p): p is any => p !== null);

      if (products.length === 0) {
        throw new Error("No products found");
      }

      setComparisonProducts(products);
      setShowComparison(true);
      setIsOpen(false);
      setSelectedForCompare(new Set());
    } catch (error) {
      console.error("Error fetching products for comparison:", error);
      toast.error("Failed to load comparison data");
    } finally {
      setComparingLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:w-5/6 md:max-w-md lg:max-w-lg flex flex-col h-screen p-0">
        <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Cart ({totalItems})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
            <div className="text-center">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsOpen(false)}>Continue Shopping</Button>
            </div>
          </div>
        ) : (
          <>
            {selectedForCompare.size > 0 && (
              <div className="px-4 sm:px-6 py-2 bg-primary/10 border-b border-primary text-sm text-primary font-medium">
                Select up to 3 items to compare ({selectedForCompare.size}/3)
              </div>
            )}
            <div className="flex-1 overflow-y-auto py-3 sm:py-4 px-4 sm:px-6">
              <div className="space-y-3">
                <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.product_id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg transition-colors ${
                      selectedForCompare.has(item.product_id)
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-secondary"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedForCompare.has(item.product_id)}
                      onChange={() => toggleCompareSelection(item.product_id)}
                      disabled={selectedForCompare.size >= 3 && !selectedForCompare.has(item.product_id)}
                      className="mt-2 sm:mt-2.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <img src={item.image} alt={item.name} className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded bg-background flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium line-clamp-1">{item.name}</p>
                      <p className="text-xs sm:text-sm font-bold text-primary mt-1">KSh {item.price.toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button 
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)} 
                          className="p-1 rounded bg-background hover:bg-muted"
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center" aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)} 
                          className="p-1 rounded bg-background hover:bg-muted"
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.product_id)} 
                      className="text-muted-foreground hover:text-destructive self-start mt-1 sm:mt-2"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              </div>
            </div>

            <div className="sticky bottom-0 border-t bg-card px-4 sm:px-6 py-4 space-y-3 z-10">
              <div className="flex justify-between text-base sm:text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">KSh {totalPrice.toLocaleString()}</span>
              </div>
              {selectedForCompare.size > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={handleCompare}
                  disabled={comparingLoading}
                >
                  {comparingLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Scale className="w-4 h-4 mr-2" />
                      Compare ({selectedForCompare.size})
                    </>
                  )}
                </Button>
              )}
              <Button className="w-full" size="lg" onClick={() => { setIsOpen(false); navigate("/checkout"); }}>
                Proceed to Checkout
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
