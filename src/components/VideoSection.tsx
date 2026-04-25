import { useState } from 'react';
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

  const { scrollRef, handlers, wasDragged } = useVideoCarousel({
    autoplaySpeed: 0.6,
  });

  const getYouTubeThumbnail = (url: string) => {
    const id = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/)?.[1];
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  };

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 400;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container px-4">
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="min-w-[300px]">
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
      <section className="py-12 relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="container px-4">
          <h2 className="text-3xl font-bold text-center mb-10 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Watch Our Latest Videos
          </h2>

          <div className="relative group/carousel">
            {/* Navigation Arrows - Centered to the video height */}
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/90 shadow-xl text-primary hover:scale-110 transition items-center justify-center border border-gray-100 backdrop-blur-sm"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={() => scroll('right')}
              className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/90 shadow-xl text-primary hover:scale-110 transition items-center justify-center border border-gray-100 backdrop-blur-sm"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* SCROLLBAR HIDE FIX: 
                We use 'scrollbar-none' (if you have tailwind-scrollbar-hide plugin)
                OR standard utility classes.
            */}
            <div
              ref={scrollRef}
              {...handlers}
              onWheel={(e) => {
                if (!scrollRef.current) return;
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                  scrollRef.current.scrollLeft += e.deltaY;
                }
              }}
              className="flex gap-6 overflow-x-auto pb-8 cursor-grab active:cursor-grabbing select-none"
              style={{
                scrollBehavior: 'auto',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
                scrollbarWidth: 'none', // Firefox
                msOverflowStyle: 'none', // IE/Edge
              }}
            >
              {/* Fallback for Webkit browsers that don't support the style object above */}
              <style dangerouslySetInnerHTML={{ __html: `
                div::-webkit-scrollbar { display: none !important; }
              `}} />

              {videos.map((video) => {
                const thumb = video.thumbnail_url || getYouTubeThumbnail(video.youtube_url);

                return (
                  <div
                    key={video.id}
                    className="min-w-[280px] sm:min-w-[320px] md:min-w-[380px] group/item"
                    onClick={() => {
                      if (wasDragged()) return;
                      setSelectedVideo({
                        url: video.youtube_url,
                        title: video.title,
                      });
                    }}
                  >
                    <div className="rounded-2xl overflow-hidden bg-white shadow-md group-hover/item:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-100">
                      <div className="relative aspect-video bg-gray-900">
                        {thumb && (
                          <img
                            src={thumb}
                            alt={video.title || 'Video thumbnail'}
                            className="w-full h-full object-cover transform group-hover/item:scale-105 transition-transform duration-700"
                            loading="lazy"
                            draggable={false}
                          />
                        )}

                        <div className="absolute inset-0 bg-black/20 group-hover/item:bg-black/40 transition-colors duration-300" />

                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center scale-90 group-hover/item:scale-100 transition-transform duration-300 shadow-lg">
                            <Play className="text-white fill-current ml-1 w-7 h-7" />
                          </div>
                        </div>

                        {video.title && (
                          <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                            <p className="text-white text-sm font-semibold line-clamp-2">
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
          </div>

          <p className="text-center text-sm font-medium text-gray-400 mt-4 md:hidden">
            ← Swipe to explore →
          </p>
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