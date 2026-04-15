import { getOptimizedImageUrl } from "@/lib/imageOptimization";

interface Props {
  src: string;
  alt: string;
  className?: string;
  isPriority?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  resize?: "contain" | "cover" | "fill";
}

export const LazyImage = ({
  src,
  alt,
  className,
  isPriority = false,
  width,
  height,
  sizes,
  resize = "contain",
}: Props) => {
  const optimizedSrc = getOptimizedImageUrl(src, {
    width: width ? Math.min(width, 1200) : undefined,
    height,
    quality: 70,
    resize,
  });

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={isPriority ? "eager" : "lazy"}
      decoding="async"
      fetchpriority={isPriority ? "high" : "low"}
      sizes={sizes}
    />
  );
};

export default LazyImage;
