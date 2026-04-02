import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import HeroBanner from "@/components/HeroBanner";
import CategoryCards from "@/components/CategoryCards";
import BrandFilter from "@/components/BrandFilter";
import ProductGrid from "@/components/ProductGrid";
import FeatureStrip from "@/components/FeatureStrip";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen flex flex-col">
    <TopBar />
    <Header />
    <CategoryNav />
    <main className="flex-1">
      <HeroBanner />
      <CategoryCards />
      <BrandFilter />
      <ProductGrid />
      <FeatureStrip />
    </main>
    <Footer />
  </div>
);

export default Index;
