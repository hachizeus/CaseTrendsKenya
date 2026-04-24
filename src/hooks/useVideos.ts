import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Video {
  id: string;
  youtube_url: string;
  title: string | null;
  thumbnail_url: string | null;
  visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const fetchVideos = async (adminView: boolean = false): Promise<Video[]> => {
  const endpoint = adminView ? '/api/admin/videos' : '/api/videos';
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error('Failed to fetch videos');
  return response.json();
};

const addVideo = async (video: Omit<Video, 'id' | 'created_at' | 'updated_at' | 'display_order'>) => {
  const response = await fetch('/api/admin/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(video),
  });
  if (!response.ok) throw new Error('Failed to add video');
  return response.json();
};

const updateVideo = async ({ id, ...updates }: Partial<Video> & { id: string }) => {
  const response = await fetch(`/api/admin/videos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update video');
  return response.json();
};

const deleteVideo = async (id: string) => {
  const response = await fetch(`/api/admin/videos/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete video');
};

const updateVideoVisibility = async ({ id, visible }: { id: string; visible: boolean }) => {
  const response = await fetch(`/api/admin/videos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visible }),
  });
  if (!response.ok) throw new Error('Failed to update visibility');
  return response.json();
};

const reorderVideos = async (videos: Video[]) => {
  const reorderedData = videos.map((video, index) => ({
    id: video.id,
    display_order: index,
  }));
  
  const response = await fetch('/api/admin/videos/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videos: reorderedData }),
  });
  if (!response.ok) throw new Error('Failed to reorder videos');
};

export const useVideos = (adminView: boolean = false) => {
  return useQuery({
    queryKey: ['videos', adminView],
    queryFn: () => fetchVideos(adminView),
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddVideo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Video added successfully');
    },
    onError: () => {
      toast.error('Failed to add video');
    },
  });
};

export const useUpdateVideo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Video updated successfully');
    },
    onError: () => {
      toast.error('Failed to update video');
    },
  });
};

export const useDeleteVideo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Video deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete video');
    },
  });
};

export const useUpdateVideoVisibility = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVideoVisibility,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
};

export const useReorderVideos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderVideos,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Videos reordered successfully');
    },
    onError: () => {
      toast.error('Failed to reorder videos');
    },
  });
};