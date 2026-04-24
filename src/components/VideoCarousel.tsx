import React, { useState, useEffect } from 'react';
import './VideoCarousel.css'; // Import styles for the carousel
import 'tailwindcss/tailwind.css';

const VideoCarousel = () => {
  const [videos, setVideos] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);

  useEffect(() => {
    // Fetch videos from the backend API
    fetch('/api/videos')
      .then((response) => response.json())
      .then((data) => setVideos(data))
      .catch((error) => console.error('Error fetching videos:', error));
  }, []);

  const openModal = (video) => {
    setModalIsOpen(true);
    setCurrentVideo(video);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setCurrentVideo(null);
  };

  return (
    <div className="relative overflow-hidden py-5">
      <Slider {...settings}>
        {videos.map((video) => (
          <div
            key={video.id}
            className="relative cursor-pointer transition-transform transform hover:scale-105"
            onClick={() => openModal(video)}
          >
            <img
              src={video.thumbnail || `https://img.youtube.com/vi/${video.url.split('v=')[1]}/0.jpg`}
              alt={video.title}
              className="w-full h-auto rounded-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center text-white text-4xl">
              ▶
            </div>
          </div>
        ))}
      </Slider>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Video Modal"
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        {currentVideo && (
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${currentVideo.url.split('v=')[1]}?autoplay=1`}
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="rounded-lg"
          ></iframe>
        )}
        <button
          className="absolute top-5 right-5 text-white text-2xl"
          onClick={closeModal}
        >
          ×
        </button>
      </Modal>
    </div>
  );
};

export default VideoCarousel;