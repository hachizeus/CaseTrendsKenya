import { Search, ShoppingCart, User, Heart, Menu, X, ChevronDown, LogOut } from "lucide-react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import SearchDropdown from "./SearchDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { totalItems, totalPrice, setIsOpen } = useCart();
  const navigate = useNavigate();
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("categories")
      .select("name")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => setCategories(data || []));
  }, []);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    if (showCategoryDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showCategoryDropdown]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() || selectedCategory) {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      if (selectedCategory) params.append("category", selectedCategory);
      navigate(`/products?${params.toString()}`);
      setSearchQuery("");
      setSelectedCategory("");
      setSearchOpen(false);
    }
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container flex items-center justify-between py-3 gap-4">
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            className="md:hidden p-1.5 text-foreground" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/" className="flex-shrink-0">
            <img src={logo} alt="Case Trends Kenya" width={44} height={44} className="h-9 sm:h-11 w-auto" />
          </Link>
        </div>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl items-center gap-2">
          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="absolute left-0 top-0 h-full px-3 flex items-center gap-1.5 border-r border-border text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              {selectedCategory || "All Categories"}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showCategoryDropdown && (
              <div ref={categoryDropdownRef} className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-48">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("");
                    setShowCategoryDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors border-b border-border"
                >
                  All Categories
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-secondary ${
                      selectedCategory === cat.name ? "bg-secondary font-medium" : ""
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 relative">
            <div className="flex border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary">
              <input
                type="text"
                placeholder="Search for phones, tablets, accessories..."
                className="flex-1 px-4 py-2.5 text-sm bg-background outline-none"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
              />
              <button type="submit" className="bg-primary text-primary-foreground px-5 hover:opacity-90 transition-colors" aria-label="Search products">
                <Search className="w-4 h-4" />
              </button>
            </div>
            <SearchDropdown
              query={searchQuery}
              isOpen={showSearchDropdown && searchQuery.trim().length > 0}
              onSuggestionSelect={name => {
                setSearchQuery(name);
                setShowSearchDropdown(false);
              }}
            />
          </div>
        </form>

        <div className="flex items-center gap-3">
          <button 
            className="md:hidden p-2 text-foreground" 
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label={searchOpen ? "Close search" : "Open search"}
            aria-expanded={searchOpen}
            aria-controls="mobile-search"
          >
            <Search className="w-5 h-5" />
          </button>

          {user ? (
            <div className="hidden sm:flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 text-muted-foreground hover:text-primary transition-colors hover:bg-secondary rounded-lg">
                    <User className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/account/orders" className="flex items-center gap-2 cursor-pointer">
                      📦 My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/favorites" className="flex items-center gap-2 cursor-pointer">
                      <Heart className="w-4 h-4" /> Wishlist
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer text-accent">
                          ⚙️ Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2 cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Link to="/auth" className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <User className="w-5 h-5" />
              <span className="hidden lg:inline">Login / Register</span>
            </Link>
          )}

          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-3 sm:px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors relative"
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
        <form onSubmit={handleSearch} className="md:hidden px-4 pb-3 space-y-2" id="mobile-search">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg outline-none"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
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
        <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-2" id="mobile-menu">
          <Link to="/products" className="block py-2 text-sm font-medium hover:text-primary" onClick={() => setMobileMenuOpen(false)}>All Products</Link>
          {user && (
            <>
              <Link to="/account/orders" className="block py-2 text-sm font-medium hover:text-primary" onClick={() => setMobileMenuOpen(false)}>My Orders</Link>
              <Link to="/favorites" className="block py-2 text-sm font-medium hover:text-primary" onClick={() => setMobileMenuOpen(false)}>Wishlist</Link>
            </>
          )}
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