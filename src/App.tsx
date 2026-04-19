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
import { GuestRoute, ProtectedRoute, AdminRoute, AdminOnlyRoute } from "@/components/RouteGuards";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";
import ProductComparisonModal from "@/components/ProductComparisonModal";
import Index from "./pages/Index.tsx";
const AuthPage = lazy(() => import("./pages/AuthPage.tsx"));
const ProductsPage = lazy(() => import("./pages/ProductsPage.tsx"));
const ProductPage = lazy(() => import("./pages/ProductPage.tsx"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage.tsx"));
const OrderConfirmationPage = lazy(() => import("./pages/OrderConfirmationPage.tsx"));
const OrdersPage = lazy(() => import("./pages/account/OrdersPage.tsx"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage.tsx"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout.tsx"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.tsx"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts.tsx"));
const AdminProductsForm = lazy(() => import("./pages/admin/AdminProductsForm.tsx"));
const AdminSlides = lazy(() => import("./pages/admin/AdminSlides.tsx"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers.tsx"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews.tsx"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders.tsx"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs.tsx"));
const AdminFinancials = lazy(() => import("./pages/admin/AdminFinancials.tsx"));
const AdminSlidesOverview = lazy(() => import("./pages/admin/AdminSlidesOverview.tsx"));
const AdminSlideManager = lazy(() => import("./pages/admin/AdminSlideManager.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

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
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="financials" element={<AdminOnlyRoute><AdminFinancials /></AdminOnlyRoute>} />
          <Route path="users" element={<AdminOnlyRoute><AdminUsers /></AdminOnlyRoute>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ErrorBoundary>
          <AuthProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
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
