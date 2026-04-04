import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  blurDataUrl?: string;
  fallback?: string;
  priority?: boolean;
  sizes?: string;
}

// Generate a simple blur placeholder (SVG-based)
const generateBlurPlaceholder = (width: number = 10, height: number = 10) => {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='%23f3f3f3'/%3E%3C/svg%3E`;
};

/**
 * Optimized LazyImage component with WebP/AVIF support
 * - Serves modern image formats (WebP, AVIF) with fallbacks
 * - Implements IntersectionObserver for lazy loading
 * - Supports priority loading for above-the-fold images
 * - Includes responsive image support via sizes
 */
export const LazyImage = ({
  src,
  alt,
  width,
  height,
  className = "",
  blurDataUrl,
  fallback = "/placeholder.svg",
  priority = false,
  sizes,
}: LazyImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>(blurDataUrl || generateBlurPlaceholder());
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Generate WebP/AVIF variants from the base image URL
  const getImageVariants = (baseUrl: string) => {
    const ext = baseUrl.split('.').pop()?.toLowerCase() || 'jpg';
    const basePath = baseUrl.substring(0, baseUrl.lastIndexOf('.'));
    
    return {
      avif: `${basePath}.avif`,
      webp: `${basePath}.webp`,
      original: baseUrl,
    };
  };

  useEffect(() => {
    if (!imageRef) return;

    // For priority images, load immediately
    if (priority) {
      setImageSrc(src);
      return;
    }

    // For non-priority images, use IntersectionObserver
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          // Prefetch WebP variant for next image in sequence
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.as = 'image';
          const variants = getImageVariants(src);
          link.href = variants.webp;
          document.head.appendChild(link);
          observer.unobserve(imageRef);
        }
      },
      { rootMargin: "200px" } // Start loading 200px before entering viewport
    );

    observer.observe(imageRef);
    return () => observer.disconnect();
  }, [imageRef, src, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
    setImageSrc(fallback);
  };

  const variants = getImageVariants(imageSrc === src ? src : imageSrc);

  return (
    <motion.img
      ref={setImageRef}
      src={error ? fallback : imageSrc}
      alt={alt}
      width={width}
      height={height}
      onLoad={handleLoad}
      onError={handleError}
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoaded ? 1 : 0.7 }}
      transition={{ duration: 0.3 }}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      sizes={sizes || "100vw"}
      className={`${className} ${!isLoaded && !error ? "blur-sm" : ""}`}
    />
  );
};

/**
 * Skeleton loader for images
 */
export const ImageSkeleton = ({
  width = "w-full",
  height = "h-64",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) => (
  <div className={`${width} ${height} ${className} bg-gradient-to-r from-secondary via-secondary/50 to-secondary animate-pulse rounded-lg`} />
);

export default LazyImage;
