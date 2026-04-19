import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateCategoryIssuesReport } from "@/lib/categoryValidation";

/**
 * DatabaseDiagnostics Component
 * 
 * This is a debugging component to test Supabase connectivity and data.
 * Add it temporarily to your page to diagnose database issues.
 * 
 * Usage:
 * import DatabaseDiagnostics from "@/components/DatabaseDiagnostics";
 * 
 * Then in your JSX:
 * <DatabaseDiagnostics />
 * 
 * Check the console output (F12) for detailed error messages.
 */
export default function DatabaseDiagnostics() {
  const [results, setResults] = useState<{
    heroSectionsCount: number | null;
    heroSlidesCount: number | null;
    heroSectionsError: string | null;
    heroSlidesError: string | null;
    sampleSections: any[];
    sampleSlides: any[];
    productsCount: number | null;
    productsError: string | null;
    categoryReport: any;
  }>({
    heroSectionsCount: null,
    heroSlidesCount: null,
    heroSectionsError: null,
    heroSlidesError: null,
    sampleSections: [],
    sampleSlides: [],
    productsCount: null,
    productsError: null,
    categoryReport: null,
  });

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    console.log("🔍 Starting DatabaseDiagnostics...");

    // Test hero_sections table
    try {
      console.log("Checking hero_sections table...");
      const { data: sections, error: sectionsError, count: sectionsCount } = await (supabase
        .from("hero_sections" as any)
        .select("*", { count: "exact" })
        .limit(5) as any);

      console.log("hero_sections response:", {
        count: sectionsCount,
        data: sections,
        error: sectionsError,
      });

      setResults((prev) => ({
        ...prev,
        heroSectionsCount: sectionsCount || sections?.length || 0,
        heroSectionsError: sectionsError?.message || null,
        sampleSections: sections || [],
      }));
    } catch (err: any) {
      console.error("Error querying hero_sections:", err);
      setResults((prev) => ({
        ...prev,
        heroSectionsError: err.message,
      }));
    }

    // Test hero_slides table
    try {
      console.log("Checking hero_slides table...");
      const { data: slides, error: slidesError, count: slidesCount } = await (supabase
        .from("hero_slides" as any)
        .select("*", { count: "exact" })
        .limit(5) as any);

      console.log("hero_slides response:", {
        count: slidesCount,
        data: slides,
        error: slidesError,
      });

      setResults((prev) => ({
        ...prev,
        heroSlidesCount: slidesCount || slides?.length || 0,
        heroSlidesError: slidesError?.message || null,
        sampleSlides: slides || [],
      }));
    } catch (err: any) {
      console.error("Error querying hero_slides:", err);
      setResults((prev) => ({
        ...prev,
        heroSlidesError: err.message,
      }));
    }

    // Test products table and validate categories
    try {
      console.log("Checking products table and categories...");
      const { data: products, error: productsError, count: productsCount } = await (supabase
        .from("products" as any)
        .select("id, name, category, subcategory", { count: "exact" })
        .limit(100) as any);

      console.log("products response:", {
        count: productsCount,
        error: productsError,
      });

      if (!productsError && products) {
        const report = generateCategoryIssuesReport(products);
        console.log("📊 Category Validation Report:", report);
        
        setResults((prev) => ({
          ...prev,
          productsCount: productsCount || products?.length || 0,
          productsError: null,
          categoryReport: report,
        }));
      } else {
        setResults((prev) => ({
          ...prev,
          productsError: productsError?.message || null,
        }));
      }
    } catch (err: any) {
      console.error("Error querying products:", err);
      setResults((prev) => ({
        ...prev,
        productsError: err.message,
      }));
    }
  };

  const getStatusColor = (count: number | null, error: string | null) => {
    if (error) return "destructive";
    if (count === 0) return "secondary";
    if (count && count > 0) return "default";
    return "outline";
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="p-4 space-y-3 bg-white shadow-lg border border-border">
        <div className="font-bold text-sm">Database Diagnostics</div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span>hero_sections Table:</span>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(results.heroSectionsCount, results.heroSectionsError)}>
                {results.heroSectionsError ? "Error" : `${results.heroSectionsCount} rows`}
              </Badge>
            </div>
          </div>
          {results.heroSectionsError && (
            <div className="bg-red-50 text-red-800 p-2 rounded font-mono text-[10px] break-words">
              {results.heroSectionsError}
            </div>
          )}
          {results.sampleSections.length > 0 && (
            <div className="bg-slate-50 p-2 rounded">
              <div className="font-semibold mb-1">Sample Data:</div>
              {results.sampleSections.map((section: any) => (
                <div key={section.id} className="text-[10px]">
                  • Section {section.section_number}: {section.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span>hero_slides Table:</span>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(results.heroSlidesCount, results.heroSlidesError)}>
                {results.heroSlidesError ? "Error" : `${results.heroSlidesCount} rows`}
              </Badge>
            </div>
          </div>
          {results.heroSlidesError && (
            <div className="bg-red-50 text-red-800 p-2 rounded font-mono text-[10px] break-words">
              {results.heroSlidesError}
            </div>
          )}
          {results.sampleSlides.length > 0 && (
            <div className="bg-slate-50 p-2 rounded">
              <div className="font-semibold mb-1">Sample Data:</div>
              {results.sampleSlides.slice(0, 2).map((slide: any) => (
                <div key={slide.id} className="text-[10px]">
                  • {slide.title} (active: {slide.is_active ? "yes" : "no"})
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 text-xs border-t pt-3">
          <div className="flex items-center justify-between">
            <span>Products Table:</span>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(results.productsCount, results.productsError)}>
                {results.productsError ? "Error" : `${results.productsCount} rows`}
              </Badge>
            </div>
          </div>
          {results.productsError && (
            <div className="bg-red-50 text-red-800 p-2 rounded font-mono text-[10px] break-words">
              {results.productsError}
            </div>
          )}
          {results.categoryReport && (
            <div className="bg-blue-50 p-2 rounded">
              <div className="font-semibold mb-1">📊 Category Health:</div>
              <div className="text-[10px] space-y-0.5">
                <div>Total: {results.categoryReport.total} products</div>
                <div>Valid: {results.categoryReport.valid} ({results.categoryReport.validPercentage}%)</div>
                <div className={results.categoryReport.invalid > 0 ? "text-red-600 font-semibold" : ""}>
                  Invalid: {results.categoryReport.invalid}
                </div>
                {results.categoryReport.invalid > 0 && (
                  <div className="text-red-600 text-[9px] mt-1">
                    <div>Missing Category: {results.categoryReport.summary.missingCategory}</div>
                    <div>Invalid Category: {results.categoryReport.summary.invalidCategory}</div>
                    <div>Invalid Subcategory: {results.categoryReport.summary.invalidSubcategory}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={runDiagnostics}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs py-1 rounded"
        >
          Retry Diagnostics
        </button>
      </Card>
    </div>
  );
}
