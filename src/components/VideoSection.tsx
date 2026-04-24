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

  const { scrollRef, handlers } = useVideoCarousel({
    autoplaySpeed: 0.35
  });

  const getYouTubeThumbnail = (url: string) => {
    const id = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/)?.[1];
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  };

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollBy({
      left: dir === 'left' ? -400 : 400,
      behavior: 'smooth'
    });
  };

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container px-4">
          <div className="flex gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-72">
                <Skeleton className="h-40 w-full rounded-xl" />
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

          {/* Nav buttons */}
          <div className="hidden md:block">
            <button
              onClick={() => scroll('left')}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/60 text-white hover:scale-110 transition"
            >
              <ChevronLeft />
            </button>

            <button
              onClick={() => scroll('right')}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/60 text-white hover:scale-110 transition"
            >
              <ChevronRight />
            </button>
          </div>

          {/* 🔥 PERFECT SCROLLER */}
          <div
            ref={scrollRef}
            {...handlers}
            className="
              flex gap-5 overflow-x-auto pb-6
              snap-x snap-mandatory
              cursor-grab active:cursor-grabbing
            "
            style={{
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {/* Hide scrollbar (webkit) */}
            <style>
              {`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}
            </style>

            {videos.map((video) => {
              const thumb =
                video.thumbnail_url ||
                getYouTubeThumbnail(video.youtube_url);

              return (
                <div
                  key={video.id}
                  className="
                    min-w-[260px] sm:min-w-[300px] md:min-w-[340px]
                    snap-start
                    group
                  "
                  onClick={() =>
                    setSelectedVideo({
                      url: video.youtube_url,
                      title: video.title,
                    })
                  }
                >
                  <div className="rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-2xl transition-all duration-300">
                    <div className="relative aspect-video bg-gray-900">
                      {thumb ? (
                        <img
                          src={thumb}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : null}

                      {/* overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                          <Play className="text-white ml-1" />
                        </div>
                      </div>
                    </div>

                    {video.title && (
                      <div className="p-3">
                        <p className="text-sm font-medium line-clamp-2">
                          {video.title}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile hint */}
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