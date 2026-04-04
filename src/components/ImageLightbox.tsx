import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface ImageLightboxProps {
  images: Array<{ image_url: string; display_order: number }>;
  initialIndex: number;
}

const ImageLightbox = ({ images, initialIndex }: ImageLightboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const currentImage = images[currentIndex];

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "ArrowLeft") goToPrev();
    if (e.key === "Escape") setIsOpen(false);
  };

  return (
    <>
      {/* Trigger button - zoom icon on image hover */}
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-4 right-4 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform z-10 opacity-0 group-hover:opacity-100"
        aria-label="Zoom image"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      {/* Lightbox modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setIsOpen(false)}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            autoFocus
          >
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="absolute top-6 right-6 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Image counter */}
            <div className="absolute top-6 left-6 text-white text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </div>

            {/* Image container */}
            <motion.div
              key={currentIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full max-w-4xl max-h-4xl flex items-center justify-center px-6"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentImage.image_url}
                alt={`Product image ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </motion.div>

            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => {
                    goToPrev();
                  }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-white/20 text-white hover:bg-white/40 rounded-full transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => {
                    goToNext();
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-white/20 text-white hover:bg-white/40 rounded-full transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentIndex
                        ? "border-primary scale-110"
                        : "border-white/30 hover:border-white/60 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImageLightbox;
