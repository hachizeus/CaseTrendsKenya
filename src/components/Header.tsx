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

// Updated MAIN_CATEGORIES with correct names from database
const MAIN_CATEGORIES = [
  { name: "Smartphones", slug: "smartphones", categoryId: "51feace1-d4fc-4c5b-939f-8cecee1f447b" },
  { name: "Android Phones", slug: "android-phones", categoryId: "4006f669-3bac-4633-8b22-964c6a8d98e7" },
  { name: "iPhone Models", slug: "iphone-model", categoryId: "21b261a2-7046-488e-8798-cc6b64a4f383" },
  { name: "Audio", slug: "audio", categoryId: "42085990-1f6d-4417-9c63-74e560a612bf" },
  { name: "Smart Watch", slug: "smart-watch", categoryId: "2fe2e5f4-86e9-47e6-9666-dad7cda508db" },
  { name: "Charging Devices", slug: "charging-devices", categoryId: "df0e0cfd-32bd-4aaa-bbf7-6b74ba8d007e" },
  { name: "Power Banks", slug: "power-banks", categoryId: "b9042c4a-5f2f-4d6f-ae65-32e215a6ec08" },
  { name: "Camera Lens Protectors", slug: "camera-lens-protectors", categoryId: "4ec7d508-05af-4408-a3a1-05e2352a3f9e" },
  { name: "Protectors", slug: "protectors", categoryId: "ff82c901-6d28-4fd8-aeb0-f70c4ac7ab91" },
  { name: "Phone Cases", slug: "phone-cases", categoryId: "8feca2ff-0436-48ae-92ce-226b98944c0c" },
  { name: "Gaming", slug: "gaming", categoryId: "06dfd5a5-6568-4788-bd85-562f591ee1bf" },
  { name: "MagSafe Cases", slug: "magsafe-cases", categoryId: "24476a4e-7f81-4e0a-a80d-b0a728a6035a" },
  { name: "Stickers", slug: "stickers", categoryId: "f1c70937-6e84-477b-bb9a-912638228584" },
  { name: "Phone Holders", slug: "phone-holders", categoryId: "c3ed521b-8891-4828-98f7-2ddee125b642" },
  { name: "Accessories", slug: "accessories", categoryId: "4379046f-17bf-40f0-9238-052a68af0391" },
  { name: "Tablets", slug: "tablets", categoryId: "51e466b1-ddad-4288-a500-3db2747cb93d" },
  { name: "Streaming Devices", slug: "streaming", categoryId: "da4753e7-88ff-42d3-8276-f147dbea4304" },
  { name: "Wearables", slug: "wearables", categoryId: "757482d7-41d5-4044-94af-713cb4c9a763" },
];

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
    "Phone Cases",
    "Protectors",
    "Smartphones",
    "Android Phones",
    "iPhone Models",
    "Audio",
    "Smart Watch",
    "Charging Devices",
    "Power Banks",
    "Camera Lens Protectors",
    "Accessories",
    "Gaming",
  ];

  // Color mapping for each word
  const getColorForWord = (word: string): string => {
    const colorMap: Record<string, string> = {
      "Phone Cases": "text-purple-500",
      Protectors: "text-green-500",
      Smartphones: "text-blue-500",
      "Android Phones": "text-orange-500",
      "iPhone Models": "text-indigo-500",
      Audio: "text-pink-500",
      "Smart Watch": "text-red-500",
      "Charging Devices": "text-yellow-600",
      "Power Banks": "text-teal-500",
      "Camera Lens Protectors": "text-cyan-500",
      Accessories: "text-amber-600",
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
    "iPhone Models": Smartphone,
    Smartphones: Smartphone,
    Audio: Headphones,
    "Smart Watch": Watch,
    "Charging Devices": Cable,
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

// Subcategories data from your database
const SUBCATEGORIES_DATA: Record<string, Array<{ name: string; slug: string }>> = {
  // Smartphones subcategories
  "51feace1-d4fc-4c5b-939f-8cecee1f447b": [
    { name: "Galaxy S Series", slug: "galaxy-s-series" },
    { name: "Galaxy A Series", slug: "galaxy-a-series" },
    { name: "Galaxy M Series", slug: "galaxy-m-series" },
    { name: "Galaxy Z Series (Fold / Flip)", slug: "galaxy-z-series" },
    { name: "iPhone 11 – iPhone 17 lineup", slug: "iphone-11-17" },
    { name: "iPhone Pro / Pro Max", slug: "iphone-pro-pro-max" },
    { name: "iPhone SE", slug: "iphone-se" },
    { name: "Xiaomi flagship series (14, 15, 17)", slug: "xiaomi-flagship" },
    { name: "Xiaomi T Series", slug: "xiaomi-t-series" },
    { name: "Redmi A Series", slug: "redmi-a-series" },
    { name: "Redmi Note Series", slug: "redmi-note-series" },
    { name: "Redmi Number Series", slug: "redmi-number-series" },
    { name: "Poco C Series", slug: "poco-c-series" },
    { name: "Poco X Series", slug: "poco-x-series" },
    { name: "Poco F Series", slug: "poco-f-series" },
    { name: "Spark Series", slug: "tecno-spark" },
    { name: "Camon Series", slug: "tecno-camon" },
    { name: "Phantom Series", slug: "tecno-phantom" },
    { name: "Smart Series", slug: "infinix-smart" },
    { name: "Hot Series", slug: "infinix-hot" },
    { name: "Note Series", slug: "infinix-note" },
    { name: "Zero Series", slug: "infinix-zero" },
    { name: "A Series", slug: "oppo-a-series" },
    { name: "Reno Series", slug: "oppo-reno" },
    { name: "Find Series", slug: "oppo-find" },
    { name: "Y Series", slug: "vivo-y-series" },
    { name: "V Series", slug: "vivo-v-series" },
    { name: "X Series", slug: "vivo-x-series" },
    { name: "Nova Series", slug: "huawei-nova" },
    { name: "P Series", slug: "huawei-p-series" },
    { name: "Mate Series", slug: "huawei-mate" },
    { name: "Nokia", slug: "nokia" },
    { name: "Realme", slug: "realme" },
    { name: "Honor", slug: "honor" },
    { name: "Google Pixel Series", slug: "google-pixel" },
    { name: "OnePlus Number Series", slug: "oneplus-number" },
    { name: "OnePlus Nord Series", slug: "oneplus-nord" },
    { name: "Motorola", slug: "motorola" },
    { name: "Nothing Phone 1", slug: "nothing-phone-1" },
    { name: "Nothing Phone 2", slug: "nothing-phone-2" },
    { name: "Nothing Phone 3", slug: "nothing-phone-3" },
  ],
  // Protectors subcategories
  "ff82c901-6d28-4fd8-aeb0-f70c4ac7ab91": [
    { name: "Curved Screens", slug: "curved-screens" },
    { name: "Full Glue 900", slug: "full-glue-900" },
    { name: "UV 1000", slug: "uv-1000" },
    { name: "Ceramic Privacy", slug: "protectors-ceramic-privacy" },
    { name: "Glass Privacy", slug: "protectors-glass-privacy" },
  ],
  // Android Phones subcategories
  "4006f669-3bac-4633-8b22-964c6a8d98e7": [
    { name: "Normal / OG Glass", slug: "android-normal-og-glass" },
    { name: "Ceramic Matte", slug: "android-ceramic-matte" },
    { name: "Ceramic Privacy", slug: "android-ceramic-privacy" },
    { name: "Glass Privacy", slug: "android-glass-privacy" },
  ],
  // iPhone Models subcategories
  "21b261a2-7046-488e-8798-cc6b64a4f383": [
    { name: "Normal / OG Glass", slug: "iphone-normal-og-glass" },
    { name: "Glass Privacy", slug: "iphone-glass-privacy" },
    { name: "Ceramic Privacy", slug: "iphone-ceramic-privacy" },
  ],
  // Audio subcategories
  "42085990-1f6d-4417-9c63-74e560a612bf": [
    { name: "Headphones", slug: "headphones" },
    { name: "Earphones", slug: "earphones" },
    { name: "AirPods Pro", slug: "airpods-pro" },
    { name: "Neck Band", slug: "neck-band" },
    { name: "Space Buds", slug: "space-buds" },
    { name: "AirPods Cases", slug: "airpods-cases" },
  ],
  // Smart Watch subcategories
  "2fe2e5f4-86e9-47e6-9666-dad7cda508db": [
    { name: "Kids Smart Watch", slug: "kids-smart-watch" },
    { name: "Apple Watch", slug: "apple-watch" },
    { name: "Galaxy Watch", slug: "galaxy-watch" },
    { name: "Oraimo Watch", slug: "oraimo-watch" },
  ],
  // Charging Devices subcategories
  "df0e0cfd-32bd-4aaa-bbf7-6b74ba8d007e": [
    { name: "Apple Adapters", slug: "apple-adapters" },
    { name: "Samsung Adapters", slug: "samsung-adapters" },
    { name: "Complete Chargers (25W / 45W / 65W)", slug: "complete-chargers" },
    { name: "USB Cables", slug: "usb-cables" },
    { name: "Type-C Cables", slug: "type-c-cables" },
    { name: "Lightning Cables", slug: "lightning-cables" },
    { name: "C to C Cables", slug: "c-to-c-cables" },
    { name: "USB to Micro", slug: "usb-to-micro" },
    { name: "USB to C", slug: "usb-to-c" },
    { name: "AUX Cables", slug: "aux-cables" },
    { name: "Car Charger", slug: "car-charger" },
  ],
  // Power Banks subcategories
  "b9042c4a-5f2f-4d6f-ae65-32e215a6ec08": [
    { name: "Wired Power Banks", slug: "wired-power-banks" },
    { name: "Battery Pack", slug: "battery-pack" },
    { name: "Wireless Power Bank", slug: "wireless-power-bank" },
    { name: "Fast Charging Power Bank", slug: "fast-charging-power-bank" },
  ],
  // Camera Lens Protectors subcategories
  "4ec7d508-05af-4408-a3a1-05e2352a3f9e": [
    { name: "Glitter Lens Protectors", slug: "glitter-lens-protectors" },
    { name: "Normal Lens Protectors", slug: "normal-lens-protectors" },
    { name: "Octagon Lens Protectors", slug: "octagon-lens-protectors" },
  ],
  // Accessories subcategories
  "4379046f-17bf-40f0-9238-052a68af0391": [
    { name: "Phone Charms", slug: "phone-charms" },
    { name: "Gents Phone Charms", slug: "gents-phone-charms" },
    { name: "Phone Lanyards", slug: "phone-lanyards" },
    { name: "Crossbody Phone Lanyards", slug: "crossbody-phone-lanyards" },
    { name: "Waterproof Bags", slug: "waterproof-bags" },
    { name: "Fluffy Charms", slug: "fluffy-charms" },
    { name: "Marble Charms", slug: "marble-charms" },
    { name: "Fabric Charms", slug: "fabric-charms" },
    { name: "Charger Protectors", slug: "charger-protectors" },
    { name: "iPhone Charger Protectors", slug: "iphone-charger-protectors" },
    { name: "Samsung Charger Protectors", slug: "samsung-charger-protectors" },
    { name: "S Pen", slug: "s-pen" },
  ],
  // Phone Holders subcategories
  "c3ed521b-8891-4828-98f7-2ddee125b642": [
    { name: "Car Phone Holder", slug: "car-phone-holder" },
    { name: "Magnetic Phone Holder", slug: "magnetic-phone-holder" },
    { name: "Gimbal", slug: "gimbal" },
    { name: "Phone Stand", slug: "phone-stand" },
  ],
  // Gaming subcategories
  "06dfd5a5-6568-4788-bd85-562f591ee1bf": [
    { name: "PS5", slug: "ps5" },
    { name: "Controllers", slug: "controllers" },
  ],
  // MagSafe Cases subcategories
  "24476a4e-7f81-4e0a-a80d-b0a728a6035a": [
    { name: "Premium Leather Cases", slug: "premium-leather-cases" },
    { name: "Cases with Lens Protectors", slug: "cases-with-lens-protectors" },
    { name: "Fancy Cases", slug: "fancy-cases" },
    { name: "Frosted Cases", slug: "frosted-cases" },
    { name: "3-in-1 Cases", slug: "3-in-1-cases" },
    { name: "360 Cases", slug: "360-cases" },
    { name: "Converter Cases", slug: "converter-cases" },
  ],
  // Stickers subcategories
  "f1c70937-6e84-477b-bb9a-912638228584": [
    { name: "Laptop Stickers", slug: "laptop-stickers" },
    { name: "Phone Stickers", slug: "phone-stickers" },
    { name: "Console Stickers", slug: "console-stickers" },
    { name: "Machine Cut Phone Stickers", slug: "machine-cut-phone-stickers" },
  ],
  // Phone Cases subcategories
  "8feca2ff-0436-48ae-92ce-226b98944c0c": [
    { name: "Leather Case", slug: "leather-case" },
    { name: "3D Pop Socket Cases", slug: "3d-pop-socket-cases" },
    { name: "MagSafe Cases", slug: "magsafe-cases-sub" },
    { name: "Clear Cases", slug: "clear-cases" },
    { name: "Tribal Cases", slug: "tribal-cases" },
    { name: "Customized Cases", slug: "customized-cases" },
    { name: "Leather Flip Cases", slug: "leather-flip-cases" },
    { name: "Silicone Cases", slug: "silicone-cases" },
    { name: "Soft Silicone Cases", slug: "soft-silicone-cases" },
    { name: "Metallic Cases", slug: "metallic-cases" },
    { name: "Vegan Cases", slug: "vegan-cases" },
    { name: "Floral Cases", slug: "floral-cases" },
    { name: "Bow Cases", slug: "bow-cases" },
  ],
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

  // Get subcategories for a category by slug
  const getSubcategoriesForCategory = (categorySlug: string) => {
    const category = MAIN_CATEGORIES.find(c => c.slug === categorySlug);
    if (category && SUBCATEGORIES_DATA[category.categoryId]) {
      return SUBCATEGORIES_DATA[category.categoryId];
    }
    return [];
  };

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

  // Get subcategories for the hovered category
  const hoveredSubcategories = hoveredCategory ? getSubcategoriesForCategory(hoveredCategory) : [];
  const mobileHoveredSubcategories = mobileHoveredCategory ? getSubcategoriesForCategory(mobileHoveredCategory) : [];

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
                  ? selectedSubcategory
                  : selectedCategory
                    ? MAIN_CATEGORIES.find(c => c.slug === selectedCategory)?.name || "All Categories"
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
                    <div className="space-y-1 border-t border-white/10 md:border-t-0 md:border-l md:pl-2">
                      <div className="px-4 py-2 text-xs uppercase tracking-wide text-white/50">
                        Subcategories
                      </div>
                      {dropdownCategory ? (
                        <div className="max-h-80 overflow-y-auto">
                          {getSubcategoriesForCategory(dropdownCategory).map((sub) => (
                            <button
                              key={sub.slug}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(dropdownCategory);
                                setSelectedSubcategory(sub.name);
                                setShowCategoryDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/10 ${
                                selectedSubcategory === sub.name
                                  ? "bg-white/10 font-medium"
                                  : ""
                              } text-white`}
                            >
                              {sub.name}
                            </button>
                          ))}
                          {getSubcategoriesForCategory(dropdownCategory).length === 0 && (
                            <p className="px-4 py-2 text-sm text-white/40">
                              No subcategories available
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="px-4 py-2 text-sm text-white/40">
                          Select a category to see subcategories
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

          {/* Desktop Hover Dropdown - Now works for ALL categories */}
          {hoveredCategory && currentCategory && hoveredElement && hoveredSubcategories.length > 0 && (
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

                    {hoveredSubcategories.map((subcategory) => (
                      <button
                        key={subcategory.slug}
                        className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition-colors flex items-center justify-between group text-white"
                        onClick={() => {
                          navigate(
                            `/products?category=${hoveredCategory}&subcategory=${encodeURIComponent(subcategory.name)}`,
                          );
                          setHoveredCategory(null);
                        }}
                      >
                        <span>{subcategory.name}</span>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
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

          {/* Mobile Hover Dropdown - Now works for ALL categories */}
          {mobileHoveredCategory && currentMobileCategory && mobileHoveredSubcategories.length > 0 && (
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

                    {mobileHoveredSubcategories.map((subcategory) => (
                      <button
                        key={subcategory.slug}
                        className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 transition-colors flex items-center justify-between group text-white"
                        onClick={() => {
                          navigate(
                            `/products?category=${mobileHoveredCategory}&subcategory=${encodeURIComponent(subcategory.name)}`,
                          );
                          setMobileHoveredCategory(null);
                        }}
                      >
                        <span className="text-sm">{subcategory.name}</span>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-pulse {
          animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </header>
  );
};

export default Header;