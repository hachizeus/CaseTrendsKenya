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
    autoplaySpeed: 0.8, // Slightly faster for better UX
  });

  const getYouTubeThumbnail = (url: string) => {
    const id = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/)?.[1];
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  };

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container px-4 flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 min-w-[300px] rounded-2xl" />
          ))}
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

          <div className="relative group">
            <div
              ref={scrollRef}
              {...handlers}
              className="flex gap-6 overflow-x-auto pb-10 cursor-grab active:cursor-grabbing select-none transition-transform"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
              }}
            >
              {/* Webkit scrollbar hide */}
              <style dangerouslySetInnerHTML={{ __html: `
                div::-webkit-scrollbar { display: none !important; }
              `}} />

              {videos.map((video) => {
                const thumb = video.thumbnail_url || getYouTubeThumbnail(video.youtube_url);

                return (
                  <div
                    key={video.id}
                    className="min-w-[280px] sm:min-w-[340px] md:min-w-[400px]"
                    onClick={() => {
                      if (wasDragged()) return;
                      setSelectedVideo({
                        url: video.youtube_url,
                        title: video.title,
                      });
                    }}
                  >
                    <div className="rounded-2xl overflow-hidden bg-white shadow-lg border border-gray-100 hover:border-primary/20 transition-all duration-300">
                      <div className="relative aspect-video bg-gray-900">
                        {thumb && (
                          <img
                            src={thumb}
                            alt={video.title || 'Video'}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        )}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                        
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-xl">
                            <Play className="text-white fill-current ml-1 w-6 h-6" />
                          </div>
                        </div>

                        {video.title && (
                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-white text-xs md:text-sm font-medium line-clamp-2">
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

          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest animate-pulse">
            Swipe or Scroll to Explore
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