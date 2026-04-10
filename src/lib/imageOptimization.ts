/**
 * Image Optimization Utilities
 * Client-side image compression and format conversion
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, default 0.8
  mimeType?: string; // 'image/jpeg', 'image/webp', 'image/png'
}

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
  size: number;
  mimeType: string;
  compressionRatio: number;
}

/**
 * Compress image on client side using Canvas API
 * Reduces file size before upload to Supabase
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressedImage> {
  const {
    maxWidth = 1400,
    maxHeight = 1400,
    quality = 0.8,
    mimeType = "image/webp", // Default to WebP for better compression
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas and compress
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");

        ctx.fillStyle = "white"; // White background for transparent images
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) throw new Error("Canvas conversion failed");

            const compressionRatio = ((1 - blob.size / file.size) * 100).toFixed(1);

            resolve({
              blob,
              width,
              height,
              size: blob.size,
              mimeType,
              compressionRatio: parseFloat(compressionRatio),
            });
          },
          mimeType,
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Generate multiple compression presets for different use cases
 * Useful for creating responsive image variants
 */
export async function generateImageVariants(
  file: File
): Promise<{
  thumbnail: CompressedImage;
  small: CompressedImage;
  medium: CompressedImage;
  large: CompressedImage;
}> {
  const [thumbnail, small, medium, large] = await Promise.all([
    compressImage(file, { maxWidth: 150, maxHeight: 150, quality: 0.85, mimeType: "image/webp" }),
    compressImage(file, { maxWidth: 300, maxHeight: 300, quality: 0.85, mimeType: "image/webp" }),
    compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.8, mimeType: "image/webp" }),
    compressImage(file, { maxWidth: 1400, maxHeight: 1400, quality: 0.8, mimeType: "image/webp" }),
  ]);

  return { thumbnail, small, medium, large };
}

/**
 * Check if browser supports modern image formats
 */
export async function checkImageFormatSupport(): Promise<{
  webp: boolean;
  avif: boolean;
}> {
  return {
    webp: await supportsWebP(),
    avif: await supportsAVIF(),
  };
}

async function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    try {
      const dataUrl = canvas.toDataURL("image/webp");
      resolve(dataUrl.includes("webp"));
    } catch {
      resolve(false);
    }
  });
}

async function supportsAVIF(): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve(img.height === 1);
    img.src =
      "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAG1pZGEA" +
      "AAADRU0AAANwbWRhdAABAAAAAAAA";
  });
}

/**
 * Format bytes to human readable size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Get image dimensions without loading full image
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => reject(new Error("Failed to read image dimensions"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  resize?: "contain" | "cover" | "fill";
  format?: "webp" | "avif" | "png" | "jpeg";
}

export function getOptimizedImageUrl(
  src: string,
  {
    width,
    height,
    quality = 70,
    resize = "contain",
    format,
  }: ImageOptimizationOptions = {}
): string {
  try {
    const url = new URL(src);
    if (!src.includes("supabase.co")) {
      return src;
    }

    if (width) url.searchParams.set("width", String(width));
    if (height) url.searchParams.set("height", String(height));
    if (quality) url.searchParams.set("quality", String(quality));
    if (resize) url.searchParams.set("resize", resize);
    if (format) url.searchParams.set("format", format);

    return url.toString();
  } catch {
    return src;
  }
}
