import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useVideos } from "@/hooks/useVideos";
import { VideoModal } from "./VideoModal";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

export const VideoSection = () => {
  const { data: videos, isLoading, error } = useVideos(false);

  const [selectedVideo, setSelectedVideo] = useState<{
    url: string;
    title: string | null;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const moved = useRef(false);

  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const autoplaySpeed = isMobile ? 0.35 : 0.6;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Extract YouTube ID from both regular and Shorts URLs
  const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/,
      /youtube\.com\/watch\?.*v=([^&]+)/,
      /youtube\.com\/shorts\/([^/?]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  const getYouTubeThumbnail = (url: string, quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'hqdefault') => {
    const id = getYouTubeId(url);
    if (!id) return null;
    return `https://img.youtube.com/vi/${id}/${quality}.jpg`;
  };

  // duplicate for seamless infinite loop
  const loopVideos = useMemo(() => {
    if (!videos?.length) return [];
    return [...videos, ...videos];
  }, [videos]);

  const autoScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (!isPaused && !isDragging.current) {
      el.scrollLeft += autoplaySpeed;

      // seamless reset at midpoint
      if (el.scrollLeft >= el.scrollWidth / 2) {
        el.scrollLeft = 0;
      }
    }

    rafRef.current = requestAnimationFrame(autoScroll);
  }, [isPaused, autoplaySpeed]);

  useEffect(() => {
    if (loopVideos.length) {
      rafRef.current = requestAnimationFrame(autoScroll);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [autoScroll, loopVideos]);

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    moved.current = false;
    startX.current = e.touches[0].clientX;
    startScrollLeft.current = scrollRef.current?.scrollLeft || 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    
    const delta = e.touches[0].clientX - startX.current;
    if (Math.abs(delta) > 5) {
      moved.current = true;
      scrollRef.current.scrollLeft = startScrollLeft.current - delta;
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  // Mouse handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    isDragging.current = true;
    moved.current = false;
    startX.current = e.clientX;
    startScrollLeft.current = scrollRef.current?.scrollLeft || 0;
    scrollRef.current!.style.scrollBehavior = "auto";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current || isMobile) return;
    
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 5) {
      moved.current = true;
      scrollRef.current.scrollLeft = startScrollLeft.current - delta;
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.scrollBehavior = "smooth";
    }
  };

  const scrollTo = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const amount = isMobile ? 240 : 360;
    scrollRef.current.scrollTo({
      left: scrollRef.current.scrollLeft + (direction === "left" ? -amount : amount),
      behavior: "smooth",
    });
  };

  if (isLoading) {
    return (
      <section className="py-8 md:py-10 bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]">
        <div className="w-full">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-6 px-4">
            Watch Our Latest Videos
          </h2>
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 px-4 no-scrollbar">
            {[...Array(4)].map((_, i) => (
              <Skeleton
                key={i}
                className="h-[160px] md:h-[200px] w-[220px] sm:w-[260px] md:w-[320px] rounded-2xl bg-[hsl(240,10%,8%)] border border-white/5 flex-shrink-0"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!videos?.length || error) return null;

  return (
    <>
      <section className="py-8 md:py-10 bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)] overflow-hidden">
        <div className="w-full">
          <div className="flex items-center justify-between mb-6 px-4">
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
              Watch Our Latest Videos
            </h2>

            <div className="hidden md:flex gap-2">
              <button
                onClick={() => scrollTo("left")}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollTo("right")}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative w-full">
            <div
              ref={scrollRef}
              onMouseEnter={() => !isMobile && setIsPaused(true)}
              onMouseLeave={() => !isMobile && setIsPaused(false)}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="flex gap-3 md:gap-4 overflow-x-auto px-4 pb-4 no-scrollbar cursor-grab active:cursor-grabbing"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {loopVideos.map((video, index) => {
                // Use custom thumbnail if provided, otherwise get YouTube thumbnail (works for all formats)
                const thumb = video.thumbnail_url || getYouTubeThumbnail(video.youtube_url, 'hqdefault');

                return (
                  <div
                    key={`${video.id}-${index}`}
                    className="flex-shrink-0 w-[220px] sm:w-[260px] md:w-[320px]"
                    onClick={() => {
                      if (moved.current) return;
                      setSelectedVideo({
                        url: video.youtube_url,
                        title: video.title,
                      });
                    }}
                  >
                    <div className="relative group cursor-pointer">
                      <div className="relative h-[160px] sm:h-[180px] md:h-[200px] rounded-2xl overflow-hidden bg-gradient-to-br from-[hsl(240,10%,8%)] to-[hsl(240,10%,6%)] border border-white/10 hover:border-primary/50 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/10">
                        {thumb && (
                          <img
                            src={thumb}
                            alt={video.title || "Video"}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            draggable={false}
                            loading="lazy"
                            onError={(e) => {
                              // Fallback to different quality if image fails to load
                              const target = e.target as HTMLImageElement;
                              if (target.src.includes('hqdefault')) {
                                target.src = getYouTubeThumbnail(video.youtube_url, 'mqdefault') || '';
                              } else if (target.src.includes('mqdefault')) {
                                target.src = getYouTubeThumbnail(video.youtube_url, 'default') || '';
                              }
                            }}
                          />
                        )}

                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center group-hover:bg-primary/90 group-hover:scale-110 transition-all duration-300">
                            <Play className="w-5 h-5 md:w-6 md:h-6 text-white fill-current ml-0.5" />
                          </div>
                        </div>

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

            {/* edge fades */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-16 bg-gradient-to-r from-[hsl(240,10%,3.9%)] to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-16 bg-gradient-to-l from-[hsl(240,10%,3.9%)] to-transparent z-10" />
          </div>

          <p className="text-white/40 text-xs mt-3 text-center md:hidden px-4">
            ← Swipe to explore more videos →
          </p>
        </div>
      </section>

      <VideoModal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        videoUrl={selectedVideo?.url || ""}
        title={selectedVideo?.title}
      />
    </>
  );
};