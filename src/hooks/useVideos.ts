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

// Extract YouTube ID from both regular and Shorts URLs
const extractYouTubeId = (url: string): string | null => {
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

// Get YouTube thumbnail URL (works for all video types)
export const getYouTubeThumbnail = (url: string, quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'hqdefault'): string | null => {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

// Validate YouTube URL (supports both regular and Shorts)
export const isValidYoutubeUrl = (url: string): boolean => {
  return extractYouTubeId(url) !== null;
};

// Fetch videos directly from Supabase (no API endpoint needed)
const fetchVideosFromSupabase = async (adminView: boolean = false): Promise<Video[]> => {
  let query = supabase
    .from('videos')
    .select('*')
    .order('display_order', { ascending: true });
  
  // If not admin view, only fetch visible videos
  if (!adminView) {
    query = query.eq('visible', true);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching videos from Supabase:', error);
    throw new Error('Failed to fetch videos');
  }
  
  return data || [];
};

// Add video to Supabase
const addVideoToSupabase = async (video: Omit<Video, 'id' | 'created_at' | 'updated_at' | 'display_order'>) => {
  // Validate URL before adding
  if (!isValidYoutubeUrl(video.youtube_url)) {
    throw new Error('Invalid YouTube URL. Please enter a valid YouTube video or Shorts URL.');
  }
  
  // Get current max display_order
  const { data: existingVideos } = await supabase
    .from('videos')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1);
  
  const nextOrder = (existingVideos?.[0]?.display_order ?? -1) + 1;
  
  const { data, error } = await supabase
    .from('videos')
    .insert([{
      youtube_url: video.youtube_url,
      title: video.title,
      thumbnail_url: video.thumbnail_url,
      visible: video.visible ?? true,
      display_order: nextOrder,
    }])
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data;
};

// Update video in Supabase
const updateVideoInSupabase = async ({ id, ...updates }: Partial<Video> & { id: string }) => {
  // Validate URL if it's being updated
  if (updates.youtube_url && !isValidYoutubeUrl(updates.youtube_url)) {
    throw new Error('Invalid YouTube URL. Please enter a valid YouTube video or Shorts URL.');
  }
  
  const { data, error } = await supabase
    .from('videos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data;
};

// Delete video from Supabase
const deleteVideoFromSupabase = async (id: string) => {
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', id);
  
  if (error) throw new Error(error.message);
};

// Update video visibility
const updateVideoVisibilityInSupabase = async ({ id, visible }: { id: string; visible: boolean }) => {
  const { data, error } = await supabase
    .from('videos')
    .update({ visible })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data;
};

// Reorder videos
const reorderVideosInSupabase = async (videos: Video[]) => {
  const updates = videos.map((video, index) => ({
    id: video.id,
    display_order: index,
  }));
  
  // Update each video with new display_order
  for (const update of updates) {
    const { error } = await supabase
      .from('videos')
      .update({ display_order: update.display_order })
      .eq('id', update.id);
    
    if (error) throw new Error(error.message);
  }
};

export const useVideos = (adminView: boolean = false) => {
  return useQuery({
    queryKey: ['videos', adminView],
    queryFn: () => fetchVideosFromSupabase(adminView),
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddVideo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addVideoToSupabase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Video added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add video');
    },
  });
};

export const useUpdateVideo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVideoInSupabase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Video updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update video');
    },
  });
};

export const useDeleteVideo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVideoFromSupabase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Video deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete video');
    },
  });
};

export const useUpdateVideoVisibility = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVideoVisibilityInSupabase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
};

export const useReorderVideos = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderVideosInSupabase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Videos reordered successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reorder videos');
    },
  });
};