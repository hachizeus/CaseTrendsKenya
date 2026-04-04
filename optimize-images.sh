#!/bin/bash
# Image Optimization Script
# Usage: ./optimize-images.sh <input-dir> <output-dir>

INPUT_DIR="${1:-.}"
OUTPUT_DIR="${2:-.}"

echo "🖼️  Image Optimization Tool"
echo "Converting JPEG/PNG to WebP and AVIF..."
echo ""

# Check if cwebp and ffmpeg are installed
if ! command -v cwebp &> /dev/null; then
    echo "⚠️  cwebp not found. Install it:"
    echo "   macOS: brew install webp"
    echo "   Ubuntu: sudo apt-get install webp"
    exit 1
fi

count=0
for file in "$INPUT_DIR"/*.{jpg,jpeg,png}; do
    [ -e "$file" ] || continue
    filename=$(basename "$file")
    name="${filename%.*}"
    
    echo "Processing: $filename"
    
    # Convert to WebP (best quality/size ratio)
    cwebp -q 80 "$file" -o "$OUTPUT_DIR/$name.webp"
    echo "  ✅ $name.webp (quality: 80)"
    
    # Convert to AVIF if ffmpeg is available (best compression)
    if command -v ffmpeg &> /dev/null; then
        ffmpeg -i "$file" -c:v libaom-av1 -crf 30 "$OUTPUT_DIR/$name.avif" 2>/dev/null
        echo "  ✅ $name.avif (quality: 30)"
    fi
    
    # Show file size comparison
    original_size=$(du -h "$file" | cut -f1)
    webp_size=$(du -h "$OUTPUT_DIR/$name.webp" 2>/dev/null | cut -f1)
    echo "  📊 Size: $original_size → $webp_size (WebP)"
    
    count=$((count + 1))
done

echo ""
echo "✅ Optimization complete! Processed $count images"
echo ""
echo "Next steps:"
echo "1. Upload the .webp and .avif files to your storage"
echo "2. Update image URLs in your database if needed"
echo "3. Run: npm run build && npm run test"
echo "4. Check Lighthouse score - should be 80+!"
