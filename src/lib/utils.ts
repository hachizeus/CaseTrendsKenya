import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const categoryDisplayNameMap: Record<string, string> = {
  smartphones: "Phone Cases",
  "smart phones": "Phone Cases",
  phones: "Phone Cases",
  "phone cases": "Phone Cases",
  cases: "Phone Cases",
  protectors: "Screen Protectors",
  "screen protectors": "Screen Protectors",
  tablets: "Screen Protectors",
  "tablets & ipads": "Screen Protectors",
  ipads: "Screen Protectors",
  "audio & earbuds": "Earbuds",
  audio: "Earbuds",
  earbuds: "Earbuds",
  chargers: "Chargers",
  "power banks": "Chargers",
  "streaming devices": "Chargers",
  wearables: "Accessories",
  smartwatches: "Accessories",
  watch: "Accessories",
  accessories: "Accessories",
  "phone accessories": "Accessories",
  "mobile accessories": "Accessories",
  gaming: "Accessories",
};

export function getDisplayCategoryName(name: string) {
  const normalized = name?.trim().toLowerCase();
  return categoryDisplayNameMap[normalized] || name;
}

const categorySearchPatterns: Record<string, RegExp> = {
  Smartphones: /smartphone|smart phones|phone|iphone|samsung|tecno|infinix|itel|xiaomi|oppo|vivo|realme|huawei|nokia|motorola|oneplus/i,
  "Tablets & iPads": /tablet|ipad|tablets|ipads/i,
  "Audio & Earbuds": /audio|earbud|earphone|headphone|headset/i,
  Gaming: /game|gaming|playstation|xbox|nintendo|controller/i,
  Wearables: /wearable|watch|smartwatch|fitness tracker|glasses|spectacles/i,
  "Streaming Devices": /stream|tv|firestick|roku|chromecast|streaming/i,
  "Phone case": /case|cover|bumper/i,
  "Phone Cases": /case|cover|bumper/i,
  Protector: /protector|screen protector|tempered glass/i,
  "Screen Protectors": /protector|screen protector|tempered glass/i,
};

export function categoryMatches(product: { category?: string; brand?: string; model?: string; compatibility_type?: string; name?: string }, selectedCategory: string) {
  if (!selectedCategory || selectedCategory === "All Accessories") return true;

  const matcher = categorySearchPatterns[selectedCategory];
  const text = [product.category, product.brand, product.model, product.compatibility_type, product.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (matcher) {
    return matcher.test(text);
  }

  return text.includes(selectedCategory.trim().toLowerCase());
}
