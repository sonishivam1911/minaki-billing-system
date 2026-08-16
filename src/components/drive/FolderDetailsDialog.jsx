import React, { useEffect, useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { Folder } from 'lucide-react';
import { useDriveMotion } from './motionConfig';

/**
 * Folders have no S3 object to preview, so "Details" is a small centered
 * dialog rather than the file's slide-over preview panel — name (read-only,
 * use Rename for that) + an editable description.
 */
const FolderDetailsDialog = ({ folder, onClose, onSaveDescription }) => {
  const motionCfg = useDriveMotion();
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDescription(folder?.description || '');
  }, [folder]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveDescription(description.trim() || null);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {folder && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={motionCfg.tap}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 40 }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={motionCfg.modal}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(440px, calc(100vw - 32px))',
              backgroundColor: '#fff',
              borderRadius: 16,
              boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
              zIndex: 41,
              padding: 24,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Folder size={28} color="#8b6f47" strokeWidth={1.5} />
              <Typography variant="h6" sx={{ letterSpacing: '-0.02em' }}>
                {folder.name}
              </Typography>
            </Box>
            <TextField
              autoFocus
              fullWidth
              multiline
              minRows={3}
              maxRows={8}
              label="Description"
              placeholder="What's in this folder?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
              <Button onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSave} disabled={saving}>
                Save
              </Button>
            </Box>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FolderDetailsDialog;
