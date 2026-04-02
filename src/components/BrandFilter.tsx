import { useState } from "react";

const brands = [
  "All Brands", "Samsung", "Apple", "Xiaomi", "Tecno", "Infinix",
  "Oppo", "Vivo", "Huawei", "OnePlus", "Nothing", "Motorola", "JBL"
];

const BrandFilter = () => {
  const [active, setActive] = useState("All Brands");

  return (
    <section className="py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl sm:text-2xl font-bold">What's Popular Now</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => setActive(brand)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                active === brand
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandFilter;
