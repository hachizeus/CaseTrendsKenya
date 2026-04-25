import { memo } from "react";
import CategoryProductSection from "./CategoryProductSection";
import MiniHeroBanner from "./MiniHeroBanner";
import { MAIN_CATEGORIES } from "@/lib/categoryData";

// Custom sections with correct database slugs
const CUSTOM_SECTIONS = [
  { slug: "protectors", title: "Protectors" },
  { slug: "phone cases", title: "Phone Cases" },
  { slug: "accessories", title: "Accessories" },
  { slug: "charging-devices", title: "Charging Devices" },
  { slug: "audio", title: "Audio" },
  { slug: "smart watch", title: "Smart Watch" },
];

// Dark theme alternating backgrounds
const sectionBgs = [
  "bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]",
  "bg-gradient-to-b from-[hsl(240,10%,4.5%)] to-[hsl(240,10%,3.9%)]",
  "bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]",
  "bg-gradient-to-b from-[hsl(240,10%,4.5%)] to-[hsl(240,10%,3.9%)]",
  "bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]",
  "bg-gradient-to-b from-[hsl(240,10%,4.5%)] to-[hsl(240,10%,3.9%)]",
];

// Only ONE mini hero banner after Phone Cases (index 1)
const bannerPosition = { 
  afterIndex: 1,  // After Phone Cases
  sectionNumber: 3,
  title: "Phone accessories", 
  subtitle: "Be the first to shop the latest phone cases, screen protectors, and accessories in Nairobi.",
  bg: "bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" 
};

const HomeCategorySections = memo(() => {
  return (
    <>
      {CUSTOM_SECTIONS.map((section, i) => {
        return (
          <div key={section.slug}>
            <CategoryProductSection
              category={section.slug}
              title={section.title}
              bgClass={sectionBgs[i % sectionBgs.length]}
            />
            {/* Only render banner AFTER Phone Cases (index 1) */}
            {i === bannerPosition.afterIndex && (
              <MiniHeroBanner
                sectionNumber={bannerPosition.sectionNumber}
                fallbackTitle={bannerPosition.title}
                fallbackSubtitle={bannerPosition.subtitle}
                fallbackBg={bannerPosition.bg}
              />
            )}
          </div>
        );
      })}
    </>
  );
});

HomeCategorySections.displayName = "HomeCategorySections";

export default HomeCategorySections;