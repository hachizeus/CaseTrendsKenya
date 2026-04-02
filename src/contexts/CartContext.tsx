import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
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
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: { id: string; name: string; price: number; image: string }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "techmobile-cart";

const getLocalCart = (): CartItem[] => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
  } catch { return []; }
};

const setLocalCart = (items: CartItem[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [dbCartId, setDbCartId] = useState<string | null>(null);

  // Load cart
  useEffect(() => {
    if (user) {
      loadDbCart();
    } else {
      setItems(getLocalCart());
      setDbCartId(null);
    }
  }, [user]);

  const loadDbCart = async () => {
    if (!user) return;
    // Get or create cart
    let { data: cart } = await supabase.from("carts").select("id").eq("user_id", user.id).single();
    if (!cart) {
      const { data: newCart } = await supabase.from("carts").insert({ user_id: user.id }).select("id").single();
      cart = newCart;
    }
    if (!cart) return;
    setDbCartId(cart.id);

    // Get cart items with product info
    const { data: cartItems } = await supabase
      .from("cart_items")
      .select("id, product_id, quantity, products(name, price, product_images(image_url, is_primary))")
      .eq("cart_id", cart.id);

    if (cartItems) {
      const mapped: CartItem[] = cartItems.map((ci: any) => ({
        id: ci.id,
        product_id: ci.product_id,
        name: ci.products?.name || "",
        price: ci.products?.price || 0,
        image: ci.products?.product_images?.find((img: any) => img.is_primary)?.image_url || ci.products?.product_images?.[0]?.image_url || "",
        quantity: ci.quantity,
      }));
      setItems(mapped);
    }

    // Merge local cart if any
    const localItems = getLocalCart();
    if (localItems.length > 0) {
      for (const li of localItems) {
        const existing = cartItems?.find((ci: any) => ci.product_id === li.product_id);
        if (!existing) {
          await supabase.from("cart_items").insert({ cart_id: cart.id, product_id: li.product_id, quantity: li.quantity });
        }
      }
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      loadDbCart(); // reload
    }
  };

  const addToCart = useCallback(async (product: { id: string; name: string; price: number; image: string }) => {
    if (user && dbCartId) {
      const existing = items.find(i => i.product_id === product.id);
      if (existing) {
        await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
      } else {
        await supabase.from("cart_items").insert({ cart_id: dbCartId, product_id: product.id, quantity: 1 });
      }
      loadDbCart();
    } else {
      setItems(prev => {
        const existing = prev.find(i => i.product_id === product.id);
        let next: CartItem[];
        if (existing) {
          next = prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
        } else {
          next = [...prev, { id: crypto.randomUUID(), product_id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 }];
        }
        setLocalCart(next);
        return next;
      });
    }
    toast.success("Added to cart!");
    setIsOpen(true);
  }, [user, dbCartId, items]);

  const removeFromCart = useCallback(async (productId: string) => {
    if (user && dbCartId) {
      const item = items.find(i => i.product_id === productId);
      if (item) await supabase.from("cart_items").delete().eq("id", item.id);
      loadDbCart();
    } else {
      setItems(prev => {
        const next = prev.filter(i => i.product_id !== productId);
        setLocalCart(next);
        return next;
      });
    }
  }, [user, dbCartId, items]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(productId);
    if (user && dbCartId) {
      const item = items.find(i => i.product_id === productId);
      if (item) await supabase.from("cart_items").update({ quantity }).eq("id", item.id);
      loadDbCart();
    } else {
      setItems(prev => {
        const next = prev.map(i => i.product_id === productId ? { ...i, quantity } : i);
        setLocalCart(next);
        return next;
      });
    }
  }, [user, dbCartId, items]);

  const clearCart = useCallback(async () => {
    if (user && dbCartId) {
      await supabase.from("cart_items").delete().eq("cart_id", dbCartId);
      loadDbCart();
    } else {
      setItems([]);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [user, dbCartId]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
