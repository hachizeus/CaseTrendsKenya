import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { useCart } from "@/contexts/CartContext";
import { GuestRoute, ProtectedRoute, AdminRoute } from "@/components/RouteGuards";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";
import ProductComparisonModal from "@/components/ProductComparisonModal";
import Index from "./pages/Index.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import ProductPage from "./pages/ProductPage.tsx";
import ProductsPage from "./pages/ProductsPage.tsx";
import CheckoutPage from "./pages/CheckoutPage.tsx";
import OrderConfirmationPage from "./pages/OrderConfirmationPage.tsx";
import OrdersPage from "./pages/account/OrdersPage.tsx";
import FavoritesPage from "./pages/FavoritesPage.tsx";
import AdminLayout from "./pages/admin/AdminLayout.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminProducts from "./pages/admin/AdminProducts.tsx";
import AdminProductsForm from "./pages/admin/AdminProductsForm.tsx";
import AdminCategories from "./pages/admin/AdminCategories.tsx";
import AdminSlides from "./pages/admin/AdminSlides.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminReviews from "./pages/admin/AdminReviews.tsx";
import AdminOrders from "./pages/admin/AdminOrders.tsx";
import AdminSlidesOverview from "./pages/admin/AdminSlidesOverview.tsx";
import AdminSlideManager from "./pages/admin/AdminSlideManager.tsx";
import NotFound from "./pages/NotFound.tsx";

// Lazy load heavy admin components
const LazyAdminSlidesOverview = lazy(() => import("./pages/admin/AdminSlidesOverview.tsx"));
const LazyAdminSlideManager = lazy(() => import("./pages/admin/AdminSlideManager.tsx"));

// Loading skeleton for lazy-loaded routes
const LoadingPlaceholder = () => (
  <div className="w-full h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 1,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const AppContent = () => {
  const { showComparison, setShowComparison, comparisonProducts } = useCart();

  return (
    <>
      <ScrollToTop />
      <CartDrawer />
      <WhatsAppButton />
      <ProductComparisonModal
        isOpen={showComparison}
        products={comparisonProducts}
        onClose={() => setShowComparison(false)}
      />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route
          path="/auth"
          element={
            <GuestRoute>
              <AuthPage />
            </GuestRoute>
          }
        />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order/:orderId" element={<OrderConfirmationPage />} />
        <Route
          path="/account/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={<FavoritesPage />}
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductsForm />} />
          <Route path="products/:id" element={<AdminProductsForm />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="slides" element={<AdminSlides />} />
          <Route
            path="slides-overview"
            element={
              <Suspense fallback={<LoadingPlaceholder />}>
                <LazyAdminSlidesOverview />
              </Suspense>
            }
          />
          <Route
            path="slides-section/:sectionId"
            element={
              <Suspense fallback={<LoadingPlaceholder />}>
                <LazyAdminSlideManager />
              </Suspense>
            }
          />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="orders" element={<AdminOrders />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

// Register service worker only in production
if (import.meta.env.PROD) {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/service-worker.js");
    });
  }
}

export default App;
