# IMAGE OPTIMIZATION GUIDE - Case Trends Kenya

## Critical Issue: Large Image Files

Your current performance bottleneck is **image delivery (1,317 KiB potential savings)**. The app code is now optimized, but the images need to be converted to modern formats and properly sized.

## Quick Wins

### 1. **Image Format Conversion** (CRITICAL)
Your images should be served in modern formats with fallbacks:
- **AVIF** - Best compression (20-40% smaller than JPEG)
- **WebP** - Better compression (25-35% smaller than JPEG)
- **JPEG** - Fallback for older browsers

**Tools to convert images:**
- [TinyPNG.com](https://tinypng.com) - Online, simple UI
- [ImageOptim.com](https://imageoptim.com) - Batch converter
- [FileZilla/FFmpeg](https://ffmpeg.org) - CLI option
- [Sharp CLI](https://sharp.pixelplumbing.com) - Node.js tool

**Example conversion commands:**
```bash
# Using ImageMagick
convert image.webp -quality 80 image.webp
convert image.webp -quality 75 image.avif

# Using cwebp (Google)
cwebp -q 80 image.webp -o image.webp

# Using FFmpeg
ffmpeg -i image.webp -q:v 5 image.avif
```

### 2. **Responsive Image Sizing**

Create multiple sizes of each image for different screen sizes:

```
Hero Banner (1400x480):
- Desktop: 1400x480 (original)
- Tablet: 900x320
- Mobile: 600x200

Product Images (500x500):
- Large: 500x500
- Medium: 300x300
- Thumbnail: 150x150
```

**Generate responsive images with ImageMagick:**
```bash
# Hero banner
convert hero.webp -resize 1400x480 hero-1400.webp
convert hero.webp -resize 900x320 hero-900.webp
convert hero.webp -resize 600x200 hero-600.webp

# Convert to WebP
cwebp -q 80 hero-1400.webp -o hero-1400.webp
cwebp -q 80 hero-900.webp -o hero-900.webp
cwebp -q 80 hero-600.webp -o hero-600.webp
```

### 3. **Update Image URLs in Database**

After converting images, update your Supabase image URLs to point to the WebP/AVIF versions:

**Before:**
```
https://storage.example.com/images/product-123.webp
```

**After (with fallback query params):**
```
https://storage.example.com/images/product-123
```

The LazyImage component will automatically serve:
1. `product-123.avif` (if browser supports AVIF)
2. `product-123.webp` (if browser supports WebP)
3. `product-123.webp` (fallback for all browsers)

### 4. **Bulk Image Optimization Script**

Create a Node.js script to batch convert all images:

```javascript
// optimize-images.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imageDir = './public/images';
const files = fs.readdirSync(imageDir).filter(f => /\.(jpg|png)$/i.test(f));

files.forEach(file => {
  const filePath = path.join(imageDir, file);
  const name = path.parse(file).name;

  // Convert to WebP
  sharp(filePath)
    .resize(1400, 800, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(imageDir, `${name}.webp`))
    .then(() => console.log(`✅ ${name}.webp created`))
    .catch(err => console.error(`❌ ${name}: ${err}`));

  // Convert to AVIF
  sharp(filePath)
    .resize(1400, 800, { fit: 'inside', withoutEnlargement: true })
    .avif({ quality: 75 })
    .toFile(path.join(imageDir, `${name}.avif`))
    .then(() => console.log(`✅ ${name}.avif created`))
    .catch(err => console.error(`❌ ${name}: ${err}`));
});
```

**Run it:**
```bash
npm install sharp
node optimize-images.js
```

### 5. **Online Batch Conversion Tools**

If you don't want to install software:

1. **Squoosh.app** (Google)
   - Drag & drop images
   - Choose quality settings
   - Download WebP/AVIF versions

2. **CloudConvert.com**
   - Batch upload (25+ files)
   - Convert to WebP/AVIF
   - Auto-compress

3. **Imageoptim.com**
   - Drag & drop
   - Automatic optimization
   - Download zipped results

## Expected Performance Improvements

| Metric | Before | After Optimization |
|--------|--------|-------------------|
| Image Size (JPEG) | 1317 KiB | ~400-500 KiB (WebP/AVIF) |
| First Contentful Paint (FCP) | 23.1s | ~2-4s |
| Largest Contentful Paint (LCP) | 54.4s | ~4-8s |
| Performance Score | 25 | 85-95 |

## Step-by-Step Action Plan

1. **Today:**
   - [ ] Pick 2-3 hero banner images
   - [ ] Convert them to WebP + AVIF using TinyPNG or Squoosh
   - [ ] Upload to your storage (replace JPEG versions or add WebP variants)

2. **This Week:**
   - [ ] Convert all product images (check how many you have)
   - [ ] Update image URLs in database if needed
   - [ ] Test Lighthouse performance

3. **Ongoing:**
   - [ ] Set up automated image optimization in your build pipeline
   - [ ] Use WebP/AVIF for all new images
   - [ ] Monitor Core Web Vitals monthly

## Testing After Optimization

```bash
# Build production bundle
npm run build

# Run Lighthouse audit
# 1. Open Chrome DevTools (F12)
# 2. Go to Lighthouse tab
# 3. Generate report for Desktop/Mobile
# 4. Look for Performance score - should be 80+
```

## Advanced: CDN Image Optimization

If images are served from Supabase or a CDN, enable:
- **Image transformation API** (resize, format conversion on-the-fly)
- **Automatic format serving** (sends WebP to modern browsers, JPEG to old ones)
- **Progressive JPEG** (loads gradually)
- **Lazy loading headers**

Example Supabase CDN URL patterns:
```
https://your-project.supabase.co/storage/v1/object/public/images/product.webp?width=500&quality=80
```

## Tools Installed in Your Project

✅ **Already configured:**
- LazyImage component with WebP/AVIF support
- Priority loading for above-the-fold products
- Responsive image sizing via `sizes` attribute
- Automatic format fallback (<picture> tag)

## Estimated Time to 100% Performance

- **Quick fix** (hero images only): 30 minutes → Performance: 60-70%
- **Full optimization** (all images): 2-3 hours → Performance: 85-95%
- **Advanced CDN setup**: 1 hour → Performance: 95-100%

---

**Next Step:** Start converting your images to WebP/AVIF format. This single change will likely get you from 25% to 70%+ performance score!
