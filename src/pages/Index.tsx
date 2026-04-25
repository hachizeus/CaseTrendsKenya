import { lazy, Suspense } from "react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import { VideoSection } from "@/components/VideoSection";
const CategoryCards = lazy(() => import("@/components/CategoryCards"));
const BrandFilter = lazy(() => import("@/components/BrandFilter"));
const PromoBanners = lazy(() => import("@/components/PromoBanners"));
const ProductGrid = lazy(() => import("@/components/ProductGrid"));
const MiniHeroBanner = lazy(() => import("@/components/MiniHeroBanner"));
const HomeCategorySections = lazy(() => import("@/components/HomeCategorySections"));
const FeatureStrip = lazy(() => import("@/components/FeatureStrip"));
import Footer from "@/components/Footer";

// Dark theme skeleton loader
const SectionFallback = () => (
  <div className="py-8 sm:py-10">
    <div className="container">
      <div className="h-44 rounded-2xl bg-gradient-to-r from-[hsl(240,10%,6%)] to-[hsl(240,10%,8%)] animate-pulse border border-white/5" />
    </div>
  </div>
);

const Index = () => (
  <div className="min-h-screen flex flex-col bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]">
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

      {/* Video Section - Inserted between BrandFilter and PromoBanners */}
      <VideoSection />
      
      <Suspense fallback={<SectionFallback />}>
        <ProductGrid />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <MiniHeroBanner
          sectionNumber={2}
          fallbackTitle="New Arrivals Every Week"
          fallbackSubtitle="Be the first to shop the latest phone cases, screen protectors, and accessories in Nairobi."
          fallbackBg="bg-gradient-to-r from-primary/20 to-transparent"
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