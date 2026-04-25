import { useState } from 'react';
import { useVideos } from '@/hooks/useVideos';
import { useVideoCarousel } from '@/hooks/useVideoCarousel';
import { VideoModal } from './VideoModal';
import { Play } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export const VideoSection = () => {
  const { data: videos, isLoading, error } = useVideos(false);
  const [selectedVideo, setSelectedVideo] = useState<{
    url: string;
    title: string | null;
  } | null>(null);
  const { scrollRef, handlers, wasDragged } = useVideoCarousel({
    autoplaySpeed: 0.7,
  });

  const getYouTubeThumbnail = (url: string) => {
    const id = url.match(/(?:youtube.com\/watch\?v=|youtu.be\/)([^&?#]+)/)?.[1];
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  };

  if (isLoading) {
    return (
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8">
            Watch Our Latest Videos
          </h2>
          <div className="flex gap-4 md:gap-6 overflow-x-auto pb-10 no-scrollbar">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48 md:h-56 min-w-[280px] sm:min-w-[340px] md:min-w-[400px] rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!videos?.length || error) return null;

  return (
    <>
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8">
            Watch Our Latest Videos
          </h2>
          <div
            ref={scrollRef}
            {...handlers}
            className="flex gap-4 md:gap-6 overflow-x-auto pb-4 cursor-grab active:cursor-grabbing select-none no-scrollbar"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x'
            }}
          >
            <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none !important; }` }} />
            {videos.map((video) => {
              const thumb = video.thumbnail_url || getYouTubeThumbnail(video.youtube_url);
              return (
                <div
                  key={video.id}
                  className="min-w-[280px] sm:min-w-[340px] md:min-w-[400px] flex-shrink-0"
                  onClick={() => {
                    if (wasDragged()) return;
                    setSelectedVideo({
                      url: video.youtube_url,
                      title: video.title,
                    });
                  }}
                >
                  <div className="relative group cursor-pointer">
                    {/* Video thumbnail container */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900">
                      {thumb && (
                        <img
                          src={thumb}
                          alt={video.title || 'Video'}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          draggable={false}
                        />
                      )}
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm group-hover:bg-red-600/90 transition-colors">
                          <Play className="text-white fill-current ml-1 w-6 h-6 md:w-7 md:h-7" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Video title */}
                    {video.title && (
                      <div className="mt-3 px-1">
                        <h3 className="text-white text-sm md:text-base font-medium line-clamp-2">
                          {video.title}
                        </h3>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-gray-400 text-sm mt-4 text-center md:hidden">
            Swipe left or right to explore
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