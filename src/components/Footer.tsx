import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getDisplayCategoryName } from "@/lib/utils";

const TikTokIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.321 5.562a5.122 5.122 0 0 1-.868-.082 3.04 3.04 0 0 1-1.075-.46 3.04 3.04 0 0 1-.77-.96 3.04 3.04 0 0 1-.494-1.256V1h-3.638v13.558a2.29 2.29 0 0 1-4.44.205 2.289 2.289 0 0 1 2.232-2.555 2.29 2.29 0 0 1 .85.155v-3.68a6.018 6.018 0 0 0-5.868 5.97c0 3.315 2.686 6 6 6s6-2.685 6-6v-3.248a7.558 7.558 0 0 0 4.87 1.858V8.84a4.35 4.35 0 0 1-1.809-.458Z"/>
  </svg>
);

const Footer = () => {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("categories").select("name, slug").eq("is_active", true).order("display_order").limit(6)
      .then(({ data }) => setCategories(data || []));
  }, []);

  return (
    <footer className="bg-black text-white">
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="font-display font-bold text-lg mb-4">Case Trends Kenya</h3>
            <p className="text-sm text-gray-400 mb-4">Your trusted electronics store in Kenya. Genuine products, warranty, and free delivery across Nairobi.</p>
            <div className="flex gap-3">
              <a href="https://www.instagram.com/casetrends_kenya/?hl=en" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors"><Instagram className="w-4 h-4" /></a>
              <a href="https://www.tiktok.com/@casetrendskenya" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors"><TikTokIcon /></a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
              {categories.map(cat => (
                <li key={cat.slug}>
                  <Link to={`/products?category=${encodeURIComponent(cat.name)}`} className="hover:text-white transition-colors">
                    {getDisplayCategoryName(cat.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/products" className="hover:text-white transition-colors">Shop</Link></li>
              <li><Link to="/favorites" className="hover:text-white transition-colors">Wishlist</Link></li>
              <li><Link to="/auth" className="hover:text-white transition-colors">My Account</Link></li>
              <li><Link to="/checkout" className="hover:text-white transition-colors">Checkout</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +254 707 177 657  | +254 714 204 271</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 flex-shrink-0" /> <span className="break-all">support@casetrendskenya.co.ke</span></li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Nairobi, Kenya</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800">
        <div className="container py-4 text-center text-xs text-gray-600">
          © 2026 Case Trends Kenya. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
