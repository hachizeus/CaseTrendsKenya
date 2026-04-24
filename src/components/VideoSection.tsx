import { useState } from 'react';
import { useVideos } from '@/hooks/useVideos';
import { useVideoCarousel } from '@/hooks/useVideoCarousel';
import { VideoModal } from './VideoModal';
import { Play } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export const VideoSection = () => {
  const { data: videos, isLoading, error } = useVideos(false);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string | null } | null>(null);
  const { scrollRef, handlers } = useVideoCarousel({ autoplaySpeed: 3000, pauseOnHover: true });

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

  // Helper to get YouTube thumbnail
  const getYouTubeThumbnail = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/)?.[1];
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  };

  return (
    <>
      <section className="py-12 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
        <div className="container px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Watch Our Latest Videos
          </h2>
          
          <div
            ref={scrollRef}
            {...handlers}
            className="flex gap-4 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
            style={{ scrollBehavior: 'smooth' }}
          >
            {videos.map((video) => {
              const thumbnail = video.thumbnail_url || getYouTubeThumbnail(video.youtube_url);
              
              return (
                <div
                  key={video.id}
                  className="flex-shrink-0 w-72 md:w-80 lg:w-96 group cursor-pointer"
                  onClick={() => setSelectedVideo({
                    url: video.youtube_url,
                    title: video.title,
                  })}
                >
                  {/* Removed transform scale on hover to prevent shaking */}
                  <div className="relative overflow-hidden shadow-lg transition-all duration-300 group-hover:shadow-2xl">
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
                      
                      {/* Overlay with play button - removed scale transform */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                      </div>
                      
                      {/* Gradient overlay for text */}
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