import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import HeroBanner from "@/components/HeroBanner";
import CategoryCards from "@/components/CategoryCards";
import BrandFilter from "@/components/BrandFilter";
import PromoBanners from "@/components/PromoBanners";
import ProductGrid from "@/components/ProductGrid";
import MiniHeroBanner from "@/components/MiniHeroBanner";
import HomeCategorySections from "@/components/HomeCategorySections";
import FeatureStrip from "@/components/FeatureStrip";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen flex flex-col">
    <TopBar />
    <Header />
    <CategoryNav />
    <main className="flex-1">

      {/* Hero 1 — Main banner (display_order 0–9) */}
      <HeroBanner />

      {/* Category icons strip */}
      <CategoryCards />

      {/* Brand filter */}
      <BrandFilter />

      {/* Featured promo banners grid */}
      <PromoBanners />

      {/* ProductGrid */}
      <ProductGrid />

      {/* Hero 2 — After trending products (section 2) */}
      <MiniHeroBanner
        sectionNumber={2}
        fallbackTitle="New Arrivals Every Week"
        fallbackSubtitle="Be the first to own the latest phones, tablets, and accessories in Nairobi."
        fallbackBg="bg-slate-900"
      />

      {/* Per-category product sections with mini heroes between them */}
      <HomeCategorySections />

      {/* Feature strip */}
      <FeatureStrip />

    </main>
    <Footer />
  </div>
);

export default Index;
