import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CategoryProductSection from "./CategoryProductSection";
import MiniHeroBanner from "./MiniHeroBanner";

const sectionBgs = ["bg-white", "bg-secondary/30", "bg-white", "bg-secondary/30", "bg-white", "bg-secondary/30"];

// Mini hero sections between category sections
const interstitialHeroes = [
  { sectionNumber: 3, title: "Deals You Can't Miss", subtitle: "Limited time offers on top electronics. Shop before they're gone.", bg: "bg-slate-900" },
];

const HomeCategorySections = () => {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from("categories")
      .select("name")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => setCategories((data || []).map(c => c.name)));
  }, []);

  if (categories.length === 0) return null;

  return (
    <>
      {categories.map((cat, i) => (
        <div key={cat}>
          <CategoryProductSection
            category={cat}
            bgClass={sectionBgs[i % sectionBgs.length]}
          />
          {/* Insert a mini hero after every 2nd category section */}
          {(i + 1) % 2 === 0 && interstitialHeroes[Math.floor(i / 2)] && (
            <MiniHeroBanner
              sectionNumber={interstitialHeroes[Math.floor(i / 2)].sectionNumber}
              fallbackTitle={interstitialHeroes[Math.floor(i / 2)].title}
              fallbackSubtitle={interstitialHeroes[Math.floor(i / 2)].subtitle}
              fallbackBg={interstitialHeroes[Math.floor(i / 2)].bg}
            />
          )}
        </div>
      ))}
    </>
  );
};

export default HomeCategorySections;
