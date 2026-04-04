// API configuration
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// WhatsApp configuration
export const WHATSAPP_NUMBER = "254759001048";

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
