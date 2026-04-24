import express from 'express';
const router = express.Router();

// Mock database
let videos = [];

// Get all videos
router.get('/videos', (req, res) => {
  res.json(videos);
});

// Add a new video
router.post('/videos', (req, res) => {
  const { url, title, thumbnail, visible } = req.body;
  const newVideo = {
    id: videos.length + 1,
    url,
    title,
    thumbnail,
    visible: visible ?? true,
  };
  videos.push(newVideo);
  res.status(201).json(newVideo);
});

// Delete a video
router.delete('/videos/:id', (req, res) => {
  const { id } = req.params;
  videos = videos.filter((video) => video.id !== parseInt(id));
  res.status(204).send();
});

// Update video visibility
router.patch('/videos/:id', (req, res) => {
  const { id } = req.params;
  const { visible } = req.body;
  const video = videos.find((v) => v.id === parseInt(id));
  if (video) {
    video.visible = visible;
    res.json(video);
  } else {
    res.status(404).send('Video not found');
  }
});

// Reorder videos
router.post('/videos/reorder', (req, res) => {
  const reorderedVideos = req.body;
  videos = reorderedVideos;
  res.status(200).send('Videos reordered successfully');
});

export default router;