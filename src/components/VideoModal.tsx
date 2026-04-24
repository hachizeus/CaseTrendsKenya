import { useEffect, useRef } from 'react';
import { X, Play } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string | null;
}

export const VideoModal = ({ isOpen, onClose, videoUrl, title }: VideoModalProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Extract YouTube video ID
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYouTubeId(videoUrl);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1` : '';

  useEffect(() => {
    if (!isOpen && iframeRef.current) {
      // Reset iframe src when modal closes
      const iframe = iframeRef.current;
      const src = iframe.src;
      iframe.src = '';
      iframe.src = src;
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[90vw] p-0 bg-black/95 border-none rounded-2xl overflow-hidden">
        <button
          onClick={onClose}
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
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title={title || 'YouTube video player'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};