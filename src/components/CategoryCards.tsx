import { motion } from "framer-motion";
import { Smartphone, Tablet, Headphones, Watch } from "lucide-react";

const categories = [
  { name: "Smartphones", icon: Smartphone, color: "from-blue-500 to-cyan-400", count: "120+ Products" },
  { name: "Tablets & iPads", icon: Tablet, color: "from-violet-500 to-purple-400", count: "45+ Products" },
  { name: "Audio & Earbuds", icon: Headphones, color: "from-orange-500 to-amber-400", count: "80+ Products" },
  { name: "Smart Watches", icon: Watch, color: "from-emerald-500 to-teal-400", count: "35+ Products" },
];

const CategoryCards = () => (
  <section className="py-8">
    <div className="container">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat, i) => (
          <motion.a
            key={cat.name}
            href="#"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${cat.color} p-6 text-primary-foreground group hover:scale-[1.02] transition-transform`}
          >
            <cat.icon className="w-10 h-10 mb-3 opacity-90" />
            <h3 className="font-bold text-sm sm:text-base">{cat.name}</h3>
            <p className="text-xs opacity-80 mt-1">{cat.count}</p>
          </motion.a>
        ))}
      </div>
    </div>
  </section>
);

export default CategoryCards;
