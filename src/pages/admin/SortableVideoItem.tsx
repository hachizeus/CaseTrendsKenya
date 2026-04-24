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
    return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
  };

  const thumbnail = video.thumbnail_url || getYouTubeThumbnail(video.youtube_url);

  return (
    <Card ref={setNodeRef} style={style} className="overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>
        
        <div className="w-32 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
          {thumbnail ? (
            <img src={thumbnail} alt={video.title || 'Video thumbnail'} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-xs text-gray-400">No preview</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{video.title || 'Untitled Video'}</h3>
            <Badge variant={video.visible ? 'default' : 'secondary'}>
              {video.visible ? 'Published' : 'Hidden'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate mt-1">{video.youtube_url}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Order: {video.display_order}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleVisibility}
            title={video.visible ? 'Hide' : 'Show'}
          >
            {video.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={onEdit}
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          
          <Button
            variant="destructive"
            size="icon"
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};