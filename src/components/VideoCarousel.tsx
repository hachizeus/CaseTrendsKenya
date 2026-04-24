import React, { useState, useEffect } from 'react';
import './VideoCarousel.css'; // Import styles for the carousel

const VideoCarousel = () => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    // Fetch videos from the backend API
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
            srcset={video.srcset || `https://img.youtube.com/vi/${video.url.split('v=')[1]}/0.jpg`}
            sizes={video.sizes || '100vw'}
            alt={video.title || 'Video thumbnail'}
            loading="lazy"
            className="responsive-image"
          />
          <div className="play-icon">▶</div>
        </div>
      ))}
    </div>
  );
};

export default VideoCarousel;