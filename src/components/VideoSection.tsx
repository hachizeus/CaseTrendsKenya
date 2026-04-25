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
      <section className="py-8 md:py-10 bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]">
        <div className="w-full">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-6 px-4">
            Watch Our Latest Videos
          </h2>
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-6 px-4 no-scrollbar">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[180px] md:h-[200px] min-w-[240px] sm:min-w-[280px] md:min-w-[320px] rounded-xl bg-[hsl(240,10%,8%)] border border-white/5" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!videos?.length || error) return null;

  return (
    <>
      <section className="py-8 md:py-10 bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]">
        <div className="w-full">
          <div className="flex items-center justify-between mb-6 px-4">
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
              Watch Our Latest Videos
            </h2>
            <div className="hidden md:flex gap-1 text-white/40 text-xs">
              <span>←</span>
              <span>Drag to scroll →</span>
            </div>
          </div>
          
          <div
            ref={scrollRef}
            {...handlers}
            className="flex gap-3 md:gap-4 overflow-x-auto pb-3 px-4 cursor-grab active:cursor-grabbing select-none no-scrollbar"
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
                  className="min-w-[240px] sm:min-w-[280px] md:min-w-[320px] flex-shrink-0"
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
                    <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[hsl(240,10%,8%)] to-[hsl(240,10%,6%)] border border-white/10 hover:border-primary/50 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/5" style={{ height: '160px' }}>
                      {thumb && (
                        <img
                          src={thumb}
                          alt={video.title || 'Video'}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          draggable={false}
                          loading="lazy"
                        />
                      )}
                      
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm group-hover:bg-primary/90 transition-all duration-300 group-hover:scale-110">
                          <Play className="text-white fill-current ml-0.5 w-5 h-5 md:w-5 md:h-5" />
                        </div>
                      </div>
                      
                      {/* Video title overlay on bottom left */}
                      {video.title && (
                        <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                          <h3 className="text-white text-xs md:text-sm font-medium line-clamp-2 leading-tight">
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
          
          <p className="text-white/40 text-xs mt-3 text-center md:hidden px-4">
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