import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useDriveMotion } from './motionConfig';

/**
 * Replaces window.confirm() for Delete — see NamePromptDialog for why
 * native dialogs don't work reliably here.
 */
const ConfirmDialog = ({ open, title, message, confirmLabel = 'Delete', onConfirm, onClose }) => {
  const motionCfg = useDriveMotion();
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
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
            <Typography variant="h6" sx={{ letterSpacing: '-0.02em', mb: 1 }}>
              {title}
            </Typography>
            <Typography color="text.secondary">{message}</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
              <Button onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="contained" color="error" onClick={handleConfirm} disabled={submitting}>
                {confirmLabel}
              </Button>
            </Box>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
