import { Link } from "react-router-dom";
import { Smartphone, Tablet, Headphones, Gamepad2, Watch, Cable, Tv, Camera, Laptop, Speaker, Battery, Wifi, type LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Smartphone, Tablet, Headphones, Gamepad2, Watch, Cable, Tv, Camera, Laptop, Speaker, Battery, Wifi,
};

const homepageNavItems = [
  { label: "All Accessories", to: "/products", icon: "Smartphone" },
  { label: "Phone Cases", to: "/products?category=Phone%20Cases", icon: "Cable" },
  { label: "Wearables", to: "/products?category=Wearables", icon: "Watch" },
  { label: "Audio & Earbuds", to: "/products?category=Audio%20%26%20Earbuds", icon: "Headphones" },
  { label: "Screen Protectors", to: "/products?category=Screen%20Protectors", icon: "Battery" },
];

const CategoryNav = () => {
  return (
    <nav className="bg-card border-b border-border">
      <div className="container">
        <ul className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {homepageNavItems.map((item) => {
            const Icon = iconMap[item.icon] || Smartphone;
            return (
              <li key={item.label} className="flex-shrink-0">
                <Link
                  to={item.to}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium text-nav-foreground hover:text-nav-hover transition-colors whitespace-nowrap"
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default CategoryNav;
