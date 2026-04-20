import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color?: string;
}

export interface ComparisonProduct {
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

interface CartContextType {
  items: CartItem[];
  addToCart: (product: { id: string; name: string; price: number; image: string; brand: string; category: string; stock_status: string; original_price?: number; stock_quantity?: number; color?: string }) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  showComparison: boolean;
  setShowComparison: (show: boolean) => void;
  comparisonProducts: ComparisonProduct[];
  setComparisonProducts: (products: ComparisonProduct[]) => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "casetrends-cart";

const getLocalCart = (): CartItem[] => {
  try { return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]"); }
  catch { return []; }
};
const setLocalCart = (items: CartItem[]) =>
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonProducts, setComparisonProducts] = useState<ComparisonProduct[]>([]);
  const [dbCartId, setDbCartId] = useState<string | null>(null);
  // Use a ref so loadDbCart always reads the latest user/dbCartId without being in deps
  const userRef = useRef(user);
  const dbCartIdRef = useRef(dbCartId);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { dbCartIdRef.current = dbCartId; }, [dbCartId]);

  const loadDbCart = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;

    let { data: cart } = await supabase
      .from("carts").select("id").eq("user_id", currentUser.id).maybeSingle();
    if (!cart) {
      const { data: newCart } = await supabase
        .from("carts").insert({ user_id: currentUser.id }).select("id").single();
      cart = newCart;
    }
    if (!cart) return;
    setDbCartId(cart.id);

    const { data: cartItems } = await supabase
      .from("cart_items")
      .select("id, product_id, quantity, color, products(name, price, product_images(image_url, is_primary))")
      .eq("cart_id", cart.id);

    const mapped: CartItem[] = (cartItems || []).map((ci: any) => ({
      id: ci.id,
      product_id: ci.product_id,
      name: ci.products?.name || "",
      price: ci.products?.price || 0,
      image: ci.products?.product_images?.find((img: any) => img.is_primary)?.image_url
        || ci.products?.product_images?.[0]?.image_url || "",
      quantity: ci.quantity,
      color: ci.color || undefined,
    }));
    setItems(mapped);

    // Merge local cart on first load
    const localItems = getLocalCart();
    if (localItems.length > 0) {
      const mergePromises = localItems
        .filter(li => !(cartItems || []).find((ci: any) => ci.product_id === li.product_id && (ci.color || "") === (li.color || "")))
        .map(li => supabase.from("cart_items").insert({
          cart_id: cart!.id,
          product_id: li.product_id,
          quantity: li.quantity,
          color: li.color || "",
        }));
      await Promise.all(mergePromises);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      // Reload after merge
      const { data: merged } = await supabase
        .from("cart_items")
        .select("id, product_id, quantity, color, products(name, price, product_images(image_url, is_primary))")
        .eq("cart_id", cart.id);
      setItems((merged || []).map((ci: any) => ({
        id: ci.id,
        product_id: ci.product_id,
        name: ci.products?.name || "",
        price: ci.products?.price || 0,
        image: ci.products?.product_images?.find((img: any) => img.is_primary)?.image_url
          || ci.products?.product_images?.[0]?.image_url || "",
        quantity: ci.quantity,
        color: ci.color || undefined,
      })));
    }
  }, []); // stable — reads user via ref

  useEffect(() => {
    if (user) {
      loadDbCart();
    } else {
      setItems(getLocalCart());
      setDbCartId(null);
    }
  }, [user, loadDbCart]);

  const addToCart = useCallback(async (product: { id: string; name: string; price: number; image: string; brand: string; category: string; stock_status: string; original_price?: number; stock_quantity?: number; color?: string }) => {
    const currentUser = userRef.current;
    const currentCartId = dbCartIdRef.current;

    const productColor = product.color || "";
    if (currentUser && currentCartId) {
      const existing = items.find(i => i.product_id === product.id && (i.color || "") === productColor);
      if (existing) {
        await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
      } else {
        await supabase.from("cart_items").insert({
          cart_id: currentCartId,
          product_id: product.id,
          quantity: 1,
          color: productColor,
        });
      }
      await loadDbCart();
    } else {
      setItems(prev => {
        const existing = prev.find(i => i.product_id === product.id && (i.color || "") === productColor);
        const next = existing
          ? prev.map(i => i.product_id === product.id && (i.color || "") === productColor ? { ...i, quantity: i.quantity + 1 } : i)
          : [...prev, { id: crypto.randomUUID(), product_id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1, color: productColor || undefined }];
        setLocalCart(next);
        return next;
      });
    }
    
    toast.success("Added to cart!");
  }, [items, loadDbCart]);

  const removeFromCart = useCallback(async (productId: string) => {
    const currentUser = userRef.current;
    const currentCartId = dbCartIdRef.current;

    if (currentUser && currentCartId) {
      const item = items.find(i => i.product_id === productId);
      if (item) await supabase.from("cart_items").delete().eq("id", item.id);
      await loadDbCart();
    } else {
      setItems(prev => {
        const next = prev.filter(i => i.product_id !== productId);
        setLocalCart(next);
        return next;
      });
    }
  }, [items, loadDbCart]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(productId);
    const currentUser = userRef.current;
    const currentCartId = dbCartIdRef.current;

    if (currentUser && currentCartId) {
      const item = items.find(i => i.product_id === productId);
      if (item) await supabase.from("cart_items").update({ quantity }).eq("id", item.id);
      await loadDbCart();
    } else {
      setItems(prev => {
        const next = prev.map(i => i.product_id === productId ? { ...i, quantity } : i);
        setLocalCart(next);
        return next;
      });
    }
  }, [items, loadDbCart, removeFromCart]);

  const clearCart = useCallback(async () => {
    const currentUser = userRef.current;
    const currentCartId = dbCartIdRef.current;

    if (currentUser && currentCartId) {
      await supabase.from("cart_items").delete().eq("cart_id", currentCartId);
      setItems([]);
    } else {
      setItems([]);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, isOpen, setIsOpen, showComparison, setShowComparison, comparisonProducts, setComparisonProducts }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
