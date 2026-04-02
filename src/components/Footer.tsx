import { Phone, Mail, MapPin, Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => (
  <footer className="bg-topbar text-topbar-foreground">
    <div className="container py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <h3 className="font-display font-bold text-lg mb-4">TechMobile KE</h3>
          <p className="text-sm opacity-70 mb-4">Your trusted electronics store in Kenya. Genuine products, warranty, and free delivery across Nairobi.</p>
          <div className="flex gap-3">
            <a href="#" className="p-2 rounded-lg bg-muted/10 hover:bg-primary transition-colors"><Facebook className="w-4 h-4" /></a>
            <a href="#" className="p-2 rounded-lg bg-muted/10 hover:bg-primary transition-colors"><Instagram className="w-4 h-4" /></a>
            <a href="#" className="p-2 rounded-lg bg-muted/10 hover:bg-primary transition-colors"><Twitter className="w-4 h-4" /></a>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm opacity-70">
            <li><a href="#" className="hover:opacity-100 transition-opacity">Smartphones</a></li>
            <li><a href="#" className="hover:opacity-100 transition-opacity">Tablets & iPads</a></li>
            <li><a href="#" className="hover:opacity-100 transition-opacity">Audio & Earbuds</a></li>
            <li><a href="#" className="hover:opacity-100 transition-opacity">Accessories</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Customer Service</h4>
          <ul className="space-y-2 text-sm opacity-70">
            <li><a href="#" className="hover:opacity-100 transition-opacity">About Us</a></li>
            <li><a href="#" className="hover:opacity-100 transition-opacity">Delivery Info</a></li>
            <li><a href="#" className="hover:opacity-100 transition-opacity">Return Policy</a></li>
            <li><a href="#" className="hover:opacity-100 transition-opacity">Warranty</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Contact Us</h4>
          <ul className="space-y-3 text-sm opacity-70">
            <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +254 700 123 456</li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@techmobileke.com</li>
            <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Nairobi, Kenya</li>
          </ul>
        </div>
      </div>
    </div>
    <div className="border-t border-muted/10">
      <div className="container py-4 text-center text-xs opacity-50">
        © 2026 TechMobile KE. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
