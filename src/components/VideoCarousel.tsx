import React, { useState, useEffect } from 'react';
import './VideoCarousel.css';

const VideoCarousel = () => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    fetch('/api/videos')
      .then((response) => response.json())
      .then((data) => setVideos(data))
      .catch((error) => console.error('Error fetching videos:', error));
  }, []);

  return (
    <div className="video-carousel">
      {videos.map((video, index) => (
        <div key={index} className="video-card">
          <img
            src={video.thumbnail || `https://img.youtube.com/vi/${video.url.split('v=')[1]}/0.jpg`}
            alt={video.title || 'Video Thumbnail'}
            className="video-thumbnail"
          />
          <div className="play-icon-overlay">▶</div>
        </div>
      ))}
    </div>
  );
};

export default VideoCarousel;