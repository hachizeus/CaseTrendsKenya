import { Smartphone, Tablet, Headphones, Gamepad2, Watch, Cable, Tv, ChevronDown } from "lucide-react";

const categories = [
  { name: "Smartphones", icon: Smartphone, hasDropdown: true },
  { name: "Tablets & iPads", icon: Tablet },
  { name: "Audio", icon: Headphones, hasDropdown: true },
  { name: "Gaming", icon: Gamepad2 },
  { name: "Wearables", icon: Watch },
  { name: "Accessories", icon: Cable },
  { name: "Streaming Devices", icon: Tv },
];

const CategoryNav = () => (
  <nav className="bg-card border-b border-border hidden md:block">
    <div className="container">
      <ul className="flex items-center gap-1">
        {categories.map((cat) => (
          <li key={cat.name}>
            <a
              href="#"
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-nav-foreground hover:text-nav-hover transition-colors"
            >
              <cat.icon className="w-4 h-4" />
              {cat.name}
              {cat.hasDropdown && <ChevronDown className="w-3 h-3 opacity-50" />}
            </a>
          </li>
        ))}
      </ul>
    </div>
  </nav>
);

export default CategoryNav;
