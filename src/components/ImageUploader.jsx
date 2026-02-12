import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import '../styles/ImageUploader.css';

/**
 * ImageUploader Component
 * Reusable image upload component with drag-and-drop support
 * 
 * @param {Object} props
 * @param {Function} props.onUpload - Callback when images are selected (receives File[])
 * @param {number} props.maxImages - Maximum number of images (default: 10)
 * @param {number} props.maxSizeMB - Maximum file size in MB (default: 10)
 * @param {Array<string>} props.acceptedTypes - Accepted file types (default: ['image/jpeg', 'image/png'])
 * @param {boolean} props.disabled - Whether upload is disabled
 */
export const ImageUploader = ({
  onUpload,
  maxImages = 10,
  maxSizeMB = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg'],
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not supported. Please use JPEG or PNG.`);
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      throw new Error(`File size ${sizeMB.toFixed(2)}MB exceeds maximum ${maxSizeMB}MB`);
    }

    return true;
  };

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    
    // Check total count
    if (previewImages.length + fileArray.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    const validFiles = [];
    const errors = [];

    fileArray.forEach((file) => {
      try {
        validateFile(file);
        validFiles.push(file);
      } catch (error) {
        errors.push(`${file.name}: ${error.message}`);
      }
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      const newPreviews = validFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        name: file.name
      }));

      setPreviewImages((prev) => [...prev, ...newPreviews]);
      
      if (onUpload) {
        onUpload(validFiles);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFiles(files);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    const removed = previewImages[index];
    URL.revokeObjectURL(removed.preview);
    
    const newPreviews = previewImages.filter((_, i) => i !== index);
    setPreviewImages(newPreviews);
    
    // Notify parent of removed files
    if (onUpload) {
      const remainingFiles = newPreviews.map(p => p.file);
      onUpload(remainingFiles);
    }
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="image-uploader">
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={disabled}
        />
        
        <div className="upload-content">
          <Upload size={48} className="upload-icon" />
          <p className="upload-text">
            {isDragging ? 'Drop images here' : 'Drag & drop images here'}
          </p>
          <p className="upload-hint">
            or click to browse (max {maxImages} images, {maxSizeMB}MB each)
          </p>
          <p className="upload-formats">JPEG, PNG</p>
        </div>
      </div>

      {previewImages.length > 0 && (
        <div className="preview-grid">
          {previewImages.map((preview, index) => (
            <div key={index} className="preview-item">
              <img src={preview.preview} alt={preview.name} />
              <button
                type="button"
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                disabled={disabled}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


