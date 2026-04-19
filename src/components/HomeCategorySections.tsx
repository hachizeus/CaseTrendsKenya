import CategoryProductSection from "./CategoryProductSection";
import MiniHeroBanner from "./MiniHeroBanner";
import { MAIN_CATEGORIES } from "@/lib/categoryData";

const sectionBgs = ["bg-white", "bg-secondary/30", "bg-white", "bg-secondary/30", "bg-white", "bg-secondary/30", "bg-white", "bg-secondary/30", "bg-white"];

// Mini hero sections between category sections
const interstitialHeroes = [
  { sectionNumber: 3, title: "Deals You Can't Miss", subtitle: "Limited time offers on top phone accessories. Shop before they're gone.", bg: "bg-slate-900" },
];

const homepageSections = MAIN_CATEGORIES.slice(0, 6).map((cat) => cat.slug);

const HomeCategorySections = () => {
  return (
    <>
      {homepageSections.map((cat, i) => (
        <div key={cat}>
          <CategoryProductSection
            category={cat}
            bgClass={sectionBgs[i % sectionBgs.length]}
          />
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
