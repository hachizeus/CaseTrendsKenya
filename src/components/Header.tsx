import { Search, ShoppingCart, User, Menu } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";

const Header = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container flex items-center justify-between py-3 gap-4">
        {/* Logo */}
        <a href="/" className="flex-shrink-0">
          <img src={logo} alt="TechMobile KE" className="h-12 w-auto" />
        </a>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl">
          <div className="flex w-full border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary">
            <input
              type="text"
              placeholder="Search for phones, tablets, accessories..."
              className="flex-1 px-4 py-2.5 text-sm bg-background outline-none"
            />
            <button className="bg-primary text-primary-foreground px-5 hover:opacity-90 transition-opacity">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search className="w-5 h-5" />
          </button>
          <a href="#" className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <User className="w-5 h-5" />
            <span className="hidden lg:inline">Login / Register</span>
          </a>
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            <ShoppingCart className="w-4 h-4" />
            <span>KSh 0</span>
          </button>
        </div>
      </div>

      {/* Mobile search */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3">
          <div className="flex w-full border border-border rounded-lg overflow-hidden">
            <input
              type="text"
              placeholder="Search products..."
              className="flex-1 px-4 py-2.5 text-sm bg-background outline-none"
            />
            <button className="bg-primary text-primary-foreground px-4">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
