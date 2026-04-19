import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * TEMPORARY DIAGNOSTIC TOOL
 * Shows actual category values in database
 * Add to Index.tsx temporarily to debug category filtering
 */
export default function CategoryDiagnosticDebug() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const diagnose = async () => {
      try {
        // Fetch all products with just id, name, category, subcategory
        const { data: products, error } = await (supabase
          .from("products")
          .select("id, name, category, subcategory, brand, model")
          .limit(200) as any);

        if (error) {
          console.error("Error fetching products:", error);
          setData({ error: error.message });
          setLoading(false);
          return;
        }

        // Analyze the data
        const analysis = {
          totalProducts: products.length,
          categoryValues: {} as Record<string, number>,
          productsWithNoCategory: [] as any[],
          productsWithNullCategory: [] as any[],
          sampleByCategory: {} as Record<string, any[]>,
        };

        products.forEach((p: any) => {
          // Count category values
          const cat = p.category || "(empty)";
          analysis.categoryValues[cat] = (analysis.categoryValues[cat] || 0) + 1;

          // Collect samples
          if (!analysis.sampleByCategory[cat]) {
            analysis.sampleByCategory[cat] = [];
          }
          if (analysis.sampleByCategory[cat].length < 2) {
            analysis.sampleByCategory[cat].push({
              id: p.id,
              name: p.name,
              category: p.category,
              subcategory: p.subcategory,
              brand: p.brand,
              model: p.model,
            });
          }

          // Track products with no category
          if (!p.category || p.category.trim() === "") {
            analysis.productsWithNoCategory.push({ id: p.id, name: p.name });
          }
          if (p.category === null || p.category === undefined) {
            analysis.productsWithNullCategory.push({ id: p.id, name: p.name });
          }
        });

        console.log("📊 CATEGORY DIAGNOSTIC REPORT:");
        console.log("================================");
        console.log(`Total products: ${analysis.totalProducts}`);
        console.log("\n🏷️  CATEGORY VALUES FOUND IN DATABASE:");
        Object.entries(analysis.categoryValues)
          .sort((a, b) => b[1] - a[1])
          .forEach(([cat, count]) => {
            console.log(`  "${cat}": ${count} products`);
          });

        console.log("\n📋 SAMPLES BY CATEGORY:");
        Object.entries(analysis.sampleByCategory)
          .sort((a, b) => b[1].length - a[1].length)
          .forEach(([cat, samples]) => {
            console.log(`\n  Category: "${cat}"`);
            samples.forEach((s: any) => {
              console.log(`    - ${s.name} (${s.brand}${s.model ? " " + s.model : ""})`);
            });
          });

        if (analysis.productsWithNoCategory.length > 0) {
          console.warn(
            `\n⚠️  ${analysis.productsWithNoCategory.length} products with EMPTY/NULL category:`,
            analysis.productsWithNoCategory.slice(0, 5)
          );
        }

        console.log("\n📝 EXPECTED CATEGORY SLUGS:");
        console.log(
          ["protectors", "phone-cases", "android-phones", "iphone-model", "audio", "smart-watch", "charging-devices", "power-banks", "camera-lens-protectors", "accessories"]
            .map((s) => `  "${s}"`)
            .join("\n")
        );

        setData(analysis);
      } catch (err: any) {
        console.error("Diagnostic error:", err);
        setData({ error: err.message });
      } finally {
        setLoading(false);
      }
    };

    diagnose();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded m-4">
        <div className="text-sm font-semibold">📊 Running category diagnostics...</div>
      </div>
    );
  }

  if (data?.error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded m-4">
        <div className="text-sm font-semibold text-red-800">❌ Error: {data.error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded m-4 text-sm">
      <div className="font-bold mb-2">📊 CATEGORY DIAGNOSTIC REPORT</div>
      <div className="space-y-2 font-mono text-xs">
        <div>Total Products: <span className="font-bold">{data?.totalProducts}</span></div>

        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="font-bold mb-1">Category Values in Database:</div>
          {data?.categoryValues && Object.entries(data.categoryValues)
            .sort((a: any, b: any) => b[1] - a[1])
            .map(([cat, count]: any) => (
              <div key={cat} className="flex justify-between">
                <span>"{cat}":</span>
                <span className="font-bold">{count} products</span>
              </div>
            ))}
        </div>

        {data?.productsWithNoCategory?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-yellow-200 bg-yellow-100 p-2 rounded">
            <div className="font-bold text-yellow-800 mb-1">⚠️ Products with EMPTY category:</div>
            <div className="text-yellow-700">{data.productsWithNoCategory.length} products found</div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-gray-600">
        <strong>Check Console (F12)</strong> for full details and samples
      </div>
    </div>
  );
}
