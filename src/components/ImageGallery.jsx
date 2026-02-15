import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/ImageGallery.css';

/**
 * ImageGallery Component
 * Displays images in a gallery with lightbox view
 * 
 * @param {Object} props
 * @param {Array<string>} props.images - Array of image URLs
 * @param {Function} props.onClose - Callback when gallery is closed (optional)
 * @param {boolean} props.showCloseButton - Whether to show close button (default: true)
 */
export const ImageGallery = ({ images = [], onClose, showCloseButton = true }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="image-gallery empty">
        <p>No images available</p>
      </div>
    );
  }

  const openLightbox = (index) => {
    setSelectedIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const nextImage = () => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleKeyDown = (e) => {
    if (!isLightboxOpen) return;
    
    if (e.key === 'ArrowRight') {
      nextImage();
    } else if (e.key === 'ArrowLeft') {
      prevImage();
    } else if (e.key === 'Escape') {
      closeLightbox();
    }
  };

  React.useEffect(() => {
    if (isLightboxOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isLightboxOpen]);

  return (
    <>
      <div className="image-gallery">
        {images.map((imageUrl, index) => (
          <div
            key={index}
            className="gallery-item"
            onClick={() => openLightbox(index)}
          >
            <img src={imageUrl} alt={`Reference ${index + 1}`} />
            <div className="gallery-overlay">
              <span>Click to enlarge</span>
            </div>
          </div>
        ))}
      </div>

      {isLightboxOpen && (
        <div className="lightbox" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            {showCloseButton && (
              <button className="lightbox-close" onClick={closeLightbox}>
                <X size={24} />
              </button>
            )}
            
            {images.length > 1 && (
              <>
                <button className="lightbox-nav lightbox-prev" onClick={prevImage}>
                  <ChevronLeft size={32} />
                </button>
                <button className="lightbox-nav lightbox-next" onClick={nextImage}>
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            <img src={images[selectedIndex]} alt={`Reference ${selectedIndex + 1}`} />
            
            {images.length > 1 && (
              <div className="lightbox-counter">
                {selectedIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};


