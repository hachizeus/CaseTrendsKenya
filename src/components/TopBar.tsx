import { Phone, Mail, MapPin } from "lucide-react";

const TopBar = () => (
  <div className="bg-topbar text-topbar-foreground text-xs py-2 hidden md:block">
    <div className="container flex justify-between items-center">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <Phone className="w-3 h-3" /> +254 707 177 657  | +254 714 204 2716
        </span>
        <span className="flex items-center gap-1.5">
          <Mail className="w-3 h-3" /> support@casetrendskenya.co.ke
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <MapPin className="w-3 h-3" /> Nairobi, Kenya — Free delivery on orders over KSh 5,000
      </div>
    </div>
  </div>
);

export default TopBar;
