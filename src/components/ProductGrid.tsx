import ProductCard from "./ProductCard";

const products = [
  {
    name: "Samsung Galaxy S25 Ultra",
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop",
    price: 185000,
    originalPrice: 199000,
    category: "Smartphones",
    brand: "Samsung",
    badge: "sale" as const,
  },
  {
    name: "iPhone 16 Pro Max 256GB",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop",
    price: 210000,
    category: "Smartphones",
    brand: "Apple",
    badge: "new" as const,
  },
  {
    name: "Google Pixel 9 Pro",
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop",
    price: 145000,
    category: "Smartphones",
    brand: "Google",
  },
  {
    name: "Xiaomi Redmi Note 14 Pro",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
    price: 32000,
    originalPrice: 35000,
    category: "Smartphones",
    brand: "Xiaomi",
    badge: "sale" as const,
  },
  {
    name: "Tecno Camon 30 Premier",
    image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop",
    price: 42000,
    category: "Smartphones",
    brand: "Tecno",
    badge: "new" as const,
  },
  {
    name: "Samsung Galaxy Z Fold 6",
    image: "https://images.unsplash.com/photo-1628744876497-eb30460be9f6?w=400&h=400&fit=crop",
    price: 265000,
    originalPrice: 280000,
    category: "Smartphones",
    brand: "Samsung",
    badge: "sale" as const,
  },
  {
    name: "JBL Tune 770NC Wireless",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    price: 12500,
    category: "Audio",
    brand: "JBL",
  },
  {
    name: "iPad Air M2 11-inch",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop",
    price: 95000,
    category: "Tablets",
    brand: "Apple",
    badge: "new" as const,
  },
  {
    name: "Anker 10000mAh Power Bank",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop",
    price: 6000,
    category: "Accessories",
    brand: "Anker",
  },
  {
    name: "Infinix Hot 50 Pro+",
    image: "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400&h=400&fit=crop",
    price: 22000,
    category: "Smartphones",
    brand: "Infinix",
  },
];

const ProductGrid = () => (
  <section id="products" className="pb-12">
    <div className="container">
      <h2 className="text-xl sm:text-2xl font-bold mb-6">Latest in Stock</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map((product, i) => (
          <ProductCard key={product.name} {...product} index={i} />
        ))}
      </div>
    </div>
  </section>
);

export default ProductGrid;
