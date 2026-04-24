import React, { useState, useEffect } from 'react';
import './VideoManagement.css';

const VideoManagement = () => {
  const [videos, setVideos] = useState([]);
  const [newVideo, setNewVideo] = useState({ url: '', title: '', thumbnail: '', visible: true });

  useEffect(() => {
    // Fetch existing videos from backend
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

  const deleteVideo = (id) => {
    fetch(`/api/videos/${id}`, { method: 'DELETE' })
      .then(() => setVideos(videos.filter((video) => video.id !== id)));
  };

  const toggleVisibility = (id) => {
    const video = videos.find((v) => v.id === id);
    fetch(`/api/videos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !video.visible }),
    })
      .then(() => {
        setVideos(
          videos.map((v) => (v.id === id ? { ...v, visible: !v.visible } : v))
        );
      });
  };

  const reorderVideos = (startIndex, endIndex) => {
    const result = Array.from(videos);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setVideos(result);

    // Update order in backend
    fetch('/api/videos/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.map((video, index) => ({ id: video.id, order: index })));
    });
  };

  return (
    <div className="video-management">
      <h1>Video Management</h1>

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

      <ul className="video-list">
        {videos.map((video, index) => (
          <li key={video.id} className="video-item">
            <span>{video.title || 'Untitled'}</span>
            <button onClick={() => toggleVisibility(video.id)}>
              {video.visible ? 'Unpublish' : 'Publish'}
            </button>
            <button onClick={() => deleteVideo(video.id)}>Delete</button>
            <button
              onClick={() => reorderVideos(index, index - 1)}
              disabled={index === 0}
            >
              ↑
            </button>
            <button
              onClick={() => reorderVideos(index, index + 1)}
              disabled={index === videos.length - 1}
            >
              ↓
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VideoManagement;