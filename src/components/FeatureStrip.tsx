import { Truck, Shield, Headphones, CreditCard } from "lucide-react";

const features = [
  { icon: Truck, title: "Free Delivery", desc: "Orders over KSh 5,000" },
  { icon: Shield, title: "Genuine Products", desc: "100% authentic with warranty" },
  { icon: Headphones, title: "24/7 Support", desc: "WhatsApp & call anytime" },
  { icon: CreditCard, title: "M-Pesa Accepted", desc: "Easy mobile payment" },
];

const FeatureStrip = () => (
  <section className="bg-foreground text-background">
    <div className="container">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-background/10">
        {features.map((f, i) => (
          <div key={f.title} className={`flex items-center gap-3 px-4 sm:px-6 py-5 sm:py-6 ${i > 1 ? "border-t border-background/10 md:border-t-0" : ""}`}>
            <div className="p-2 border border-background/20 flex-shrink-0">
              <f.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold">{f.title}</p>
              <p className="text-[10px] sm:text-xs text-background/60 mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeatureStrip;
