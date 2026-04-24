import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string | null;
}

export function VideoModal({ isOpen, onClose, videoUrl, title }: VideoModalProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  
  // Extract YouTube video ID from various URL formats
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

  useEffect(() => {
    if (isOpen && videoUrl) {
      const videoId = getYouTubeId(videoUrl);
      if (videoId) {
        setEmbedUrl(`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`);
      } else {
        setEmbedUrl(null);
      }
    } else {
      setEmbedUrl(null);
    }
  }, [isOpen, videoUrl]);

  const handleClose = () => {
    setEmbedUrl(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl w-[90vw] p-0 bg-black/95 border-none rounded-2xl overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-200 hover:scale-110"
        >
          <X className="w-5 h-5" />
        </button>
        
        {title && (
          <div className="absolute top-4 left-4 z-50">
            <h3 className="text-white text-lg font-semibold bg-black/50 px-3 py-1.5 rounded-full">
              {title}
            </h3>
          </div>
        )}
        
        <div className="relative pt-[56.25%]">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={title || 'YouTube video player'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full"
            />
          ) : (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900">
              <p className="text-white">Unable to load video</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}