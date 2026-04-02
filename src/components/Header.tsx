import { Search, ShoppingCart, User, Heart } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import logo from "@/assets/logo.png";

const Header = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAdmin, signOut } = useAuth();
  const { totalItems, totalPrice, setIsOpen } = useCart();
  const navigate = useNavigate();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container flex items-center justify-between py-3 gap-4">
        <Link to="/" className="flex-shrink-0">
          <img src={logo} alt="TechMobile KE" className="h-12 w-auto" />
        </Link>

        <div className="hidden md:flex flex-1 max-w-xl">
          <div className="flex w-full border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary">
            <input
              type="text"
              placeholder="Search for phones, tablets, accessories..."
              className="flex-1 px-4 py-2.5 text-sm bg-background outline-none"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button className="bg-primary text-primary-foreground px-5 hover:opacity-90 transition-opacity">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

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
            <span>KSh {totalPrice.toLocaleString()}</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

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
