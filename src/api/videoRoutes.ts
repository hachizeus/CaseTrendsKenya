import express from 'express';
const router = express.Router();

// Mock database for videos
let videos = [
  {
    id: 1,
    url: 'https://www.youtube.com/watch?v=example1',
    title: 'Sample Video 1',
    thumbnail: '',
    visibility: true,
    order: 1,
  },
  {
    id: 2,
    url: 'https://www.youtube.com/watch?v=example2',
    title: 'Sample Video 2',
    thumbnail: '',
    visibility: true,
    order: 2,
  },
];

// Get all videos
router.get('/videos', (req, res) => {
  const visibleVideos = videos.filter((video) => video.visibility);
  res.json(visibleVideos);
});

// Add a new video
router.post('/videos', (req, res) => {
  const { url, title, thumbnail, visibility, order } = req.body;
  const newVideo = {
    id: videos.length + 1,
    url,
    title,
    thumbnail,
    visibility,
    order,
  };
  videos.push(newVideo);
  res.status(201).json(newVideo);
});

// Update a video
router.put('/videos/:id', (req, res) => {
  const { id } = req.params;
  const { url, title, thumbnail, visibility, order } = req.body;
  const videoIndex = videos.findIndex((video) => video.id === parseInt(id));

  if (videoIndex === -1) {
    return res.status(404).json({ message: 'Video not found' });
  }

  videos[videoIndex] = {
    ...videos[videoIndex],
    url,
    title,
    thumbnail,
    visibility,
    order,
  };

  res.json(videos[videoIndex]);
});

// Delete a video
router.delete('/videos/:id', (req, res) => {
  const { id } = req.params;
  videos = videos.filter((video) => video.id !== parseInt(id));
  res.status(204).send();
});

export default router;