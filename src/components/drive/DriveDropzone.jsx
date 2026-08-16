import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDriveMotion } from './motionConfig';

/**
 * Wraps the folder contents area; accepts OS file drops (native HTML5 DnD,
 * modeled on components/ImageUploader.jsx). This is a different interaction
 * from in-app item->folder dragging (DriveItem.jsx, via react-dnd) — dropping
 * files in from the desktop uses DataTransfer.files, not a drag payload.
 */
const DriveDropzone = ({ onFilesDropped, children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const motionCfg = useDriveMotion();

  const handleDragOver = (e) => {
    e.preventDefault();
    if (e.dataTransfer.types?.includes('Files')) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (e.currentTarget === e.target) setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      onFilesDropped?.(e.dataTransfer.files);
    }
  };

  return (
    <Box
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{ position: 'relative', minHeight: 300 }}
    >
      {children}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={motionCfg.tap}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: 'rgba(139,111,71,0.08)',
              border: '2px dashed #8b6f47',
              borderRadius: 12,
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            <UploadCloud size={40} color="#8b6f47" />
            <Typography color="#5d4e37" fontWeight={600}>
              Drop to upload
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default DriveDropzone;
