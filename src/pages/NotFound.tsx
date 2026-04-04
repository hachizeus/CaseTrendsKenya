import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home, Search } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    document.title = "Page Not Found | Case Trends Kenya";
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar />
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 md:py-20 px-4">
        <div className="container max-w-2xl">
          <div className="text-center space-y-6">
            {/* 404 Visual */}
            <div className="relative mb-8">
              <div className="text-9xl md:text-[200px] font-bold text-primary/10 select-none">404</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="w-20 h-20 md:w-32 md:h-32 text-primary/40 animate-pulse" />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold">Page Not Found</h1>
              <p className="text-lg text-muted-foreground">
                Sorry, we couldn't find the page you're looking for.
              </p>
              <p className="text-sm text-muted-foreground">
                The page at <code className="bg-secondary px-2 py-1 rounded text-xs">{location.pathname}</code> does not exist.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button
                asChild
                variant="default"
                size="lg"
                className="gap-2"
              >
                <Link to="/">
                  <Home className="w-4 h-4" />
                  Return to Home
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Link to="/products">
                  <Search className="w-4 h-4" />
                  Browse Products
                </Link>
              </Button>
            </div>

            {/* Quick Links */}
            <div className="pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">Quick links:</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/" className="text-primary hover:text-primary/80 text-sm underline">Home</Link>
                <span className="text-muted-foreground">•</span>
                <Link to="/products" className="text-primary hover:text-primary/80 text-sm underline">Products</Link>
                <span className="text-muted-foreground">•</span>
                <Link to="/auth" className="text-primary hover:text-primary/80 text-sm underline">Sign In</Link>
              </div>
            </div>

            {/* Help text */}
            <div className="text-xs text-muted-foreground pt-4">
              If you believe this is an error, please contact our support team.
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
