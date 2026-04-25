import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Video } from '@/hooks/useVideos';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Trash2, Eye, EyeOff, Edit2 } from 'lucide-react';

interface SortableVideoItemProps {
  video: Video;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onEdit: () => void;
}

export const SortableVideoItem = ({ video, onDelete, onToggleVisibility, onEdit }: SortableVideoItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getYouTubeThumbnail = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.webp` : null;
  };

  const thumbnail = video.thumbnail_url || getYouTubeThumbnail(video.youtube_url);

  return (
    <Card ref={setNodeRef} style={style} className="overflow-hidden bg-white/5 border-white/10">
      <div className="flex items-center gap-4 p-4">
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5 text-white/40 hover:text-white/60 transition-colors" />
        </div>
        
        {/* Thumbnail */}
        <div className="w-32 h-20 flex-shrink-0 bg-black/30 rounded-lg overflow-hidden border border-white/10">
          {thumbnail ? (
            <img 
              src={thumbnail} 
              alt={video.title || 'Video thumbnail'} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/5">
              <span className="text-xs text-white/30">No preview</span>
            </div>
          )}
        </div>
        
        {/* Video Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-white truncate">{video.title || 'Untitled Video'}</h3>
            <Badge 
              variant={video.visible ? 'default' : 'secondary'} 
              className={video.visible 
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                : "bg-white/10 text-white/50 border-white/10"
              }
            >
              {video.visible ? 'Published' : 'Hidden'}
            </Badge>
          </div>
          <p className="text-sm text-white/50 truncate mt-1">{video.youtube_url}</p>
          <p className="text-xs text-white/30 mt-1">
            Order: {video.display_order}
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleVisibility}
            title={video.visible ? 'Hide' : 'Show'}
            className="border-white/20 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/30"
          >
            {video.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={onEdit}
            title="Edit"
            className="border-white/20 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/30"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          
          <Button
            variant="destructive"
            size="icon"
            onClick={onDelete}
            title="Delete"
            className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};