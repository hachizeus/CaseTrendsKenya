import { Truck, Shield, Headphones, CreditCard } from "lucide-react";

const features = [
  { icon: Shield, title: "Genuine Products", desc: "100% authentic with warranty" },
  { icon: Headphones, title: "24/7 Support", desc: "WhatsApp & call anytime" },
  { icon: CreditCard, title: "M-Pesa Accepted", desc: "Easy mobile payment" },
];

const FeatureStrip = () => (
  <section className="bg-black text-white border-t border-b border-gray-800">
    <div className="container">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-800">
        {features.map((f, i) => (
          <div key={f.title} className={`flex items-center gap-3 px-4 sm:px-6 py-5 sm:py-6 ${i > 1 ? "border-t border-gray-800 md:border-t-0" : ""}`}>
            <div className="p-2 border border-gray-700 flex-shrink-0 bg-gray-900">
              <f.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-white">{f.title}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeatureStrip;
