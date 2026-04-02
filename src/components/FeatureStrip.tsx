import { Truck, Shield, Headphones, CreditCard } from "lucide-react";

const features = [
  { icon: Truck, title: "Free Delivery", desc: "Orders over KSh 5,000" },
  { icon: Shield, title: "Genuine Products", desc: "100% authentic items" },
  { icon: Headphones, title: "24/7 Support", desc: "WhatsApp & call" },
  { icon: CreditCard, title: "M-Pesa Accepted", desc: "Easy mobile payment" },
];

const FeatureStrip = () => (
  <section className="py-8 border-t border-border">
    <div className="container">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {features.map((f) => (
          <div key={f.title} className="flex items-center gap-3 p-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <f.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeatureStrip;
