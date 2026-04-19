/**
 * Category Validation & Diagnostics
 * Helps identify and validate product categorization issues
 */

import { MAIN_CATEGORIES, SUBCATEGORIES } from "./categoryData";
import { getCategorySlugFromProduct } from "./utils";

export interface ProductCategoryDiagnostic {
  productId: string;
  productName: string;
  category: string | undefined;
  subcategory: string | undefined;
  isValid: boolean;
  issues: string[];
  suggestedCategory?: string;
}

/**
 * Validate a single product's category
 */
export function validateProductCategory(product: any): ProductCategoryDiagnostic {
  const issues: string[] = [];
  let isValid = true;

  // Check if category is present
  if (!product.category || product.category.trim() === "") {
    issues.push("Category field is empty");
    isValid = false;
  }

  // Check if category matches a valid main category
  if (product.category) {
    const categorySlug = getCategorySlugFromProduct(product);
    if (!categorySlug) {
      issues.push(`Category "${product.category}" doesn't match any main category`);
      isValid = false;
    }
  }

  // Check if subcategory is valid (if present)
  if (product.subcategory && product.subcategory.trim() !== "") {
    const matchedSubcategory = SUBCATEGORIES.find(sub =>
      sub.slug.toLowerCase() === product.subcategory.toLowerCase() ||
      sub.name.toLowerCase() === product.subcategory.toLowerCase()
    );

    if (!matchedSubcategory) {
      issues.push(`Subcategory "${product.subcategory}" doesn't match any defined subcategory`);
      isValid = false;
    }
  }

  return {
    productId: product.id,
    productName: product.name,
    category: product.category,
    subcategory: product.subcategory,
    isValid,
    issues,
    suggestedCategory: getCategorySlugFromProduct(product) || undefined,
  };
}

/**
 * Validate multiple products
 */
export function validateProductCategories(products: any[]): ProductCategoryDiagnostic[] {
  return products.map(validateProductCategory);
}

/**
 * Generate a report of products with category issues
 */
export function generateCategoryIssuesReport(products: any[]) {
  const validated = validateProductCategories(products);
  const issues = validated.filter(v => !v.isValid);
  const valid = validated.filter(v => v.isValid);

  return {
    total: products.length,
    valid: valid.length,
    invalid: issues.length,
    validPercentage: products.length > 0 ? ((valid.length / products.length) * 100).toFixed(2) : "0",
    issues: issues,
    summary: {
      missingCategory: issues.filter(i => i.issues.includes("Category field is empty")).length,
      invalidCategory: issues.filter(i => i.issues.some(issue => issue.includes("doesn't match any main category"))).length,
      invalidSubcategory: issues.filter(i => i.issues.some(issue => issue.includes("doesn't match any defined subcategory"))).length,
    }
  };
}

/**
 * Get all products that belong to a specific category
 */
export function getProductsByCategory(products: any[], categorySlug: string) {
  return products.filter(product => {
    const slug = getCategorySlugFromProduct(product);
    return slug === categorySlug;
  });
}

/**
 * Get products by category with validation
 */
export function getProductsByCategoryWithValidation(products: any[], categorySlug: string) {
  const categoryProducts = getProductsByCategory(products, categorySlug);
  const validated = validateProductCategories(categoryProducts);

  return {
    categorySlug,
    products: categoryProducts,
    count: categoryProducts.length,
    validCount: validated.filter(v => v.isValid).length,
    invalidCount: validated.filter(v => !v.isValid).length,
    issues: validated.filter(v => !v.isValid),
  };
}

/**
 * Diagnose category filtering for a specific category
 * Useful for debugging why a category section might not be showing products
 */
export function diagnoseCategoryFiltering(products: any[], categorySlug: string) {
  const categoryName = MAIN_CATEGORIES.find(c => c.slug === categorySlug)?.name;
  const categoryProducts = getProductsByCategory(products, categorySlug);
  const validated = validateProductCategories(categoryProducts);

  console.group(`🔍 Category Filtering Diagnosis: ${categoryName} (${categorySlug})`);
  console.log(`Total products: ${products.length}`);
  console.log(`Products in category: ${categoryProducts.length}`);
  console.log(`Valid products: ${validated.filter(v => v.isValid).length}`);
  console.log(`Invalid products: ${validated.filter(v => !v.isValid).length}`);

  if (validated.filter(v => !v.isValid).length > 0) {
    console.warn(`⚠️ Issues found in ${categorySlug}:`, validated.filter(v => !v.isValid));
  }

  if (categoryProducts.length === 0) {
    console.warn(`⚠️ No products found for category ${categorySlug}`);
    console.log("Available categories:", MAIN_CATEGORIES.map(c => c.slug));
  }

  console.groupEnd();

  return {
    categorySlug,
    categoryName,
    total: products.length,
    inCategory: categoryProducts.length,
    valid: validated.filter(v => v.isValid).length,
    invalid: validated.filter(v => !v.isValid).length,
    issues: validated.filter(v => !v.isValid),
  };
}
