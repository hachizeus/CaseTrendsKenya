import { Truck, Shield, Headphones, CreditCard, Zap, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Shield, title: "Genuine Products", desc: "100% authentic with warranty", color: "from-blue-500 to-cyan-500" },
  { icon: Headphones, title: "24/7 Support", desc: "WhatsApp & call anytime", color: "from-green-500 to-emerald-500" },
  { icon: CreditCard, title: "M-Pesa Accepted", desc: "Easy mobile payment", color: "from-purple-500 to-pink-500" },
  { icon: Truck, title: "Fast Delivery", desc: "Nairobi within 24hrs", color: "from-primary to-pink-500" },
];

const FeatureStrip = () => (
  <section className="relative bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)] border-y border-white/5 overflow-hidden">
    {/* Glowing background effect */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,hsl(330,100%,54%,0.05),transparent_70%)] pointer-events-none" />
    
    <div className="container relative">
      <div className="grid grid-cols-2 md:grid-cols-4">
        {features.map((f, i) => (
          <motion.div 
            key={f.title} 
            className={`flex items-center gap-3 px-4 sm:px-6 py-5 sm:py-6 group relative overflow-hidden ${
              i > 1 ? "border-t border-white/5 md:border-t-0" : ""
            } ${i !== 3 ? "md:border-r border-white/5" : ""}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            {/* Hover gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Icon container with gradient */}
            <div className={`relative p-2.5 rounded-xl bg-gradient-to-br ${f.color} bg-opacity-10 flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <f.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            
            <div>
              <p className="text-xs sm:text-sm font-semibold text-white group-hover:text-primary transition-colors">
                {f.title}
              </p>
              <p className="text-[10px] sm:text-xs text-white/50 group-hover:text-white/70 transition-colors mt-0.5">
                {f.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeatureStrip;