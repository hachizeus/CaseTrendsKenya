import { lazy, Suspense } from "react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import HeroBanner from "@/components/HeroBanner";
const CategoryCards = lazy(() => import("@/components/CategoryCards"));
const BrandFilter = lazy(() => import("@/components/BrandFilter"));
const PromoBanners = lazy(() => import("@/components/PromoBanners"));
const ProductGrid = lazy(() => import("@/components/ProductGrid"));
const MiniHeroBanner = lazy(() => import("@/components/MiniHeroBanner"));
const HomeCategorySections = lazy(() => import("@/components/HomeCategorySections"));
const FeatureStrip = lazy(() => import("@/components/FeatureStrip"));
import Footer from "@/components/Footer";

const SectionFallback = () => (
  <div className="py-8 sm:py-10">
    <div className="container">
      <div className="h-44 rounded-3xl bg-slate-100 animate-pulse" />
    </div>
  </div>
);

const Index = () => (
  <div className="min-h-screen flex flex-col">
    <TopBar />
    <Header />
    <main className="flex-1">

      {/* Hero 1 — Main banner (display_order 0–9) */}
      <HeroBanner />

      <Suspense fallback={<SectionFallback />}>
        <CategoryCards />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <BrandFilter />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <PromoBanners />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <ProductGrid />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <MiniHeroBanner
          sectionNumber={2}
          fallbackTitle="New Arrivals Every Week"
          fallbackSubtitle="Be the first to shop the latest phone cases, screen protectors, and accessories in Nairobi."
          fallbackBg="bg-slate-900"
        />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <HomeCategorySections />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <FeatureStrip />
      </Suspense>

    </main>
    <Footer />
  </div>
);

export default Index;
