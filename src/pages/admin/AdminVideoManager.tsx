import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useVideos, useDeleteVideo, useReorderVideos, useUpdateVideoVisibility, Video } from '@/hooks/useVideos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Eye, EyeOff, GripVertical, Youtube, Link, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { SortableVideoItem } from './SortableVideoItem';

const AdminVideoManager = () => {
  const { data: videos, isLoading, refetch } = useVideos(true);
  const deleteVideo = useDeleteVideo();
  const reorderVideos = useReorderVideos();
  const updateVisibility = useUpdateVideoVisibility();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [newVideo, setNewVideo] = useState({
    youtube_url: '',
    title: '',
    thumbnail_url: '',
    visible: true,
  });
  const [urlError, setUrlError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id && videos) {
      const oldIndex = videos.findIndex((v) => v.id === active.id);
      const newIndex = videos.findIndex((v) => v.id === over?.id);
      const newOrder = arrayMove(videos, oldIndex, newIndex);
      reorderVideos.mutate(newOrder);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this video?')) {
      await deleteVideo.mutateAsync(id);
    }
  };

  const handleToggleVisibility = async (id: string, visible: boolean) => {
    await updateVisibility.mutateAsync({ id, visible: !visible });
  };

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

  const validateYouTubeUrl = (url: string): boolean => {
    return getYouTubeId(url) !== null;
  };

  const getYouTubeThumbnail = (url: string, quality: 'default' | 'mqdefault' | 'hqdefault' = 'mqdefault') => {
    const id = getYouTubeId(url);
    if (!id) return null;
    // YouTube thumbnails work for both regular videos and Shorts
    return `https://img.youtube.com/vi/${id}/${quality}.jpg`;
  };

  const handleUrlChange = (url: string, setter: (value: string) => void) => {
    setter(url);
    if (url && !validateYouTubeUrl(url)) {
      setUrlError('Please enter a valid YouTube video or Shorts URL');
    } else {
      setUrlError('');
    }
  };

  const handleAddVideo = async () => {
    if (!newVideo.youtube_url) {
      toast.error('Please enter a YouTube URL');
      return;
    }
    
    if (!validateYouTubeUrl(newVideo.youtube_url)) {
      toast.error('Please enter a valid YouTube video or Shorts URL');
      return;
    }
    
    const response = await fetch('/api/admin/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVideo),
    });
    
    if (response.ok) {
      toast.success('Video added successfully');
      setIsAddDialogOpen(false);
      setNewVideo({ youtube_url: '', title: '', thumbnail_url: '', visible: true });
      setUrlError('');
      refetch();
    } else {
      const error = await response.json();
      toast.error(error.error || 'Failed to add video');
    }
  };

  const handleUpdateVideo = async () => {
    if (!editingVideo) return;
    
    if (editingVideo.youtube_url && !validateYouTubeUrl(editingVideo.youtube_url)) {
      toast.error('Please enter a valid YouTube video or Shorts URL');
      return;
    }
    
    const response = await fetch(`/api/admin/videos/${editingVideo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        youtube_url: editingVideo.youtube_url,
        title: editingVideo.title,
        thumbnail_url: editingVideo.thumbnail_url,
        visible: editingVideo.visible,
      }),
    });
    
    if (response.ok) {
      toast.success('Video updated successfully');
      setEditingVideo(null);
      refetch();
    } else {
      const error = await response.json();
      toast.error(error.error || 'Failed to update video');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Video Manager</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage YouTube videos and Shorts displayed in the carousel section
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Video / Short
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Video or Short</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>YouTube URL *</Label>
                <div className="relative mt-1">
                  <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="https://www.youtube.com/watch?v=... or https://youtube.com/shorts/..."
                    value={newVideo.youtube_url}
                    onChange={(e) => handleUrlChange(e.target.value, (val) => setNewVideo({ ...newVideo, youtube_url: val }))}
                    className={`pl-9 ${urlError ? 'border-red-500' : ''}`}
                  />
                </div>
                {urlError && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {urlError}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Supports regular YouTube videos and YouTube Shorts
                </p>
              </div>
              
              <div>
                <Label>Title (Optional)</Label>
                <Input
                  placeholder="Video title"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Custom Thumbnail URL (Optional)</Label>
                <div className="relative mt-1">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="https://example.com/thumbnail.jpg"
                    value={newVideo.thumbnail_url}
                    onChange={(e) => setNewVideo({ ...newVideo, thumbnail_url: e.target.value })}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports JPG, PNG, WEBP, and other image formats. Leave empty to use YouTube's auto-generated thumbnail.
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Visible on Frontend</Label>
                <Switch
                  checked={newVideo.visible}
                  onCheckedChange={(checked) => setNewVideo({ ...newVideo, visible: checked })}
                />
              </div>
              
              {newVideo.youtube_url && !newVideo.thumbnail_url && !urlError && validateYouTubeUrl(newVideo.youtube_url) && (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-2">Thumbnail Preview:</p>
                  <img
                    src={getYouTubeThumbnail(newVideo.youtube_url, 'mqdefault') || ''}
                    alt="Thumbnail preview"
                    className="w-full rounded-lg border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // Fallback to different quality if image fails
                      if (target.src.includes('mqdefault')) {
                        target.src = getYouTubeThumbnail(newVideo.youtube_url, 'default') || '';
                      }
                    }}
                  />
                </div>
              )}
              
              <Button onClick={handleAddVideo} className="w-full" disabled={!!urlError}>
                Add Video
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {videos && videos.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={videos.map(v => v.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {videos.map((video) => (
                <SortableVideoItem
                  key={video.id}
                  video={video}
                  onDelete={() => handleDelete(video.id)}
                  onToggleVisibility={() => handleToggleVisibility(video.id, video.visible)}
                  onEdit={() => setEditingVideo(video)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Youtube className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No videos or Shorts added yet</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsAddDialogOpen(true)}
            >
              Add Your First Video or Short
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Edit Dialog */}
      <Dialog open={!!editingVideo} onOpenChange={() => setEditingVideo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Video / Short</DialogTitle>
          </DialogHeader>
          {editingVideo && (
            <div className="space-y-4">
              <div>
                <Label>YouTube URL *</Label>
                <div className="relative mt-1">
                  <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={editingVideo.youtube_url}
                    onChange={(e) => {
                      setEditingVideo({ ...editingVideo, youtube_url: e.target.value });
                      if (e.target.value && !validateYouTubeUrl(e.target.value)) {
                        setUrlError('Please enter a valid YouTube video or Shorts URL');
                      } else {
                        setUrlError('');
                      }
                    }}
                    className={`pl-9 ${urlError ? 'border-red-500' : ''}`}
                  />
                </div>
                {urlError && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {urlError}
                  </p>
                )}
              </div>
              
              <div>
                <Label>Title</Label>
                <Input
                  value={editingVideo.title || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Custom Thumbnail URL</Label>
                <div className="relative mt-1">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={editingVideo.thumbnail_url || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, thumbnail_url: e.target.value })}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports JPG, PNG, WEBP, and other image formats
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Visible</Label>
                <Switch
                  checked={editingVideo.visible}
                  onCheckedChange={(checked) => setEditingVideo({ ...editingVideo, visible: checked })}
                />
              </div>
              
              {editingVideo.youtube_url && validateYouTubeUrl(editingVideo.youtube_url) && !editingVideo.thumbnail_url && (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-2">Current Thumbnail Preview:</p>
                  <img
                    src={getYouTubeThumbnail(editingVideo.youtube_url, 'mqdefault') || ''}
                    alt="Thumbnail preview"
                    className="w-full rounded-lg border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src.includes('mqdefault')) {
                        target.src = getYouTubeThumbnail(editingVideo.youtube_url, 'default') || '';
                      }
                    }}
                  />
                </div>
              )}
              
              <Button onClick={handleUpdateVideo} className="w-full" disabled={!!urlError}>
                Update Video
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVideoManager;