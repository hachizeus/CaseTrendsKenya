import { Link } from "react-router-dom";
import { Shield, Smartphone, Phone, Headphones, Gamepad2, Watch, Cable, Camera, Laptop, Tag, Battery, type LucideIcon } from "lucide-react";
import { MAIN_CATEGORIES } from "@/lib/categoryData";

const iconMap: Record<string, LucideIcon> = {
  Shield,
  Smartphone,
  Phone,
  Headphones,
  Gamepad2,
  Watch,
  Cable,
  Camera,
  Laptop,
  Tag,
  Battery,
};

const homepageNavItems = MAIN_CATEGORIES.map((category) => ({
  label: category.name,
  to: `/products?category=${encodeURIComponent(category.slug)}`,
  icon: category.icon,
}));

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
