import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchSuggestion {
  id: string;
  name: string;
  price: number;
  brand: string;
  image: string;
  category: string;
}

interface SearchDropdownProps {
  query: string;
  onSuggestionSelect: (name: string) => void;
  isOpen: boolean;
}

const SearchDropdown = ({ query, onSuggestionSelect, isOpen }: SearchDropdownProps) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim() || !isOpen) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    const searchTerm = query.toLowerCase();

    supabase
      .from("products")
      .select("id, name, price, brand, category, product_images(image_url, is_primary)")
      .or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      .limit(8)
      .then(({ data, error }) => {
        if (error) {
          console.error("Search error:", error);
          setSuggestions([]);
        } else {
          const formatted = (data || []).map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            brand: p.brand,
            category: p.category,
            image: (p.product_images as any[])?.find(img => img.is_primary)?.image_url || 
                   (p.product_images as any[])?.[0]?.image_url || 
                   "/placeholder.svg",
          }));
          setSuggestions(formatted);
        }
        setLoading(false);
      });
  }, [query, isOpen]);

  if (!isOpen || !query.trim()) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
      >
        {loading ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            <div className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : suggestions.length > 0 ? (
          <div className="divide-y divide-border">
            {suggestions.map(product => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                onClick={() => onSuggestionSelect(product.name)}
                className="flex gap-3 p-3 hover:bg-secondary transition-colors"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-12 h-12 object-contain rounded bg-background flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.brand}</p>
                  <p className="text-sm font-bold text-primary mt-1">KSh {product.price.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No products found</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SearchDropdown;
