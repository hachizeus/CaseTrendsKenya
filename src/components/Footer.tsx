import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Instagram, Facebook, Youtube } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getDisplayCategoryName } from "@/lib/utils";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.321 5.562a5.122 5.122 0 0 1-.868-.082 3.04 3.04 0 0 1-1.075-.46 3.04 3.04 0 0 1-.77-.96 3.04 3.04 0 0 1-.494-1.256V1h-3.638v13.558a2.29 2.29 0 0 1-4.44.205 2.289 2.289 0 0 1 2.232-2.555 2.29 2.29 0 0 1 .85.155v-3.68a6.018 6.018 0 0 0-5.868 5.97c0 3.315 2.686 6 6 6s6-2.685 6-6v-3.248a7.558 7.558 0 0 0 4.87 1.858V8.84a4.35 4.35 0 0 1-1.809-.458Z"/>
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.077 4.928C17.191 3.041 14.683 2 12.006 2 6.478 2 2 6.477 2 12.006c0 1.764.46 3.483 1.336 5.002L2 22l5.143-1.352c1.456.79 3.104 1.208 4.863 1.208h.004c5.527 0 10.006-4.477 10.006-9.994 0-2.673-1.041-5.18-2.935-6.934zm-7.07 15.389h-.003c-1.518 0-3.007-.407-4.306-1.176l-.308-.183-3.05.802.814-2.976-.2-.318a8.475 8.475 0 0 1-1.302-4.456c0-4.66 3.795-8.456 8.46-8.456 2.26 0 4.382.88 5.977 2.476a8.4 8.4 0 0 1 2.476 5.98c0 4.66-3.796 8.456-8.46 8.456h-.004zm4.64-6.336c-.255-.127-1.505-.743-1.739-.828-.233-.085-.403-.127-.573.127-.17.255-.658.828-.807.998-.148.17-.297.191-.552.064-.254-.128-1.076-.397-2.05-1.266-.758-.676-1.27-1.512-1.418-1.767-.149-.255-.016-.393.111-.52.114-.114.255-.297.382-.446.127-.148.17-.255.255-.425.085-.17.042-.318-.021-.446-.064-.127-.573-1.38-.785-1.89-.207-.495-.417-.428-.573-.436-.148-.008-.318-.01-.488-.01-.17 0-.445.064-.678.318-.234.255-.891.87-.891 2.123 0 1.253.913 2.464 1.04 2.634.127.17 1.797 2.745 4.354 3.85.608.262 1.083.418 1.453.536.61.194 1.166.167 1.606.101.49-.073 1.505-.615 1.717-1.21.212-.594.212-1.103.148-1.21-.063-.106-.233-.17-.488-.297z"/>
  </svg>
);

const SocialIconButton = ({ href, label, icon: Icon, hoverColor }: any) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/70 transition-all duration-300 hover:scale-110"
    onMouseEnter={(e) => (e.currentTarget.style.color = hoverColor)}
    onMouseLeave={(e) => (e.currentTarget.style.color = '')}
  >
    <Icon className="w-4 h-4" />
  </a>
);

const Footer = () => {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    (supabase.from("categories") as any)
      .select("*")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => setCategories(data || []));
  }, []);

  // Custom display names for specific categories
  const getFooterDisplayName = (categoryName: string): string => {
    if (categoryName === "Android Phones (Protectors)") return "Android Phones";
    if (categoryName === "iPhone Model (Protectors)") return "iPhone Models";
    return getDisplayCategoryName(categoryName);
  };

  return (
    <footer className="bg-[#0a0a0a] text-white border-t border-white/5 pt-16">
      <div className="container mx-auto px-6 lg:px-12 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img src="/logo.webp" alt="Logo" className="h-10 w-auto" />
              <div className="flex flex-col leading-none">
                <span className="font-bold text-xl uppercase tracking-wider text-white">Case Trends</span>
                <span className="font-bold text-xs uppercase tracking-[0.3em] text-[#ec4899] mt-1">Kenya</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Your one-stop shop for premium phone accessories in Kenya. Quality. Style. Protection.
            </p>
            <div className="flex gap-3">
              <SocialIconButton href="#" icon={Instagram} hoverColor="#E4405F" />
              <SocialIconButton href="#" icon={TikTokIcon} hoverColor="#00f2ea" />
              <SocialIconButton href="#" icon={Facebook} hoverColor="#1877F2" />
              <SocialIconButton href="#" icon={WhatsAppIcon} hoverColor="#25D366" />
            </div>
          </div>

          {/* Quick Links Column - Manual Links */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest mb-6">Quick Links</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/products" className="hover:text-[#ec4899] transition-colors">All Products</Link></li>
              <li><Link to="/products?category=smartphones" className="hover:text-[#ec4899] transition-colors">Smartphones</Link></li>
              <li><Link to="/products?category=android-phones" className="hover:text-[#ec4899] transition-colors">Android Phones</Link></li>
              <li><Link to="/products?category=iphone-model" className="hover:text-[#ec4899] transition-colors">iPhone Models</Link></li>
              <li><Link to="/products?category=protectors" className="hover:text-[#ec4899] transition-colors">Protectors</Link></li>
              <li><Link to="/products?category=audio" className="hover:text-[#ec4899] transition-colors">Audio</Link></li>
              <li><Link to="/products?category=phone-cases" className="hover:text-[#ec4899] transition-colors">Phone Cases</Link></li>
              <li><Link to="/products?category=charging-devices" className="hover:text-[#ec4899] transition-colors">Charging Devices</Link></li>
              <li><Link to="/products?category=gaming" className="hover:text-[#ec4899] transition-colors">Gaming</Link></li>
              <li><Link to="/products?category=tablets" className="hover:text-[#ec4899] transition-colors">Tablets & iPads</Link></li>
            </ul>
          </div>

          {/* Customer Service Column */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest mb-6">Customer Service</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/products" className="hover:text-[#ec4899] transition-colors">Shop</Link></li>
              <li><Link to="/favorites" className="hover:text-[#ec4899] transition-colors">Wishlist</Link></li>
              <li><Link to="/auth" className="hover:text-[#ec4899] transition-colors">My Account</Link></li>
              <li><Link to="/checkout" className="hover:text-[#ec4899] transition-colors">Checkout</Link></li>
              <li><Link to="/contact" className="hover:text-[#ec4899] transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Contact Us Column */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest mb-6">Contact Us</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-0.5 text-[#ec4899]" />
                <span>+254 707 177 657 | +254 714 204 271</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-0.5 text-[#ec4899]" />
                <span className="break-all">support@casetrendskenya.co.ke</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-[#ec4899]" />
                <div>
                  <p>Mithoo Business Center, Moi Avenue</p>
                  <p className="text-xs text-gray-500">1st Floor Shop F06/F07 (opposite The Bazaar)</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="bg-black py-8 border-t border-white/5">
        <div className="container mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">
              © 2026 Case Trends Kenya. All Rights Reserved.
            </p>
          </div>
          
          {/* Payment Logos */}
          <div className="flex items-center gap-6">
            <img 
              src="https://www.logo.wine/a/logo/Visa_Inc./Visa_Inc.-Logo.wine.svg" 
              alt="Visa" 
              className="h-10 transition-transform hover:scale-105 bg-transparent" 
            />
            <img 
              src="https://www.logo.wine/a/logo/Mastercard/Mastercard-Logo.wine.svg" 
              alt="Mastercard" 
              className="h-10 transition-transform hover:scale-105 bg-transparent" 
            />
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" 
              alt="M-Pesa" 
              className="h-8 transition-transform hover:scale-105 bg-transparent" 
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;