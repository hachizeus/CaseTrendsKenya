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
      <div>
        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-10 no-scrollbar">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 min-w-[300px] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!videos?.length || error) return null;

  return (
    <>
      <div>
        <div>
          <h2>
            Watch Our Latest Videos
          </h2>
          <div
            ref={scrollRef}
            {...handlers}
            className="flex gap-4 md:gap-6 overflow-x-auto pb-10 cursor-grab active:cursor-grabbing select-none no-scrollbar"
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
                  className="min-w-[280px] sm:min-w-[340px] md:min-w-[400px] pointer-events-auto"
                  onClick={() => {
                    if (wasDragged()) return;
                    setSelectedVideo({
                      url: video.youtube_url,
                      title: video.title,
                    });
                  }}
                >
                  <div>
                    <div>
                      {thumb && (
                        <img
                          src={thumb}
                          alt={video.title || 'Video'}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      )}
                      <div>
                        <div>
                          <Play className="text-white fill-current ml-1 w-6 h-6" />
                        </div>
                      </div>
                      {video.title && (
                        <div>
                          <div>
                            {video.title}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p>Swipe left or right to explore</p>
        </div>
      </div>
      <VideoModal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        videoUrl={selectedVideo?.url || ''}
        title={selectedVideo?.title}
      />
    </>
  );
};