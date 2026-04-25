export type CategoryDefinition = {
  name: string;
  slug: string;
  icon: string;
  displayOrder: number;
  image?: string;
};

export type SubcategoryDefinition = {
  name: string;
  slug: string;
  categorySlug: string;
  displayOrder: number;
};

export const MAIN_CATEGORIES: CategoryDefinition[] = [
  { name: "Protectors", slug: "protectors", icon: "Shield", displayOrder: 0, image: "/Iphonescreenprotectors.webp" },
  { name: "Phone Cases", slug: "phone-cases", icon: "Smartphone", displayOrder: 1, image: "/covers.webp" },
  { name: "Android Phones (Protectors)", slug: "android-phones", icon: "Smartphone", displayOrder: 2, image: "/androidscreenprotector.webp" },
  { name: "iPhone Model (Protectors)", slug: "iphone-model", icon: "Smartphone", displayOrder: 3, image: "/Iphonescreenprotectors.webp" },
  { name: "Audio", slug: "audio", icon: "Headphones", displayOrder: 4, image: "/Audio.webp" },
  { name: "Smart Watch", slug: "smart-watch", icon: "Watch", displayOrder: 5, image: "/smartwatch.webp" },
  { name: "Charging Devices", slug: "charging-devices", icon: "Cable", displayOrder: 6, image: "/charging-devices.webp" },
  { name: "Power Banks", slug: "power-banks", icon: "Battery", displayOrder: 7, image: "/powerbanks.webp" },
  { name: "Camera Lens Protectors", slug: "camera-lens-protectors", icon: "Camera", displayOrder: 8, image: "/cameralens.webp" },
  { name: "Accessories", slug: "accessories", icon: "Laptop", displayOrder: 9, image: "/Accessories.webp" },
  { name: "Phone Holders", slug: "phone-holders", icon: "Phone", displayOrder: 10, image: "/phone-holder.webp" },
  { name: "Gaming", slug: "gaming", icon: "Gamepad2", displayOrder: 11, image: "/Accessories.webp" },
  { name: "MagSafe Cases", slug: "magsafe-cases", icon: "Smartphone", displayOrder: 12, image: "/covers.webp" },
  { name: "Stickers", slug: "stickers", icon: "Tag", displayOrder: 13, image: "/Accessories.webp" },
];

export const SUBCATEGORIES: SubcategoryDefinition[] = [
  // Protectors subcategories
  { categorySlug: "protectors", name: "Curved Screens", slug: "curved-screens", displayOrder: 0 },
  { categorySlug: "protectors", name: "Full Glue 900", slug: "full-glue-900", displayOrder: 1 },
  { categorySlug: "protectors", name: "UV 1000", slug: "uv-1000", displayOrder: 2 },
  { categorySlug: "protectors", name: "Ceramic Privacy", slug: "protectors-ceramic-privacy", displayOrder: 3 },
  { categorySlug: "protectors", name: "Glass Privacy", slug: "protectors-glass-privacy", displayOrder: 4 },

  // Android Phones subcategories
  { categorySlug: "android-phones", name: "Normal / OG Glass", slug: "android-normal-og-glass", displayOrder: 0 },
  { categorySlug: "android-phones", name: "Ceramic Matte", slug: "android-ceramic-matte", displayOrder: 1 },
  { categorySlug: "android-phones", name: "Ceramic Privacy", slug: "android-ceramic-privacy", displayOrder: 2 },
  { categorySlug: "android-phones", name: "Glass Privacy", slug: "android-glass-privacy", displayOrder: 3 },

  // iPhone Model subcategories
  { categorySlug: "iphone-model", name: "Normal / OG Glass", slug: "iphone-normal-og-glass", displayOrder: 0 },
  { categorySlug: "iphone-model", name: "Glass Privacy", slug: "iphone-glass-privacy", displayOrder: 1 },
  { categorySlug: "iphone-model", name: "Ceramic Privacy", slug: "iphone-ceramic-privacy", displayOrder: 2 },

  // Audio subcategories
  { categorySlug: "audio", name: "Headphones", slug: "headphones", displayOrder: 0 },
  { categorySlug: "audio", name: "Earphones", slug: "earphones", displayOrder: 1 },
  { categorySlug: "audio", name: "AirPods Pro", slug: "airpods-pro", displayOrder: 2 },
  { categorySlug: "audio", name: "Neck Band", slug: "neck-band", displayOrder: 3 },
  { categorySlug: "audio", name: "Space Buds", slug: "space-buds", displayOrder: 4 },
  { categorySlug: "audio", name: "AirPods Cases", slug: "airpods-cases", displayOrder: 5 },

  // Smart Watch subcategories
  { categorySlug: "smart-watch", name: "Kids Smart Watch", slug: "kids-smart-watch", displayOrder: 0 },
  { categorySlug: "smart-watch", name: "Apple Watch", slug: "apple-watch", displayOrder: 1 },
  { categorySlug: "smart-watch", name: "Galaxy Watch", slug: "galaxy-watch", displayOrder: 2 },
  { categorySlug: "smart-watch", name: "Oraimo Watch", slug: "oraimo-watch", displayOrder: 3 },

  // Charging Devices subcategories
  { categorySlug: "charging-devices", name: "Apple Adapters", slug: "apple-adapters", displayOrder: 0 },
  { categorySlug: "charging-devices", name: "Samsung Adapters", slug: "samsung-adapters", displayOrder: 1 },
  { categorySlug: "charging-devices", name: "Complete Chargers (25W / 45W / 65W)", slug: "complete-chargers", displayOrder: 2 },
  { categorySlug: "charging-devices", name: "USB Cables", slug: "usb-cables", displayOrder: 3 },
  { categorySlug: "charging-devices", name: "Type-C Cables", slug: "type-c-cables", displayOrder: 4 },
  { categorySlug: "charging-devices", name: "Lightning Cables", slug: "lightning-cables", displayOrder: 5 },
  { categorySlug: "charging-devices", name: "C to C Cables", slug: "c-to-c-cables", displayOrder: 6 },
  { categorySlug: "charging-devices", name: "USB to Micro", slug: "usb-to-micro", displayOrder: 7 },
  { categorySlug: "charging-devices", name: "USB to C", slug: "usb-to-c", displayOrder: 8 },
  { categorySlug: "charging-devices", name: "AUX Cables", slug: "aux-cables", displayOrder: 9 },
  { categorySlug: "charging-devices", name: "Car Charger", slug: "car-charger", displayOrder: 10 },

  // Power Banks subcategories
  { categorySlug: "power-banks", name: "Wired Power Banks", slug: "wired-power-banks", displayOrder: 0 },
  { categorySlug: "power-banks", name: "Battery Pack", slug: "battery-pack", displayOrder: 1 },
  { categorySlug: "power-banks", name: "Wireless Power Bank", slug: "wireless-power-bank", displayOrder: 2 },
  { categorySlug: "power-banks", name: "Fast Charging Power Bank", slug: "fast-charging-power-bank", displayOrder: 3 },

  // Camera Lens Protectors subcategories
  { categorySlug: "camera-lens-protectors", name: "Glitter Lens Protectors", slug: "glitter-lens-protectors", displayOrder: 0 },
  { categorySlug: "camera-lens-protectors", name: "Normal Lens Protectors", slug: "normal-lens-protectors", displayOrder: 1 },
  { categorySlug: "camera-lens-protectors", name: "Octagon Lens Protectors", slug: "octagon-lens-protectors", displayOrder: 2 },

  // Accessories subcategories
  { categorySlug: "accessories", name: "Phone Charms", slug: "phone-charms", displayOrder: 0 },
  { categorySlug: "accessories", name: "Gents Phone Charms", slug: "gents-phone-charms", displayOrder: 1 },
  { categorySlug: "accessories", name: "Phone Lanyards", slug: "phone-lanyards", displayOrder: 2 },
  { categorySlug: "accessories", name: "Crossbody Phone Lanyards", slug: "crossbody-phone-lanyards", displayOrder: 3 },
  { categorySlug: "accessories", name: "Waterproof Bags", slug: "waterproof-bags", displayOrder: 4 },
  { categorySlug: "accessories", name: "Fluffy Charms", slug: "fluffy-charms", displayOrder: 5 },
  { categorySlug: "accessories", name: "Marble Charms", slug: "marble-charms", displayOrder: 6 },
  { categorySlug: "accessories", name: "Fabric Charms", slug: "fabric-charms", displayOrder: 7 },
  { categorySlug: "accessories", name: "Charger Protectors", slug: "charger-protectors", displayOrder: 8 },
  { categorySlug: "accessories", name: "iPhone Charger Protectors", slug: "iphone-charger-protectors", displayOrder: 9 },
  { categorySlug: "accessories", name: "Samsung Charger Protectors", slug: "samsung-charger-protectors", displayOrder: 10 },
  { categorySlug: "accessories", name: "S Pen", slug: "s-pen", displayOrder: 11 },

  // Phone Holders subcategories
  { categorySlug: "phone-holders", name: "Car Phone Holder", slug: "car-phone-holder", displayOrder: 0 },
  { categorySlug: "phone-holders", name: "Magnetic Phone Holder", slug: "magnetic-phone-holder", displayOrder: 1 },
  { categorySlug: "phone-holders", name: "Gimbal", slug: "gimbal", displayOrder: 2 },
  { categorySlug: "phone-holders", name: "Phone Stand", slug: "phone-stand", displayOrder: 3 },

  // Gaming subcategories
  { categorySlug: "gaming", name: "PS5", slug: "ps5", displayOrder: 0 },
  { categorySlug: "gaming", name: "Controllers", slug: "controllers", displayOrder: 1 },

  // MagSafe Cases subcategories
  { categorySlug: "magsafe-cases", name: "Premium Leather Cases", slug: "premium-leather-cases", displayOrder: 0 },
  { categorySlug: "magsafe-cases", name: "Cases with Lens Protectors", slug: "cases-with-lens-protectors", displayOrder: 1 },
  { categorySlug: "magsafe-cases", name: "Fancy Cases", slug: "fancy-cases", displayOrder: 2 },
  { categorySlug: "magsafe-cases", name: "Clear Cases", slug: "clear-cases", displayOrder: 3 },
  { categorySlug: "magsafe-cases", name: "Frosted Cases", slug: "frosted-cases", displayOrder: 4 },
  { categorySlug: "magsafe-cases", name: "3D Pop Socket Cases", slug: "3d-pop-socket-cases", displayOrder: 5 },
  { categorySlug: "magsafe-cases", name: "3-in-1 Cases", slug: "3-in-1-cases", displayOrder: 6 },
  { categorySlug: "magsafe-cases", name: "360 Cases", slug: "360-cases", displayOrder: 7 },
  { categorySlug: "magsafe-cases", name: "Converter Cases", slug: "converter-cases", displayOrder: 8 },

  // Stickers subcategories
  { categorySlug: "stickers", name: "Laptop Stickers", slug: "laptop-stickers", displayOrder: 0 },
  { categorySlug: "stickers", name: "Phone Stickers", slug: "phone-stickers", displayOrder: 1 },
  { categorySlug: "stickers", name: "Console Stickers", slug: "console-stickers", displayOrder: 2 },
  { categorySlug: "stickers", name: "Machine Cut Phone Stickers", slug: "machine-cut-phone-stickers", displayOrder: 3 },

  // ==============================================
  // PHONE CASES SUBCATEGORIES (ADD THESE)
  // ==============================================
  { categorySlug: "phone-cases", name: "Leather Case", slug: "leather-case", displayOrder: 0 },
  { categorySlug: "phone-cases", name: "3D Pop Socket Cases", slug: "3d-pop-socket-cases-phone", displayOrder: 1 },
  { categorySlug: "phone-cases", name: "MagSafe Cases", slug: "magsafe-cases-phone", displayOrder: 2 },
  { categorySlug: "phone-cases", name: "Clear Cases", slug: "clear-cases-phone", displayOrder: 3 },
  { categorySlug: "phone-cases", name: "Tribal Cases", slug: "tribal-cases", displayOrder: 4 },
  { categorySlug: "phone-cases", name: "Customized Cases", slug: "customized-cases", displayOrder: 5 },
  { categorySlug: "phone-cases", name: "Leather Flip Cases", slug: "leather-flip-cases", displayOrder: 6 },
  { categorySlug: "phone-cases", name: "Silicone Cases", slug: "silicone-cases", displayOrder: 7 },
  { categorySlug: "phone-cases", name: "Soft Silicone Cases", slug: "soft-silicone-cases", displayOrder: 8 },
  { categorySlug: "phone-cases", name: "Metallic Cases", slug: "metallic-cases", displayOrder: 9 },
  { categorySlug: "phone-cases", name: "Vegan Cases", slug: "vegan-cases", displayOrder: 10 },
  { categorySlug: "phone-cases", name: "Floral Cases", slug: "floral-cases", displayOrder: 11 },
  { categorySlug: "phone-cases", name: "Bow Cases", slug: "bow-cases", displayOrder: 12 },
];

export const SUBCATEGORIES_BY_CATEGORY: Record<string, SubcategoryDefinition[]> = SUBCATEGORIES.reduce(
  (acc, sub) => {
    acc[sub.categorySlug] = [...(acc[sub.categorySlug] || []), sub];
    return acc;
  },
  {} as Record<string, SubcategoryDefinition[]>
);

export const CATEGORY_SUGGESTIONS = MAIN_CATEGORIES.map((cat) => ({ label: cat.name, value: cat.slug }));

export const getCategoryBySlug = (slug: string) => MAIN_CATEGORIES.find((cat) => cat.slug === slug);
export const getCategoryByName = (name: string) =>
  MAIN_CATEGORIES.find((cat) => cat.name.toLowerCase() === name.trim().toLowerCase());
export const getSubcategoryBySlug = (slug: string) => SUBCATEGORIES.find((sub) => sub.slug === slug);
export const getSubcategoryByName = (name: string) =>
  SUBCATEGORIES.find((sub) => sub.name.toLowerCase() === name.trim().toLowerCase());
export const getSubcategoriesByCategory = (categorySlug: string) => SUBCATEGORIES_BY_CATEGORY[categorySlug] || [];

export const normalizeCategorySlug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");