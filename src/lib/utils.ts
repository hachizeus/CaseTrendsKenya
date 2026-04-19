import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { MAIN_CATEGORIES, SUBCATEGORIES } from "./categoryData";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const categoryDisplayNameMap: Record<string, string> = {
  ...MAIN_CATEGORIES.reduce((acc, cat) => {
    acc[cat.slug] = cat.name;
    acc[cat.name.toLowerCase()] = cat.name;
    return acc;
  }, {} as Record<string, string>),
  ...SUBCATEGORIES.reduce((acc, sub) => {
    acc[sub.slug] = sub.name;
    acc[sub.name.toLowerCase()] = sub.name;
    return acc;
  }, {} as Record<string, string>),
};

export function getDisplayCategoryName(name: string) {
  const normalized = name?.trim().toLowerCase();
  return categoryDisplayNameMap[normalized] || name;
}

export function productMatchesCategoryFilter(
  product: { category?: string; subcategory?: string; brand?: string; model?: string; compatibility_type?: string; name?: string; category_id?: string; subcategory_id?: string },
  categorySlug?: string,
  subcategorySlug?: string
) {
  // If no filters specified, include product
  if (!categorySlug && !subcategorySlug) return true;

  // Normalize all text fields to lowercase for consistent comparison
  const normalizeText = (text?: string) => (text ? String(text).toLowerCase().trim() : "");
  const productCategory = normalizeText(product.category);
  const productSubcategory = normalizeText(product.subcategory);
  
  // Build searchable text from all product fields
  const searchText = [productCategory, productSubcategory, product.brand, product.model, product.compatibility_type, product.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Check subcategory filter if specified
  if (subcategorySlug) {
    const normalizedSubSlug = normalizeText(subcategorySlug);
    const subDisplayName = normalizeText(getDisplayCategoryName(subcategorySlug));
    
    // Match if product's subcategory field matches OR search text includes subcategory slug/name
    const subMatches = 
      productSubcategory === normalizedSubSlug ||
      productSubcategory === subDisplayName ||
      searchText.includes(normalizedSubSlug) ||
      searchText.includes(subDisplayName);
    
    if (!subMatches) return false;
  }

  // Check category filter if specified
  if (categorySlug) {
    const normalizedCatSlug = normalizeText(categorySlug);
    const catDisplayName = normalizeText(getDisplayCategoryName(categorySlug));
    
    // Match if product's category field matches OR search text includes category slug/name
    const catMatches = 
      productCategory === normalizedCatSlug ||
      productCategory === catDisplayName ||
      searchText.includes(normalizedCatSlug) ||
      searchText.includes(catDisplayName);
    
    if (!catMatches) return false;
  }

  return true;
}

/**
 * Validates that a product has a properly formatted category field.
 * Returns true if the category is a valid main category slug or display name.
 */
export function isValidProductCategory(product: { category?: string; subcategory?: string }): boolean {
  if (!product.category) return false;
  
  const normalized = (product.category || "").toLowerCase().trim();
  
  // Check if it matches any main category slug
  const matchesMainCategory = MAIN_CATEGORIES.some(cat => 
    cat.slug.toLowerCase() === normalized ||
    cat.name.toLowerCase() === normalized
  );
  
  return matchesMainCategory;
}

/**
 * Gets the slug for a product's category, returning null if invalid.
 * Useful for normalizing category values.
 */
export function getCategorySlugFromProduct(product: { category?: string; subcategory?: string }): string | null {
  if (!product.category) return null;
  
  const normalized = (product.category || "").toLowerCase().trim();
  
  // Find matching category
  const matchedCategory = MAIN_CATEGORIES.find(cat => 
    cat.slug.toLowerCase() === normalized ||
    cat.name.toLowerCase() === normalized
  );
  
  return matchedCategory?.slug || null;
}

/**
 * Validates that a product belongs to a specific category.
 * More strict than productMatchesCategoryFilter - requires exact category match.
 */
export function productBelongsToCategory(
  product: { category?: string; subcategory?: string },
  categorySlug: string
): boolean {
  if (!product.category || !categorySlug) return false;
  
  const productCatSlug = getCategorySlugFromProduct(product);
  return productCatSlug === categorySlug.toLowerCase();
}
