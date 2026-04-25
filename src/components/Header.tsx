import {
  Search,
  ShoppingCart,
  User,
  Heart,
  Menu,
  X,
  ChevronDown,
  LogOut,
  ChevronRight,
  Shield,
  Smartphone,
  Headphones,
  Watch,
  Battery,
  Camera,
  Package,
  SmartphoneNfc,
  Gamepad2,
  Magnet,
  Sticker,
  Cable,
  LucideIcon,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import SearchDropdown from "./SearchDropdown";
import { getDisplayCategoryName } from "@/lib/utils";
import {
  MAIN_CATEGORIES,
  getSubcategoriesByCategory,
} from "@/lib/categoryData";

const headerCategoryOptions = MAIN_CATEGORIES.map((cat) => cat.slug);
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Custom hook for typing placeholder animation
const useTypingPlaceholder = () => {
  const [displayText, setDisplayText] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const words = [
    "Covers",
    "Protectors",
    "Phone Cases",
    "Android Phones",
    "iPhone Models",
    "Audio",
    "Smart Watch",
    "Charging Devices",
    "Power Banks",
    "Camera Lens Protectors",
    "Accessories",
    "Phone Holders",
    "Gaming",
  ];

  // Color mapping for each word
  const getColorForWord = (word: string): string => {
    const colorMap: Record<string, string> = {
      Covers: "text-blue-500",
      Protectors: "text-green-500",
      "Phone Cases": "text-purple-500",
      "Android Phones": "text-orange-500",
      "iPhone Models": "text-indigo-500",
      Audio: "text-pink-500",
      "Smart Watch": "text-red-500",
      "Charging Devices": "text-yellow-600",
      "Power Banks": "text-teal-500",
      "Camera Lens Protectors": "text-cyan-500",
      Accessories: "text-amber-600",
      "Phone Holders": "text-emerald-500",
      Gaming: "text-violet-500",
    };
    return colorMap[word] || "text-gray-500";
  };

  useEffect(() => {
    const currentWord = words[currentWordIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && displayText === currentWord) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayText === "") {
      setIsDeleting(false);
      setCurrentWordIndex((currentWordIndex + 1) % words.length);
    } else {
      timeout = setTimeout(
        () => {
          setDisplayText((prev) =>
            isDeleting
              ? prev.slice(0, -1)
              : currentWord.slice(0, prev.length + 1),
          );
        },
        isDeleting ? 50 : 100,
      );
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentWordIndex]);

  return {
    displayText,
    currentColor: getColorForWord(words[currentWordIndex]),
    isTyping: !isDeleting && displayText !== words[currentWordIndex],
  };
};

// Map category names to icons
const getCategoryIcon = (categoryName: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    Protectors: Shield,
    "Phone Cases": Smartphone,
    "Android Phones": Smartphone,
    "iPhone Model": Smartphone,
    Audio: Headphones,
    "Smart Watch": Watch,
    "Charging Devices": Battery,
    "Power Banks": Battery,
    "Camera Lens Protectors": Camera,
    Accessories: Package,
    "Phone Holders": SmartphoneNfc,
    Gaming: Gamepad2,
    "MagSafe Cases": Magnet,
    Stickers: Sticker,
  };

  return iconMap[categoryName] || Package;
};

const Header = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [dropdownCategory, setDropdownCategory] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(
    null,
  );
  const [mobileHoveredCategory, setMobileHoveredCategory] = useState<
    string | null
  >(null);
  const { user, role, isAdmin, isModerator, signOut } = useAuth();
  const { totalItems, totalPrice, setIsOpen } = useCart();
  const navigate = useNavigate();
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const scrollingCategoriesRef = useRef<HTMLDivElement>(null);
  const mobileScrollingRef = useRef<HTMLDivElement>(null);
  const categoriesContainerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();
  const mobileHoverTimeoutRef = useRef<NodeJS.Timeout>();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const mobileScrollTimeoutRef = useRef<NodeJS.Timeout>();
  const canAccessAdminPanel = isAdmin || isModerator;

  // Typing placeholder hook
  const { displayText, currentColor, isTyping } = useTypingPlaceholder();

  // Desktop Auto-scrolling categories
  useEffect(() => {
    const scrollContainer = scrollingCategoriesRef.current;
    if (!scrollContainer) return;

    let animationFrame: number;
    let scrollPosition = 0;
    const scrollSpeed = 0.3;

    const scroll = () => {
      if (scrollContainer && !hoveredCategory) {
        scrollPosition += scrollSpeed;

        if (scrollPosition >= scrollContainer.scrollWidth / 2) {
          scrollPosition = 0;
        }

        scrollContainer.scrollLeft = scrollPosition;
      }
      animationFrame = requestAnimationFrame(scroll);
    };

    animationFrame = requestAnimationFrame(scroll);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [hoveredCategory]);

  // Mobile Auto-scrolling categories
  useEffect(() => {
    const scrollContainer = mobileScrollingRef.current;
    if (!scrollContainer) return;

    let animationFrame: number;
    let scrollPosition = 0;
    const scrollSpeed = 0.3;

    const scroll = () => {
      if (scrollContainer && !mobileHoveredCategory) {
        scrollPosition += scrollSpeed;

        if (scrollPosition >= scrollContainer.scrollWidth / 2) {
          scrollPosition = 0;
        }

        scrollContainer.scrollLeft = scrollPosition;
      }
      animationFrame = requestAnimationFrame(scroll);
    };

    animationFrame = requestAnimationFrame(scroll);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [mobileHoveredCategory]);

  // Handle desktop scroll events to hide dropdown
  useEffect(() => {
    const scrollContainer = scrollingCategoriesRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (hoveredCategory && hoveredElement) {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
          setHoveredCategory(null);
          setHoveredElement(null);
        }, 100);
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll);

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [hoveredCategory, hoveredElement]);

  // Handle mobile scroll events to hide dropdown
  useEffect(() => {
    const scrollContainer = mobileScrollingRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (mobileHoveredCategory) {
        if (mobileScrollTimeoutRef.current) {
          clearTimeout(mobileScrollTimeoutRef.current);
        }

        mobileScrollTimeoutRef.current = setTimeout(() => {
          setMobileHoveredCategory(null);
        }, 100);
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll);

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      if (mobileScrollTimeoutRef.current) {
        clearTimeout(mobileScrollTimeoutRef.current);
      }
    };
  }, [mobileHoveredCategory]);

  // Prevent body scroll when mobile search opens
  useEffect(() => {
    if (searchOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [searchOpen]);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target as Node)
      ) {
        setShowCategoryDropdown(false);
      }
    };

    if (showCategoryDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showCategoryDropdown]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() || selectedCategory || selectedSubcategory) {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedSubcategory)
        params.append("subcategory", selectedSubcategory);
      navigate(`/products?${params.toString()}`);
      setSearchQuery("");
      setSelectedCategory("");
      setSelectedSubcategory("");
      setSearchOpen(false);
    }
  };

  const handleCategoryHover = (
    categorySlug: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    setHoveredCategory(categorySlug);
    setHoveredElement(event.currentTarget);
  };

  const handleCategoryMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
      setHoveredElement(null);
    }, 300);
  };

  const handleDropdownMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleDropdownMouseLeave = () => {
    setHoveredCategory(null);
    setHoveredElement(null);
  };

  // Mobile hover handlers
  const handleMobileCategoryHover = (categorySlug: string) => {
    if (mobileHoverTimeoutRef.current) {
      clearTimeout(mobileHoverTimeoutRef.current);
    }

    setMobileHoveredCategory(categorySlug);
  };

  const handleMobileCategoryMouseLeave = () => {
    mobileHoverTimeoutRef.current = setTimeout(() => {
      setMobileHoveredCategory(null);
    }, 300);
  };

  const handleMobileDropdownMouseEnter = () => {
    if (mobileHoverTimeoutRef.current) {
      clearTimeout(mobileHoverTimeoutRef.current);
    }
  };

  const handleMobileDropdownMouseLeave = () => {
    setMobileHoveredCategory(null);
  };

  // Get current category name for dropdown title
  const currentCategory = MAIN_CATEGORIES.find(
    (cat) => cat.slug === hoveredCategory,
  );
  const currentMobileCategory = MAIN_CATEGORIES.find(
    (cat) => cat.slug === mobileHoveredCategory,
  );

  // Calculate dropdown position relative to the container
  const getDropdownPosition = () => {
    if (!hoveredElement || !categoriesContainerRef.current) return { left: 0 };

    const elementRect = hoveredElement.getBoundingClientRect();
    const containerRect =
      categoriesContainerRef.current.getBoundingClientRect();

    return {
      left: elementRect.left - containerRect.left,
    };
  };

  return (
    <header className="bg-black border-b border-white/10 sticky top-0 z-50">
      <div className="container flex flex-col py-3 gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              className="md:hidden p-1.5 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <Link to="/" className="flex-shrink-0">
              <img
                src="/logo.webp"
                alt="Case Trends Kenya"
                width={56}
                height={56}
                className="h-10 sm:h-12 lg:h-14 w-auto"
              />
            </Link>
          </div>

          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-2xl items-center gap-2"
          >
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="absolute left-0 top-0 h-full px-3 flex items-center gap-1.5 border-r border-white/10 text-white/60 hover:text-white transition-colors text-sm z-10 bg-black"
              >
                {selectedSubcategory
                  ? getDisplayCategoryName(selectedSubcategory)
                  : selectedCategory
                    ? getDisplayCategoryName(selectedCategory)
                    : "All Categories"}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showCategoryDropdown && (
                <div
                  ref={categoryDropdownRef}
                  className="absolute top-full left-0 mt-1 bg-[hsl(240,10%,6%)] border border-white/10 rounded-lg shadow-lg z-50 min-w-[22rem] md:min-w-[24rem]"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory("");
                          setSelectedSubcategory("");
                          setDropdownCategory("");
                          setShowCategoryDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors border-b border-white/10 text-white"
                      >
                        All Categories
                      </button>
                      {MAIN_CATEGORIES.map((cat) => {
                        const IconComponent = getCategoryIcon(cat.name);
                        return (
                          <button
                            key={cat.slug}
                            type="button"
                            onMouseEnter={() => setDropdownCategory(cat.slug)}
                            onClick={() => {
                              setSelectedCategory(cat.slug);
                              setSelectedSubcategory("");
                              setShowCategoryDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 flex items-center gap-2 ${
                              selectedCategory === cat.slug
                                ? "bg-white/10 font-medium"
                                : ""
                            } text-white`}
                          >
                            <IconComponent className="w-4 h-4 text-white/60" />
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                    <div className="space-y-1 border-t border-white/10 md:border-t-0 md:border-l md:pl-2 md:pt-0 md:mt-0">
                      <div className="px-4 py-2 text-xs uppercase tracking-wide text-white/50">
                        Subcategories
                      </div>
                      {dropdownCategory ? (
                        getSubcategoriesByCategory(dropdownCategory).map(
                          (sub) => (
                            <button
                              key={sub.slug}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(dropdownCategory);
                                setSelectedSubcategory(sub.slug);
                                setShowCategoryDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${
                                selectedSubcategory === sub.slug
                                  ? "bg-white/10 font-medium"
                                  : ""
                              } text-white`}
                            >
                              {sub.name}
                            </button>
                          ),
                        )
                      ) : (
                        <p className="px-4 py-2 text-sm text-white/40">
                          Hover a main category to see subcategories.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 relative">
              <div className="flex border border-white/10 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary relative bg-black">
                <input
                  type="text"
                  className="flex-1 px-4 py-2.5 text-sm bg-black text-white outline-none w-full"
                  style={{ paddingLeft: "140px", paddingRight: "50px" }}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  onBlur={() =>
                    setTimeout(() => setShowSearchDropdown(false), 200)
                  }
                />
                {!searchQuery && (
                  <div
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-sm text-white/40"
                    style={{
                      left: "16px",
                      right: "50px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Search for{" "}
                    <span className={`${currentColor} inline-block`}>
                      {displayText}
                      <span className="animate-pulse ml-0.5">|</span>
                    </span>
                  </div>
                )}
                <button
                  type="submit"
                  className="bg-primary text-white px-5 hover:opacity-90 transition-colors flex-shrink-0 absolute right-0 top-0 bottom-0 z-10"
                  aria-label="Search products"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
              <SearchDropdown
                query={searchQuery}
                isOpen={showSearchDropdown && searchQuery.trim().length > 0}
                onSuggestionSelect={(name) => {
                  setSearchQuery(name);
                  setShowSearchDropdown(false);
                }}
              />
            </div>
          </form>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              className="md:hidden p-2 text-white"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label={searchOpen ? "Close search" : "Open search"}
              aria-expanded={searchOpen}
              aria-controls="mobile-search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Only show wishlist icon when user is NOT logged in */}
            {!user && (
              <Link
                to="/favorites"
                className="hidden sm:flex p-2 text-white/60 hover:text-primary transition-colors"
              >
                <Heart className="w-5 h-5" />
              </Link>
            )}

            {user ? (
              <div className="hidden sm:flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 text-white/60 hover:text-primary transition-colors hover:bg-white/10 rounded-lg">
                      <User className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-[hsl(240,10%,6%)] border-white/10"
                  >
                    <DropdownMenuLabel className="text-xs text-white/60">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      asChild
                      className="text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white cursor-pointer"
                    >
                      <Link
                        to="/account/orders"
                        className="flex items-center gap-2"
                      >
                        📦 My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      className="text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white cursor-pointer"
                    >
                      <Link to="/favorites" className="flex items-center gap-2">
                        <Heart className="w-4 h-4" /> Wishlist
                      </Link>
                    </DropdownMenuItem>
                    {canAccessAdminPanel && (
                      <>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                          asChild
                          className="text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white cursor-pointer"
                        >
                          <Link to="/admin" className="flex items-center gap-2">
                            ⚙️ Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      onClick={() => signOut()}
                      className="flex items-center gap-2 cursor-pointer text-red-400 hover:bg-red-500/10 hover:text-red-300 focus:bg-red-500/10 focus:text-red-300"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to="/auth"
                  className="flex items-center gap-1.5 text-sm text-white/60 hover:text-primary transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden lg:inline">Login / Register</span>
                </Link>
              </div>
            )}

            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 bg-primary text-white px-2 sm:px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors relative rounded-lg"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">
                KSh {totalPrice.toLocaleString()}
              </span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Auto-scrolling Categories Section */}
        <div
          ref={categoriesContainerRef}
          className="hidden md:block relative border-t border-white/10 pt-3"
        >
          <div
            ref={scrollingCategoriesRef}
            className="overflow-x-hidden whitespace-nowrap relative"
            style={{
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)",
              cursor: hoveredCategory ? "default" : "auto",
            }}
          >
            <div className="inline-flex gap-1">
              {[...MAIN_CATEGORIES, ...MAIN_CATEGORIES].map(
                (category, index) => {
                  const IconComponent = getCategoryIcon(category.name);
                  return (
                    <button
                      key={`${category.slug}-${index}`}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white/80 hover:text-primary hover:bg-white/10 rounded-lg transition-all duration-200 whitespace-nowrap group relative"
                      onMouseEnter={(e) =>
                        handleCategoryHover(category.slug, e)
                      }
                      onMouseLeave={handleCategoryMouseLeave}
                      onClick={() =>
                        navigate(`/products?category=${category.slug}`)
                      }
                    >
                      <IconComponent className="w-4 h-4 mr-2 text-white/50 group-hover:text-primary transition-colors" />
                      {category.name}
                      <ChevronRight className="w-4 h-4 ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* Desktop Hover Dropdown */}
          {hoveredCategory && currentCategory && hoveredElement && (
            <>
              <div
                className="absolute w-full h-2 -bottom-2 left-0"
                onMouseEnter={handleDropdownMouseEnter}
              />

              <div
                ref={dropdownRef}
                className="absolute z-50 bg-[hsl(240,10%,6%)] border border-white/10 rounded-lg shadow-xl min-w-[280px] max-w-[350px]"
                style={{
                  left: `${getDropdownPosition().left}px`,
                  top: "100%",
                  marginTop: "4px",
                }}
                onMouseEnter={handleDropdownMouseEnter}
                onMouseLeave={handleDropdownMouseLeave}
              >
                <div
                  className="absolute -top-2 w-4 h-4 bg-[hsl(240,10%,6%)] border-t border-l border-white/10 transform rotate-45"
                  style={{ left: "20px" }}
                />

                <div className="p-2 relative bg-[hsl(240,10%,6%)] rounded-lg">
                  <div className="px-3 py-2 border-b border-white/10 mb-2">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const IconComponent = getCategoryIcon(
                          currentCategory.name,
                        );
                        return (
                          <IconComponent className="w-5 h-5 text-primary" />
                        );
                      })()}
                      <h3 className="font-semibold text-white">
                        {currentCategory.name}
                      </h3>
                    </div>
                    <p className="text-xs text-white/50 mt-0.5 ml-7">
                      Browse subcategories
                    </p>
                  </div>
                  <div
                    className="space-y-1 max-h-[400px] overflow-y-auto scrollbar-hide"
                    style={{
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                  >
                    <button
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition-colors flex items-center justify-between group text-white"
                      onClick={() => {
                        navigate(`/products?category=${hoveredCategory}`);
                        setHoveredCategory(null);
                      }}
                    >
                      <span>All {currentCategory.name}</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    {getSubcategoriesByCategory(hoveredCategory).length > 0 ? (
                      getSubcategoriesByCategory(hoveredCategory).map(
                        (subcategory) => (
                          <button
                            key={subcategory.slug}
                            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition-colors flex items-center justify-between group text-white"
                            onClick={() => {
                              navigate(
                                `/products?category=${hoveredCategory}&subcategory=${subcategory.slug}`,
                              );
                              setHoveredCategory(null);
                            }}
                          >
                            <span>{subcategory.name}</span>
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ),
                      )
                    ) : (
                      <p className="px-3 py-2 text-sm text-white/40">
                        No subcategories available
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/10">
                    <button
                      className="w-full text-center py-2 text-xs text-primary hover:underline"
                      onClick={() => {
                        navigate(`/products?category=${hoveredCategory}`);
                        setHoveredCategory(null);
                      }}
                    >
                      View All Products →
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mobile Auto-scrolling Categories Section */}
        <div
          ref={mobileContainerRef}
          className="md:hidden relative border-t border-white/10 pt-2 -mx-4 px-4"
        >
          <div
            ref={mobileScrollingRef}
            className="overflow-x-auto whitespace-nowrap relative scrollbar-hide"
            style={{
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 10px, black calc(100% - 10px), transparent)",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              cursor: mobileHoveredCategory ? "default" : "auto",
            }}
          >
            <div className="inline-flex gap-2">
              {[...MAIN_CATEGORIES, ...MAIN_CATEGORIES].map(
                (category, index) => {
                  const IconComponent = getCategoryIcon(category.name);
                  return (
                    <button
                      key={`mobile-${category.slug}-${index}`}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white/80 hover:text-primary bg-white/5 hover:bg-white/10 rounded-full transition-all duration-200 whitespace-nowrap group relative"
                      onMouseEnter={() =>
                        handleMobileCategoryHover(category.slug)
                      }
                      onMouseLeave={handleMobileCategoryMouseLeave}
                      onClick={() =>
                        navigate(`/products?category=${category.slug}`)
                      }
                    >
                      <IconComponent className="w-3.5 h-3.5 mr-1.5 text-white/50 group-hover:text-primary transition-colors" />
                      {category.name}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* Mobile Hover Dropdown */}
          {mobileHoveredCategory && currentMobileCategory && (
            <>
              <div
                className="absolute w-full h-2 -bottom-2 left-0"
                onMouseEnter={handleMobileDropdownMouseEnter}
              />

              <div
                ref={mobileDropdownRef}
                className="absolute left-0 right-0 z-50 bg-[hsl(240,10%,6%)] border border-white/10 rounded-lg shadow-xl mx-4"
                style={{
                  top: "100%",
                  marginTop: "4px",
                }}
                onMouseEnter={handleMobileDropdownMouseEnter}
                onMouseLeave={handleMobileDropdownMouseLeave}
              >
                <div className="p-3">
                  <div className="px-2 py-2 border-b border-white/10 mb-2">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const IconComponent = getCategoryIcon(
                          currentMobileCategory.name,
                        );
                        return (
                          <IconComponent className="w-4 h-4 text-primary" />
                        );
                      })()}
                      <h3 className="font-semibold text-sm text-white">
                        {currentMobileCategory.name}
                      </h3>
                    </div>
                  </div>
                  <div
                    className="space-y-1 max-h-[300px] overflow-y-auto scrollbar-hide"
                    style={{
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                  >
                    <button
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition-colors flex items-center justify-between group text-white"
                      onClick={() => {
                        navigate(`/products?category=${mobileHoveredCategory}`);
                        setMobileHoveredCategory(null);
                      }}
                    >
                      <span>All {currentMobileCategory.name}</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    {getSubcategoriesByCategory(mobileHoveredCategory).length >
                    0 ? (
                      getSubcategoriesByCategory(mobileHoveredCategory).map(
                        (subcategory) => (
                          <button
                            key={subcategory.slug}
                            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition-colors flex items-center justify-between group text-white"
                            onClick={() => {
                              navigate(
                                `/products?category=${mobileHoveredCategory}&subcategory=${subcategory.slug}`,
                              );
                              setMobileHoveredCategory(null);
                            }}
                          >
                            <span className="text-sm">{subcategory.name}</span>
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ),
                      )
                    ) : (
                      <p className="px-3 py-2 text-sm text-white/40">
                        No subcategories available
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile search */}
      {searchOpen && (
        <form
          onSubmit={handleSearch}
          className="md:hidden w-full px-4 pb-3 space-y-2 overflow-x-hidden bg-black"
          id="mobile-search"
        >
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory("");
            }}
            className="w-full px-3 py-2.5 text-base bg-black border border-white/10 rounded-lg outline-none text-white"
          >
            <option value="">All Categories</option>
            {MAIN_CATEGORIES.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
          <div className="flex w-full border border-white/10 rounded-lg overflow-hidden bg-black">
            <input
              type="text"
              placeholder="Search cases, protectors, earbuds..."
              className="flex-1 px-4 py-2.5 text-base bg-black text-white outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button type="submit" className="bg-primary text-white px-4">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-t border-white/10 bg-black px-4 py-3 space-y-2"
          id="mobile-menu"
        >
          <Link
            to="/products"
            className="block py-2 text-sm font-medium text-white/80 hover:text-primary"
            onClick={() => setMobileMenuOpen(false)}
          >
            All Products
          </Link>
          {user && (
            <>
              <Link
                to="/account/orders"
                className="block py-2 text-sm font-medium text-white/80 hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Orders
              </Link>
              <Link
                to="/favorites"
                className="block py-2 text-sm font-medium text-white/80 hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Wishlist
              </Link>
            </>
          )}
          {!user && (
            <>
              <Link
                to="/favorites"
                className="block py-2 text-sm font-medium text-white/80 hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Wishlist
              </Link>
              <Link
                to="/auth"
                className="block py-2 text-sm font-medium text-white/80 hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login / Register
              </Link>
            </>
          )}
          {user && (
            <>
              {canAccessAdminPanel && (
                <Link
                  to="/admin"
                  className="block py-2 text-sm font-medium text-white/80 hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-sm font-medium text-red-400"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      )}

      {/* Add the animation CSS */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-pulse {
          animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </header>
  );
};

export default Header;
