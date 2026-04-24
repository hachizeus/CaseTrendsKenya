import { useState, useRef } from 'react';
import { useVideos } from '@/hooks/useVideos';
import { useVideoCarousel } from '@/hooks/useVideoCarousel';
import { VideoModal } from './VideoModal';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export const VideoSection = () => {
  const { data: videos, isLoading, error } = useVideos(false);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string | null } | null>(null);
  const { scrollRef, handlers } = useVideoCarousel({ autoplaySpeed: 3000, pauseOnHover: true });
  const [showNavigation, setShowNavigation] = useState(false);

  // Helper to get YouTube thumbnail
  const getYouTubeThumbnail = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/)?.[1];
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  };

  // Navigation functions
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  if (isLoading) {
    return (
      <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="container px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Featured Videos</h2>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-72">
                <Skeleton className="w-full h-40" />
                <Skeleton className="w-3/4 h-4 mt-3" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !videos || videos.length === 0) {
    return null;
  }

  return (
    <>
      <section className="py-12 bg-gradient-to-b from-gray-50 to-white overflow-hidden relative">
        <div className="container px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Watch Our Latest Videos
          </h2>
          
          {/* Navigation Buttons - Desktop only */}
          <div className="hidden md:block">
            <button
              onClick={scrollLeft}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-200"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={scrollRight}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-200"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          
          {/* Horizontal Scroll Container */}
          <div
            ref={scrollRef}
            {...handlers}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-4"
            style={{
              scrollbarWidth: 'thin',
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory'
            }}
          >
            {videos.map((video, index) => {
              const thumbnail = video.thumbnail_url || getYouTubeThumbnail(video.youtube_url);
              
              return (
                <div
                  key={video.id}
                  className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[350px] lg:w-[380px] group cursor-pointer"
                  style={{ scrollSnapAlign: 'start' }}
                  onClick={() => setSelectedVideo({
                    url: video.youtube_url,
                    title: video.title,
                  })}
                >
                  <div className="relative overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl">
                    <div className="relative pt-[56.25%] bg-gray-900">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={video.title || 'Video thumbnail'}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                          <Play className="w-12 h-12 text-white/30" />
                        </div>
                      )}
                      
                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm flex items-center justify-center rounded-full">
                          <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                      </div>
                      
                      {/* Video title overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {video.title && (
                          <p className="text-white text-sm font-medium line-clamp-2">
                            {video.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Mobile scroll indicator */}
          <div className="md:hidden flex justify-center gap-2 mt-6">
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              ← Swipe to scroll →
            </div>
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