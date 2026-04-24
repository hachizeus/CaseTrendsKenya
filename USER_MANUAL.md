# User Manual for Case Trends Kenya

## Table of Contents
1. [Introduction](#introduction)
2. [Frontend User Guide](#frontend-user-guide)
   - [Navigation Guide](#navigation-guide)
   - [Features](#features)
3. [Admin Panel Guide](#admin-panel-guide)
   - [Managing Products](#managing-products)
   - [Managing Orders](#managing-orders)
   - [Managing Users](#managing-users)
   - [Managing Reviews](#managing-reviews)
   - [Managing Slides](#managing-slides)
   - [Role-Based Access](#role-based-access)
4. [API Integration](#api-integration)
   - [Supabase Setup](#supabase-setup)
   - [Troubleshooting Supabase](#troubleshooting-supabase)
5. [Frameworks and Tools Used](#frameworks-and-tools-used)
6. [Troubleshooting Tips](#troubleshooting-tips)

---

## Introduction
Welcome to the user manual for Case Trends Kenya. This document provides a comprehensive guide for both end-users and administrators to navigate and manage the platform effectively.

---

## Frontend User Guide

### Navigation Guide
- **Homepage:** Displays featured products, categories, and promotional banners.
- **Product Listing:** Accessible via `/products`, showcasing all available products.
- **Product Details:** View detailed information about a product by navigating to `/product/:id`.
- **Cart:** Add products to the cart and proceed to checkout.
- **Checkout:** Complete your purchase by providing payment and shipping details.
- **Favorites:** Save products for later under `/favorites`.
- **Order History:** View past orders under `/account/orders`.

### Features
- **Product Comparison:** Compare multiple products side-by-side.
- **Cart Drawer:** Quickly view and manage items in your cart.
- **WhatsApp Button:** Contact support directly via WhatsApp.
- **Lazy Loading:** Pages and components load dynamically for better performance.

---

## Admin Panel Guide

### Managing Products
- Navigate to `/admin/products`.
- Add, edit, or delete products.
- Filter and sort products by category, price, or stock status.

### Managing Orders
- Navigate to `/admin/orders`.
- Update order statuses (e.g., pending, confirmed, delivered).
- Notify customers via email about status updates.

### Managing Users
- Navigate to `/admin/users`.
- Assign roles (e.g., admin, moderator) to users.
- Delete user accounts if necessary.

### Managing Reviews
- Navigate to `/admin/reviews`.
- Moderate customer reviews by approving or deleting them.

### Managing Slides
- Navigate to `/admin/slides`.
- Add, edit, or delete hero slides for the homepage.
- Manage slide order and visibility.

### Role-Based Access
- **Admin:** Full access to all admin features.
- **Moderator:** Limited access to specific admin features.

---

## API Integration

### Supabase Setup
1. **Environment Variables:**
   - `VITE_SUPABASE_URL`: Your Supabase project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase public API key.
2. **Client Initialization:**
   - The Supabase client is initialized in `src/integrations/supabase/client.ts`.
3. **Database Operations:**
   - CRUD operations are performed using Supabase's JavaScript SDK.

### Troubleshooting Supabase
- **Error: Table Not Found:** Ensure the required tables are created in the Supabase dashboard.
- **Authentication Issues:** Verify the API keys and permissions.
- **Network Errors:** Check your internet connection and Supabase server status.

---

## Frameworks and Tools Used
- **Frontend:** React, React Router, Tailwind CSS.
- **State Management:** React Context API.
- **Backend:** Supabase (PostgreSQL as a Service).
- **Build Tools:** Vite.
- **Testing:** Vitest, Playwright.
- **UI Components:** Lucide Icons, Custom UI Components.

---

## Troubleshooting Tips
- **Slow Loading Pages:**
  - Optimize images using modern formats (e.g., WebP).
  - Minify JavaScript and CSS files.
- **Broken Links:**
  - Verify route paths in `src/App.tsx`.
- **Console Errors:**
  - Check browser console for detailed error messages.
- **Caching Issues:**
  - Perform a hard refresh (Ctrl + F5) to clear the cache.

---

For further assistance, contact the support team.