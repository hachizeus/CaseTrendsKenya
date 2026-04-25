import { useState, useRef, useEffect, useCallback } from 'react';
import { useVideos } from '@/hooks/useVideos';
import { VideoModal } from './VideoModal';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export const VideoSection = () => {
  const { data: videos, isLoading, error } = useVideos(false);
  const [selectedVideo, setSelectedVideo] = useState<{
    url: string;
    title: string | null;
  } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const [isPaused, setIsPaused] = useState(false);
  const isInteracting = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const moved = useRef(false);
  const autoplaySpeed = 0.4;
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent));
  }, []);

  const getYouTubeThumbnail = (url: string) => {
    const id = url.match(/(?:youtube.com\/watch\?v=|youtu.be\/)([^&?#]+)/)?.[1];
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  };

  const autoScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (!isPaused && !isInteracting.current) {
      el.scrollLeft += autoplaySpeed;

      // Reset to beginning when reaching the end
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth) {
        el.scrollLeft = 0;
      }
    }

    rafRef.current = requestAnimationFrame(autoScroll);
  }, [autoplaySpeed, isPaused]);

  useEffect(() => {
    if (videos && videos.length > 0) {
      rafRef.current = requestAnimationFrame(autoScroll);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [autoScroll, videos]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!scrollRef.current) return;
    
    e.preventDefault();
    
    isInteracting.current = true;
    moved.current = false;
    startX.current = e.clientX;
    startScrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.scrollBehavior = 'auto';
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isInteracting.current || !scrollRef.current) return;
    
    e.preventDefault();
    
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 5) {
      moved.current = true;
      scrollRef.current.scrollLeft = startScrollLeft.current - delta;
    }
  };

  const onPointerUp = () => {
    isInteracting.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.scrollBehavior = 'smooth';
    }
  };

  const wasDragged = () => moved.current;

  const scrollTo = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    scrollRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
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
              <Skeleton key={i} className="h-[160px] md:h-[200px] w-[220px] sm:w-[260px] md:w-[320px] rounded-xl bg-[hsl(240,10%,8%)] border border-white/5 flex-shrink-0" />
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
            <div className="hidden md:flex gap-2">
              <button
                onClick={() => scrollTo('left')}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollTo('right')}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Auto-scrolling container */}
          <div 
            className="relative overflow-x-hidden pb-4 px-4"
            style={{ 
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div 
              ref={scrollRef}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="flex gap-3 md:gap-4 overflow-x-hidden cursor-grab active:cursor-grabbing"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <style dangerouslySetInnerHTML={{ __html: `
                .no-scrollbar::-webkit-scrollbar { display: none !important; }
              ` }} />
              
              {videos.map((video, index) => {
                const thumb = video.thumbnail_url || getYouTubeThumbnail(video.youtube_url);
                return (
                  <div
                    key={video.id}
                    className="flex-shrink-0 w-[220px] sm:w-[260px] md:w-[320px]"
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
          </div>
          
          {/* Scroll hint */}
          <p className="text-white/40 text-xs mt-3 text-center md:hidden px-4">
            Drag left or right to explore → 
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