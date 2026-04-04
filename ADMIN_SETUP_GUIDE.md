# Admin Panel Setup & Troubleshooting Guide

## ✅ Issues Fixed

### 1. **Hero Sections Now Seedable**
- The admin panel now has a button to automatically create the 5 hero sections
- Navigate to `/admin/slides-overview`
- Click "Create Hero Sections" button
- This will initialize all 5 sections, ready for carousel slides

### 2. **User Role Management Added**
- Navigate to `/admin/users`
- See a new "Role" column in the user table
- Click the dropdown to change user roles: None, User, Moderator, Admin
- Changes save instantly with toast notifications

### 3. **Auth Persistence on Reload**
- Auth state now properly persists on page reload
- Loading states show during auth verification instead of redirecting immediately
- When you reload at `/admin`, it will:
  1. Show a spinner while verifying admin status
  2. Keep you in admin panel if you have admin role
  3. Redirect to home if you're not an admin

---

## 🚀 First-Time Setup

### Step 1: Verify You're an Admin
1. Go to `/admin/users`
2. Find your user in the list
3. Set your role to "Admin" using the dropdown

### Step 2: Create Hero Sections
1. Navigate to `/admin/slides-overview`
2. Should see either:
   - ✅ **5 hero sections** (already created) → Skip to Step 3
   - ❌ **"No hero sections found"** message → Click **"Create Hero Sections"** button
3. Wait for success message
4. Refresh the page to see all 5 sections

### Step 3: Add Carousel Slides
1. Click "Manage Slides" on any hero section
2. Upload your carousel images, titles, and descriptions
3. Toggle slides active/inactive as needed

---

## 🔧 Troubleshooting

### Issue: "No hero sections found" still appears after clicking Create

**Possible causes & solutions:**
1. **You're not logged in as admin**
   - Go to `/admin/users` 
   - Set your role to "Admin"
   - Reload the page

2. **RLS Policies Issue**
   - Go to Supabase Dashboard:
     - Project Settings → Database → RLS Policies
     - Find "hero_sections" table
     - Verify policies allow admin INSERT and SELECT
   
3. **Schema not synced**
   - In Supabase Dashboard: API Settings → Clear Cache
   - Reload your browser

### Issue: Can't access admin panel on reload

**What's happening:**
- Auth state is being verified (shows spinner)
- If you're NOT an admin, you'll be redirected home after 1-2 seconds

**Solution:**
1. Make sure you're signed in: `/auth`
2. Have an admin set your role in `/admin/users`
3. Then you can access `/admin` pages

### Issue: Role change not working

**Possible causes:**
1. **Permission denied**
   - Only users with "admin" role can change other users' roles
   - Ask another admin to give you admin role first

2. **Supabase RLS Issue**
   - Go to Supabase Dashboard → Authentication → Policies
   - Check "user_roles" table policies:
     - SELECT: `public.has_role(auth.uid(), 'admin')`
     - INSERT: `public.has_role(auth.uid(), 'admin')`
     - UPDATE: `public.has_role(auth.uid(), 'admin')`
     - DELETE: `public.has_role(auth.uid(), 'admin')`

---

## 📋 User Roles Explained

| Role | Permissions |
|------|------------|
| **None** | Regular user, can browse and order |
| **User** | Same as None (placeholder) |
| **Moderator** | Can manage some content (reserved for future) |
| **Admin** | Full access to admin panel, all management features |

---

## 🎯 Admin Features

### Dashboard (`/admin`)
- Overview of orders, products, categories
- Quick stats and recent activity

### Products (`/admin/products`)
- View, edit, add, delete products
- Manage pricing and inventory

### Categories (`/admin/categories`)
- Manage product categories
- View category performance

### Users (`/admin/users`)
- View all registered users
- Search by name or phone
- **Change user roles** ← NEW!

### Hero Slides (`/admin/slides-overview`)
- Manage 5 homepage hero sections
- Add carousel images to each section
- Control which slides are active

### Orders (`/admin/orders`)
- View all customer orders
- Track order status
- Manage deliveries

### Reviews (`/admin/reviews`)
- Monitor product reviews
- Manage review visibility

---

## 📊 Testing the Setup

### Test 1: Hero Sections
```
1. Go to /admin/slides-overview
2. Should see 5 sections: Main Hero, After Trending, Between Cat 1&2, etc.
3. Each should have "0/5 Slides" initially
4. Click "Manage Slides" on one
5. Should be able to add images
```

### Test 2: Role Management
```
1. Create a test user (sign up with new email)
2. Go to /admin/users
3. Find the test user
4. Change their role from "None" to "Admin"
5. Have that user log in
6. They should be able to access /admin
```

### Test 3: Auth Persistence
```
1. Log in as admin
2. Go to /admin
3. Press F5 to reload page
4. Should stay on /admin (not redirect to home)
5. Should see a brief loading spinner, then the admin panel
```

---

## 💾 Database Tables Reference

### hero_sections
Stores the 5 homepage sections
```
id: UUID (PK)
section_number: 1-5 (UNIQUE)
label: Name of section
created_at: Timestamp
updated_at: Timestamp
```

### hero_slides
Stores carousel images for each section
```
id: UUID (PK)
section_id: FK to hero_sections
image_url: Image path
title: Slide title
description: Slide description
is_active: Boolean (true = visible)
display_order: Order in carousel
created_at: Timestamp
updated_at: Timestamp
```

### user_roles
Stores user role assignments
```
id: UUID (PK)
user_id: FK to auth.users
role: 'admin' | 'moderator' | 'user'
UNIQUE: (user_id, role)
```

---

## 🆘 Emergency Reset

If something goes wrong, you can manually seed data via Supabase SQL Editor:

### Create hero sections manually:
```sql
INSERT INTO public.hero_sections (section_number, label) VALUES
  (1, 'Main Hero'),
  (2, 'After Trending Products'),
  (3, 'Between Category 1 & 2'),
  (4, 'Between Category 3 & 4'),
  (5, 'Between Category 5 & 6')
ON CONFLICT (section_number) DO NOTHING;
```

### Verify data exists:
```sql
SELECT * FROM public.hero_sections ORDER BY section_number;
SELECT * FROM public.user_roles WHERE role = 'admin';
```

### Make yourself admin:
```sql
INSERT INTO public.user_roles (user_id, role) VALUES
  ('<YOUR_USER_ID>', 'admin')
ON CONFLICT DO NOTHING;
```

(Get your user_id from Supabase Auth → Users)

---

## 📞 Support

Check browser console (F12) for detailed error messages:
- Look for red errors from AdminSlidesOverview
- Check network tab for failed API calls
- Share console errors if reporting issues

