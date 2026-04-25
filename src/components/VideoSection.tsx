import { useState, useRef, useEffect } from 'react';
import { useVideos } from '@/hooks/useVideos';
import { useVideoCarousel } from '@/hooks/useVideoCarousel';
import { VideoModal } from './VideoModal';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export const VideoSection = () => {
  const { data: videos, isLoading, error } = useVideos(false);
  const [selectedVideo, setSelectedVideo] = useState<{
    url: string;
    title: string | null;
  } | null>(null);
  
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const { scrollRef, handlers, wasDragged, scrollToIndex } = useVideoCarousel({
    autoplaySpeed: 0.8,
    autoScrollLeft: true, // Enable auto scroll to left
  });

  const getYouTubeThumbnail = (url: string) => {
    const id = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/)?.[1];
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  };

  const checkScrollButtons = () => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      checkScrollButtons();
      scrollElement.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      
      return () => {
        scrollElement.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [videos]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const scrollAmount = dir === 'left' ? -400 : 400;
    scrollRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    });
  };

  if (isLoading) {
    return (
      <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="container px-4 mx-auto">
          <div className="flex gap-5 overflow-x-auto">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="min-w-[260px] sm:min-w-[300px] md:min-w-[340px]">
                <Skeleton className="h-48 w-full rounded-2xl" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!videos?.length || error) return null;

  return (
    <>
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container px-4 mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Watch Our Latest Videos
          </h2>

          <div className="relative group">
            {/* Left Navigation Arrow */}
            {showLeftArrow && (
              <button
                onClick={() => scroll('left')}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/70 hover:bg-black/90 text-white hover:scale-110 transition-all duration-300 items-center justify-center shadow-lg backdrop-blur-sm"
                style={{ transform: 'translateY(-50%)' }}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Right Navigation Arrow */}
            {showRightArrow && (
              <button
                onClick={() => scroll('right')}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/70 hover:bg-black/90 text-white hover:scale-110 transition-all duration-300 items-center justify-center shadow-lg backdrop-blur-sm"
                style={{ transform: 'translateY(-50%)' }}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Carousel Container */}
            <div
              ref={(el) => {
                scrollRef.current = el;
                carouselRef.current = el;
              }}
              {...handlers}
              className="flex gap-5 overflow-x-auto pb-6 snap-x snap-mandatory select-none scroll-smooth"
              style={{
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {/* Hide scrollbar styles */}
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>

              {videos.map((video, index) => {
                const thumb = video.thumbnail_url || getYouTubeThumbnail(video.youtube_url);
                
                return (
                  <div
                    key={video.id}
                    className="min-w-[280px] sm:min-w-[320px] md:min-w-[360px] snap-start group flex-shrink-0"
                    onClick={() => {
                      if (wasDragged()) return;
                      setSelectedVideo({
                        url: video.youtube_url,
                        title: video.title,
                      });
                    }}
                  >
                    <div className="rounded-2xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
                      <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800">
                        {thumb && (
                          <img
                            src={thumb}
                            alt={video.title || 'Video thumbnail'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            draggable={false}
                          />
                        )}

                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Play button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-all duration-300 group-hover:bg-primary/80">
                            <Play className="text-white ml-1 w-6 h-6 md:w-7 md:h-7" />
                          </div>
                        </div>

                        {/* Video title */}
                        {video.title && (
                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                            <p className="text-white text-sm md:text-base font-medium line-clamp-2">
                              {video.title}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile swipe indicator */}
            <p className="text-center text-sm text-gray-400 mt-4 md:hidden animate-pulse">
              ← Swipe to explore videos →
            </p>
          </div>
        </div>
      </section>

      <VideoModal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        videoUrl={selectedVideo?.url || ''}
        title={selectedVideo?.title}
      />
    </>
  );
};