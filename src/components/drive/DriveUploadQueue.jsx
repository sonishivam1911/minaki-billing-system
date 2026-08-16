import React from 'react';
import { Box, LinearProgress, Typography, IconButton, Paper } from '@mui/material';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDriveMotion } from './motionConfig';

/**
 * Floating progress list for in-flight presigned uploads (see useDrive.uploadFile,
 * which reports real XHR progress — not a fake/indeterminate bar).
 */
const DriveUploadQueue = ({ items = [], onDismiss }) => {
  const motionCfg = useDriveMotion();
  if (items.length === 0) return null;

  return (
    <Box sx={{ position: 'fixed', bottom: 16, right: 16, width: 320, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <AnimatePresence>
        {items.map((upload) => (
          <motion.div
            key={upload.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={motionCfg.move}
          >
            <Paper elevation={3} sx={{ p: 1.5, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {upload.status === 'done' && <CheckCircle2 size={16} color="#2e7d32" />}
                {upload.status === 'error' && <AlertCircle size={16} color="#d32f2f" />}
                <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {upload.name}
                </Typography>
                {(upload.status === 'done' || upload.status === 'error') && (
                  <IconButton size="small" onClick={() => onDismiss?.(upload.id)}>
                    <X size={14} />
                  </IconButton>
                )}
              </Box>
              {upload.status === 'uploading' && (
                <LinearProgress variant="determinate" value={upload.progress} sx={{ mt: 1, borderRadius: 1 }} />
              )}
              {upload.status === 'error' && (
                <Typography variant="caption" color="error">
                  {upload.error}
                </Typography>
              )}
            </Paper>
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
  );
};

export default DriveUploadQueue;
