import express from 'express';
import { supabase } from '@/integrations/supabase/client';

const router = express.Router();

// Get all videos (admin view - includes hidden)
router.get('/admin/videos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get visible videos for frontend
router.get('/videos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('visible', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching visible videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Add a new video
router.post('/admin/videos', async (req, res) => {
  try {
    const { youtube_url, title, thumbnail_url, visible } = req.body;
    
    // Get current max display_order
    const { data: maxOrderData } = await supabase
      .from('videos')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1);
    
    const display_order = maxOrderData && maxOrderData.length > 0 
      ? (maxOrderData[0].display_order + 1) 
      : 0;

    const { data, error } = await supabase
      .from('videos')
      .insert({
        youtube_url,
        title,
        thumbnail_url,
        visible: visible ?? true,
        display_order
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error adding video:', error);
    res.status(500).json({ error: 'Failed to add video' });
  }
});

// Delete a video
router.delete('/admin/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// Update video visibility
router.patch('/admin/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { visible } = req.body;
    const { data, error } = await supabase
      .from('videos')
      .update({ visible })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// Update video (full update for edit)
router.put('/admin/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { youtube_url, title, thumbnail_url, visible } = req.body;
    const { data, error } = await supabase
      .from('videos')
      .update({ youtube_url, title, thumbnail_url, visible })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// Reorder videos
router.post('/admin/videos/reorder', async (req, res) => {
  try {
    const { videos } = req.body;
    
    // Update each video's display_order individually
    for (const video of videos) {
      const { error } = await supabase
        .from('videos')
        .update({ display_order: video.display_order })
        .eq('id', video.id);
      
      if (error) throw error;
    }
    
    res.status(200).json({ message: 'Videos reordered successfully' });
  } catch (error) {
    console.error('Error reordering videos:', error);
    res.status(500).json({ error: 'Failed to reorder videos' });
  }
});

export default router;