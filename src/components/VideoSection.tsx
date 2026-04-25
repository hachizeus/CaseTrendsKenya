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
      <section className="py-12 md:py-16">
        <div className="w-full">
          <h2 className="text-3xl font-bold text-white mb-8 px-4">
            Watch Our Latest Videos
          </h2>
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-10 px-4 no-scrollbar">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[calc(12rem-20px)] md:h-[calc(14rem-20px)] min-w-[calc(280px-20px)] sm:min-w-[calc(340px-20px)] md:min-w-[calc(400px-20px)] rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!videos?.length || error) return null;

  return (
    <>
      <section className="py-12 md:py-16">
        <div className="w-full">
          <h2 className="text-3xl font-bold text-white mb-8 px-4">
            Watch Our Latest Videos
          </h2>
          <div
            ref={scrollRef}
            {...handlers}
            className="flex gap-3 md:gap-4 overflow-x-auto pb-4 px-4 cursor-grab active:cursor-grabbing select-none no-scrollbar"
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
                  className="min-w-[calc(280px-20px)] sm:min-w-[calc(340px-20px)] md:min-w-[calc(400px-20px)] flex-shrink-0"
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
                    <div className="relative rounded-2xl overflow-hidden bg-gray-900" style={{ height: 'calc(12rem - 20px)' }}>
                      <div className="absolute inset-0 md:hidden" style={{ height: 'calc(14rem - 20px)' }}>
                        {thumb && (
                          <img
                            src={thumb}
                            alt={video.title || 'Video'}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            draggable={false}
                          />
                        )}
                      </div>
                      <div className="hidden md:block absolute inset-0">
                        {thumb && (
                          <img
                            src={thumb}
                            alt={video.title || 'Video'}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            draggable={false}
                          />
                        )}
                      </div>
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm group-hover:bg-red-600/90 transition-colors">
                          <Play className="text-white fill-current ml-1 w-6 h-6 md:w-7 md:h-7" />
                        </div>
                      </div>
                      
                      {/* Video title overlay on bottom left */}
                      {video.title && (
                        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black/80 to-transparent">
                          <h3 className="text-white text-sm md:text-base font-medium line-clamp-2">
                            {video.title}
                          </h3>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-gray-400 text-sm mt-4 text-center md:hidden px-4">
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