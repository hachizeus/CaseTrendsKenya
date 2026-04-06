import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const TikTokIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.1 1.86 2.89 2.89 0 0 1 5.1-1.86v-3.33a6.15 6.15 0 0 0-6.04 6.3 6.15 6.15 0 0 0 6.04 6.3 6.04 6.04 0 0 0 6.3-6.3V8.93a7.86 7.86 0 0 0 4.57-1.94v-3.3a4.85 4.85 0 0 1-.92.08z"/>
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
                    {cat.name}
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
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +254 700 123 456</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 flex-shrink-0" /> <span className="break-all">elitjohnsdigital@gmail.com</span></li>
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
