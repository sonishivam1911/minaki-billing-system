import React, { useEffect, useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useDriveMotion } from './motionConfig';

/**
 * Replaces window.prompt() for "New Folder" / "Rename" — native prompt()
 * dialogs are blocked/unsupported in some embedded webview contexts (e.g.
 * this app running inside certain in-app browsers), which is why "New
 * Folder" silently did nothing. This is a real in-DOM MUI dialog instead.
 */
const NamePromptDialog = ({ open, title, label, initialValue = '', confirmLabel = 'Save', onConfirm, onClose }) => {
  const motionCfg = useDriveMotion();
  const [value, setValue] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  const canSubmit = value.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onConfirm(value.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
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
              width: 'min(420px, calc(100vw - 32px))',
              backgroundColor: '#fff',
              borderRadius: 16,
              boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
              zIndex: 41,
              padding: 24,
            }}
          >
            <Typography variant="h6" sx={{ letterSpacing: '-0.02em', mb: 2 }}>
              {title}
            </Typography>
            <TextField
              autoFocus
              fullWidth
              label={label}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
              <Button onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit}>
                {confirmLabel}
              </Button>
            </Box>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NamePromptDialog;
