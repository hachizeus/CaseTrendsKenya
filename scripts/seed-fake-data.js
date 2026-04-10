import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const FAKE_ORDER_NOTE = "FAKE_SEED";
const FAKE_REVIEW_COMMENT = "FAKE_REVIEW_SEED";
const PAYSTACK_REF_PREFIX = "seed_paystack_ref_";

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function formatISODate(date) {
  return date.toISOString();
}

function randomDateWithinDays(days) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * days));
  date.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);
  return date;
}

async function getValidUserIds() {
  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("user_id");

  if (!profileError && profileRows?.length) {
    return profileRows.map((row) => row.user_id);
  }

  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (!error && data?.users?.length) {
      return data.users.map((user) => user.id);
    }
  } catch (err) {
    console.warn("Unable to fetch auth users for seeding reviews:", err);
  }

  return [];
}

async function cleanupFakeData() {
  console.log("Cleaning up any existing fake seeded data...");

  const { data: fakeProductIds, error: fakeProductIdsError } = await supabase
    .from("products")
    .select("id")
    .ilike("name", "Fake %");

  if (fakeProductIdsError) {
    console.warn("Unable to query fake products:", fakeProductIdsError.message || fakeProductIdsError);
  }

  const productIds = (fakeProductIds || []).map((item) => item.id);

  const cleanupSteps = [
    async () => {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .like("paystack_ref", `${PAYSTACK_REF_PREFIX}%`);
      if (error) console.warn("Transactions cleanup failed:", error.message || error);
    },
    async () => {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("notes", FAKE_ORDER_NOTE);
      if (error) console.warn("Orders cleanup failed:", error.message || error);
    },
    async () => {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("comment", FAKE_REVIEW_COMMENT);
      if (error) console.warn("Reviews cleanup failed:", error.message || error);
    },
    async () => {
      if (productIds.length === 0) return;
      const { error } = await supabase
        .from("product_images")
        .delete()
        .in("product_id", productIds);
      if (error) console.warn("Product images cleanup failed:", error.message || error);
    },
    async () => {
      const { error } = await supabase
        .from("products")
        .delete()
        .ilike("name", "Fake %");
      if (error) console.warn("Products cleanup failed:", error.message || error);
    },
    async () => {
      const { error } = await supabase
        .from("categories")
        .delete()
        .ilike("name", "Fake %");
      if (error) console.warn("Categories cleanup failed:", error.message || error);
    },
    async () => {
      const { error } = await supabase
        .from("hero_slides")
        .delete()
        .ilike("title", "Fake %");
      if (error) console.warn("Hero slides cleanup failed:", error.message || error);
    },
  ];

  for (const step of cleanupSteps) {
    await step();
  }

  console.log("Cleanup complete.");
}

async function seedFakeData() {
  console.log("Seeding fake site data...");
  await cleanupFakeData();

  const categories = [
    { name: "Fake Electronics", slug: "fake-electronics", icon: "sparkles", display_order: 1, is_active: true },
    { name: "Fake Home", slug: "fake-home", icon: "home", display_order: 2, is_active: true },
    { name: "Fake Fashion", slug: "fake-fashion", icon: "tshirt", display_order: 3, is_active: true },
    { name: "Fake Beauty", slug: "fake-beauty", icon: "heart", display_order: 4, is_active: true },
    { name: "Fake Sports", slug: "fake-sports", icon: "activity", display_order: 5, is_active: true },
  ];

  const { data: insertedCategories, error: categoriesError } = await supabase
    .from("categories")
    .insert(categories)
    .select();

  if (categoriesError) {
    console.error("Failed to insert categories:", categoriesError.message || categoriesError);
    process.exit(1);
  }

  const categoryNames = insertedCategories.map((category) => category.name);
  const productTemplates = [
    { name: "Fake Wireless Earbuds", brand: "SkyTone", category: "Fake Electronics", price: 2799, stock_status: "in_stock" },
    { name: "Fake Smart Speaker", brand: "EchoWave", category: "Fake Electronics", price: 6499, stock_status: "in_stock" },
    { name: "Fake Portable Charger", brand: "VoltMax", category: "Fake Electronics", price: 1999, stock_status: "low_stock" },
    { name: "Fake Air Purifier", brand: "BreezyHome", category: "Fake Home", price: 8999, stock_status: "in_stock" },
    { name: "Fake LED Desk Lamp", brand: "GlowLite", category: "Fake Home", price: 2499, stock_status: "in_stock" },
    { name: "Fake Denim Jacket", brand: "StreetFlex", category: "Fake Fashion", price: 5499, stock_status: "in_stock" },
    { name: "Fake Running Shoes", brand: "SprintPro", category: "Fake Sports", price: 4999, stock_status: "low_stock" },
    { name: "Fake Fitness Tracker", brand: "PulseFit", category: "Fake Sports", price: 3999, stock_status: "in_stock" },
    { name: "Fake Skincare Set", brand: "GlowUp", category: "Fake Beauty", price: 3199, stock_status: "in_stock" },
    { name: "Fake Fragrance Gift", brand: "AuraBloom", category: "Fake Beauty", price: 4299, stock_status: "in_stock" },
  ];

  const products = [];
  for (let i = 0; i < 30; i += 1) {
    const template = getRandomItem(productTemplates);
    const price = template.price + Math.floor(Math.random() * 2000) - 300;
    products.push({
      id: randomUUID(),
      name: `${template.name} ${i + 1}`,
      brand: template.brand,
      category: template.category,
      description: `${template.brand} ${template.name} with premium quality and fast shipping.`,
      price,
      original_price: Math.round(price * 1.15),
      stock_quantity: Math.floor(Math.random() * 50) + 10,
      stock_status: template.stock_status,
      is_featured: Math.random() > 0.6,
      is_trending: Math.random() > 0.5,
      sku: `FAKE-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      tags: ["fake", "demo", template.category.toLowerCase().split(" ")[1] || "item"],
      warranty: "1 year",
      weight: "1.2kg",
    });
  }

  const { error: productsError } = await supabase.from("products").insert(products);
  if (productsError) {
    console.error("Failed to insert fake products:", productsError.message || productsError);
    process.exit(1);
  }

  const productImages = products.flatMap((product, index) => [
    {
      image_url: `https://picsum.photos/seed/fakeprod-${index + 1}/600/600`,
      product_id: product.id,
      is_primary: true,
      display_order: 1,
    },
    {
      image_url: `https://picsum.photos/seed/fakeprod-${index + 1}-alt/600/600`,
      product_id: product.id,
      is_primary: false,
      display_order: 2,
    },
  ]);

  const { error: productImagesError } = await supabase.from("product_images").insert(productImages);
  if (productImagesError) {
    console.error("Failed to insert product images:", productImagesError.message || productImagesError);
    process.exit(1);
  }

  const heroSlides = [
    {
      title: "Fake Launch Sale",
      subtitle: "Explore the latest fake electronics and home essentials.",
      cta_text: "Shop Fake Deals",
      cta_link: "/products?category=Fake%20Electronics",
      image_url: "https://picsum.photos/seed/fake-hero-1/1200/600",
      is_active: true,
      display_order: 1,
    },
    {
      title: "Fake Favorites for Spring",
      subtitle: "Fresh fake fashion and beauty picks for every style.",
      cta_text: "Browse Fake Trends",
      cta_link: "/products?category=Fake%20Fashion",
      image_url: "https://picsum.photos/seed/fake-hero-2/1200/600",
      is_active: true,
      display_order: 2,
    },
    {
      title: "Fake Sports Essentials",
      subtitle: "Gear up with Paystack-ready fake orders and faster checkout.",
      cta_text: "View Fake Sports",
      cta_link: "/products?category=Fake%20Sports",
      image_url: "https://picsum.photos/seed/fake-hero-3/1200/600",
      is_active: true,
      display_order: 3,
    },
  ];

  const { error: heroSlidesError } = await supabase.from("hero_slides").insert(heroSlides);
  if (heroSlidesError) {
    console.error("Failed to insert hero slides:", heroSlidesError.message || heroSlidesError);
    process.exit(1);
  }

  const reviewComments = [
    "Amazing quality and fast delivery!",
    "The product exceeded my expectations.",
    "Great purchase, very happy with the price.",
    "Looks exactly like the pictures.",
    "Perfect for everyday use.",
  ];

  const validUserIds = await getValidUserIds();
  if (validUserIds.length === 0) {
    console.warn("No valid auth user IDs found. Skipping fake reviews.");
  } else {
    const reviews = [];
    const usedPairs = new Set();
    const maxReviews = Math.min(60, products.length * validUserIds.length);

    while (reviews.length < maxReviews) {
      const product = getRandomItem(products);
      const userId = getRandomItem(validUserIds);
      const pairKey = `${product.id}:${userId}`;
      if (usedPairs.has(pairKey)) continue;
      usedPairs.add(pairKey);
      reviews.push({
        id: randomUUID(),
        product_id: product.id,
        user_id: userId,
        rating: Math.floor(Math.random() * 2) + 4,
        comment: FAKE_REVIEW_COMMENT,
      });
    }

    const { error: reviewsError } = await supabase.from("reviews").insert(reviews);
    if (reviewsError) {
      console.error("Failed to insert reviews:", reviewsError.message || reviewsError);
      process.exit(1);
    }
  }

  const orders = [];
  const transactions = [];
  for (let i = 0; i < 40; i += 1) {
    const product = getRandomItem(products);
    const quantity = Math.floor(Math.random() * 3) + 1;
    const orderAmount = Number((product.price * quantity).toFixed(2));
    const orderId = randomUUID();
    const createdAt = randomDateWithinDays(30);
    const status = getRandomItem(["delivered", "confirmed", "pending"]);
    const transactionStatus = status === "delivered" || status === "confirmed" ? "success" : "pending";

    orders.push({
      id: orderId,
      customer_name: `Fake Customer ${i + 1}`,
      customer_phone: `254700000${100 + i}`,
      customer_email: `fake.customer${i + 1}@example.com`,
      delivery_method: getRandomItem(["pickup", "delivery"]),
      delivery_address: i % 2 === 0 ? `Fake Address ${i + 1}, Nairobi, Kenya` : null,
      items: [{ product_id: product.id, name: product.name, price: product.price, quantity }],
      total_amount: orderAmount,
      status,
      notes: FAKE_ORDER_NOTE,
      payment_method: "paystack",
      created_at: formatISODate(createdAt),
      updated_at: formatISODate(createdAt),
    });

    transactions.push({
      paystack_ref: `${PAYSTACK_REF_PREFIX}${randomUUID()}`,
      user_id: null,
      amount: orderAmount,
      currency: "KES",
      status: transactionStatus,
      metadata: { order_id: orderId, label: "fake-seed" },
      created_at: formatISODate(createdAt),
      updated_at: formatISODate(createdAt),
    });
  }

  const { error: ordersError } = await supabase.from("orders").insert(orders);
  if (ordersError) {
    console.error("Failed to insert fake orders:", ordersError.message || ordersError);
  }

  const { error: transactionsError } = await supabase.from("transactions").insert(transactions);
  if (transactionsError) {
    console.warn("Transaction insert failed or transactions table may not exist:", transactionsError.message || transactionsError);
  }

  console.log("Fake data seeding finished.");
}

const command = process.argv[2] === "cleanup" ? "cleanup" : "seed";

if (command === "cleanup") {
  await cleanupFakeData();
} else {
  await seedFakeData();
}
