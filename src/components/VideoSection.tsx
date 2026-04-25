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
    autoplaySpeed: 0.4,
  });

  const getYouTubeThumbnail = (url: string) => {
    const id = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/)?.[1];
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  };

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollBy({
      left: dir === 'left' ? -380 : 380,
      behavior: 'smooth',
    });
  };

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container px-4">
          <div className="flex gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-72">
                <Skeleton className="h-40 w-full rounded-2xl" />
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
        <div className="container px-4 relative">
          <h2 className="text-3xl font-bold text-center mb-10 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Watch Our Latest Videos
          </h2>

          {/* Desktop arrows */}
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/60 text-white hover:scale-110 transition items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/60 text-white hover:scale-110 transition items-center justify-center"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div
            ref={scrollRef}
            {...handlers}
            onWheel={(e) => {
              if (!scrollRef.current) return;
              scrollRef.current.scrollLeft += e.deltaY;
            }}
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory select-none"
            style={{
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              touchAction: 'pan-x',
            }}
          >
            <style>
              {`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}
            </style>

            {videos.map((video) => {
              const thumb =
                video.thumbnail_url || getYouTubeThumbnail(video.youtube_url);

              return (
                <div
                  key={video.id}
                  className="min-w-[260px] sm:min-w-[300px] md:min-w-[340px] snap-start group"
                  onClick={() => {
                    if (wasDragged()) return;
                    setSelectedVideo({
                      url: video.youtube_url,
                      title: video.title,
                    });
                  }}
                >
                  <div className="rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer">
                    <div className="relative aspect-video bg-gray-900">
                      {thumb && (
                        <img
                          src={thumb}
                          alt={video.title || 'Video thumbnail'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          draggable={false}
                        />
                      )}

                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors duration-300" />

                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Play className="text-white ml-1 w-6 h-6" />
                        </div>
                      </div>

                      {video.title && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                          <p className="text-white text-sm font-medium line-clamp-2 max-w-[85%]">
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

          <p className="text-center text-xs text-gray-400 mt-2 md:hidden">
            Swipe to explore →
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