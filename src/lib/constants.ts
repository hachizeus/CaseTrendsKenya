// API configuration
const envApiUrl = import.meta.env.VITE_API_URL;
const isLocalApiUrl = typeof envApiUrl === "string" && /(localhost|127\.0\.0\.1)/.test(envApiUrl);
export const API_URL =
  envApiUrl && (!import.meta.env.PROD || !isLocalApiUrl)
    ? envApiUrl
    : (typeof window !== "undefined" ? window.location.origin : "");
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
export const ADMIN_NOTIFICATION_EMAIL = import.meta.env.VITE_ADMIN_NOTIFICATION_EMAIL || "info@casetrendskenya.co.ke";
export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "";


// WhatsApp configuration
export const WHATSAPP_NUMBER = "254141039509";

// Pagination config
export const PRODUCTS_PER_PAGE = 12;

// Cache times (in milliseconds)
export const CACHE_TIMES = {
  PRODUCTS: 10 * 60 * 1000,      // 10 minutes
  CATEGORIES: 30 * 60 * 1000,    // 30 minutes
  REVIEWS: 5 * 60 * 1000,        // 5 minutes
  FAVORITES: 5 * 60 * 1000,      // 5 minutes
};

// Stock status options
export const STOCK_STATUS = {
  IN_STOCK: "in_stock",
  LOW_STOCK: "low_stock",
  OUT_OF_STOCK: "out_of_stock",
} as const;

// Order statuses
export const ORDER_STATUSES = ["pending", "confirmed", "processing", "delivered", "cancelled"] as const;
