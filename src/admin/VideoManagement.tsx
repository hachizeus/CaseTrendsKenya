import React, { useState, useEffect } from 'react';
import './VideoManagement.css';

const VideoManagement = () => {
  const [videos, setVideos] = useState([]);
  const [newVideo, setNewVideo] = useState({ url: '', title: '', thumbnail: '', visible: true });

  useEffect(() => {
    fetch('/api/videos')
      .then((response) => response.json())
      .then((data) => setVideos(data));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVideo({ ...newVideo, [name]: value });
  };

  const addVideo = () => {
    fetch('/api/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVideo),
    })
      .then((response) => response.json())
      .then((data) => setVideos([...videos, data]));

    setNewVideo({ url: '', title: '', thumbnail: '', visible: true });
  };

  return (
    <div className="video-management">
      <h1>Manage Videos</h1>
      <div className="add-video-form">
        <input
          type="text"
          name="url"
          placeholder="YouTube URL"
          value={newVideo.url}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="title"
          placeholder="Title (optional)"
          value={newVideo.title}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="thumbnail"
          placeholder="Thumbnail URL (optional)"
          value={newVideo.thumbnail}
          onChange={handleInputChange}
        />
        <button onClick={addVideo}>Add Video</button>
      </div>
      <ul>
        {videos.map((video) => (
          <li key={video.id}>{video.title || 'Untitled'} - {video.url}</li>
        ))}
      </ul>
    </div>
  );
};

export default VideoManagement;