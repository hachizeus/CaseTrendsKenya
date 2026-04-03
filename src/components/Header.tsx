import { Search, ShoppingCart, User, Heart, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import logo from "@/assets/logo.png";

const Header = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAdmin, signOut } = useAuth();
  const { totalItems, totalPrice, setIsOpen } = useCart();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchOpen(false);
    }
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container flex items-center justify-between py-3 gap-4">
        <div className="flex items-center gap-3">
          <button className="md:hidden p-2 text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/" className="flex-shrink-0">
            <img src={logo} alt="TechMobile KE" className="h-12 w-auto" />
          </Link>
        </div>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
          <div className="flex w-full border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary">
            <input
              type="text"
              placeholder="Search for phones, tablets, accessories..."
              className="flex-1 px-4 py-2.5 text-sm bg-background outline-none"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="bg-primary text-primary-foreground px-5 hover:opacity-90 transition-opacity">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-3">
          <button className="md:hidden p-2 text-foreground" onClick={() => setSearchOpen(!searchOpen)}>
            <Search className="w-5 h-5" />
          </button>

          {user ? (
            <div className="hidden sm:flex items-center gap-3">
              {isAdmin && (
                <Link to="/admin" className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded font-medium">Admin</Link>
              )}
              <Link to="/favorites" className="p-2 text-muted-foreground hover:text-primary transition-colors">
                <Heart className="w-5 h-5" />
              </Link>
              <button onClick={() => signOut()} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Sign Out
              </button>
            </div>
          ) : (
            <Link to="/auth" className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <User className="w-5 h-5" />
              <span className="hidden lg:inline">Login / Register</span>
            </Link>
          )}

          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity relative"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">KSh {totalPrice.toLocaleString()}</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile search */}
      {searchOpen && (
        <form onSubmit={handleSearch} className="md:hidden px-4 pb-3">
          <div className="flex w-full border border-border rounded-lg overflow-hidden">
            <input
              type="text"
              placeholder="Search products..."
              className="flex-1 px-4 py-2.5 text-sm bg-background outline-none"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button type="submit" className="bg-primary text-primary-foreground px-4">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-2">
          <Link to="/products" className="block py-2 text-sm font-medium hover:text-primary" onClick={() => setMobileMenuOpen(false)}>All Products</Link>
          <Link to="/favorites" className="block py-2 text-sm font-medium hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Wishlist</Link>
          {user ? (
            <>
              {isAdmin && <Link to="/admin" className="block py-2 text-sm font-medium hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Admin Panel</Link>}
              <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="block py-2 text-sm font-medium text-destructive">Sign Out</button>
            </>
          ) : (
            <Link to="/auth" className="block py-2 text-sm font-medium hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Login / Register</Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
