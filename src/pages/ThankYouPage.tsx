import { Link } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ThankYouPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      <TopBar />
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Thank you for your order!</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Your payment was successful, and your order has been created.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ThankYouPage;