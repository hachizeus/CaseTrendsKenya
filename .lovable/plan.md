## Phase 1: Foundation
1. Enable Lovable Cloud (Supabase)
2. Create database schema: profiles, products, product_images, hero_slides, favorites, reviews, carts, cart_items, user_roles
3. Set up RLS policies
4. Set up auth (email/password + Google)

## Phase 2: Admin Dashboard
5. Admin layout with sidebar
6. Hero carousel management (CRUD)
7. Product management (CRUD with image upload)
8. User management
9. Remove.bg integration for background removal (Edge Function)

## Phase 3: Customer Features
10. Product detail page with image gallery
11. Product card hover image transitions
12. Favorites/Wishlist system (DB for logged-in, localStorage for guests)
13. Reviews & ratings system
14. Smart search with filters

## Phase 4: Cart & Checkout
15. Cart system (DB for logged-in, localStorage for guests, sync on login)
16. Cart drawer (sliding panel from right)
17. Checkout page with delivery options
18. WhatsApp integration (pre-filled message to 0759001048)

## Phase 5: Polish
19. Animations (add-to-cart float, heart pop, page transitions, skeleton loaders)
20. Responsive optimization
21. Performance optimization (lazy loading, image optimization)

### Tech Stack
- React + Tailwind CSS + Framer Motion
- Supabase (Auth, DB, Storage, Edge Functions)
- remove.bg API via Edge Function
- Admin email to be provided by user

### Database Tables
- profiles (id, user_id, display_name, phone, avatar_url, address)
- user_roles (id, user_id, role)
- products (id, name, description, price, original_price, category, brand, stock_status, is_featured, is_trending, created_at)
- product_images (id, product_id, image_url, display_order, is_primary)
- hero_slides (id, title, subtitle, image_url, cta_text, cta_link, display_order, is_active)
- favorites (id, user_id, product_id)
- reviews (id, user_id, product_id, rating, comment, created_at)
- carts (id, user_id, created_at)
- cart_items (id, cart_id, product_id, quantity)
