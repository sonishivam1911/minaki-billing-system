import React from 'react';
import { Box, IconButton, Typography, CircularProgress, Button, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { X, Folder, FileText, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDriveMotion } from './motionConfig';

const DriveTrashView = ({ open, trash, loading, onClose, onRestoreFolder, onRestoreFile }) => {
  const motionCfg = useDriveMotion();
  const folders = trash?.folders || [];
  const files = trash?.files || [];
  const isEmpty = !loading && folders.length === 0 && files.length === 0;

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
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 30 }}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={motionCfg.sheet}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(420px, 100vw)',
              backgroundColor: '#fff',
              zIndex: 31,
              boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <Typography variant="h6" sx={{ flex: 1, letterSpacing: '-0.02em' }}>
                Trash
              </Typography>
              <IconButton size="small" onClick={onClose}>
                <X size={18} />
              </IconButton>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              {isEmpty && (
                <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
                  Trash is empty
                </Typography>
              )}
              <List>
                {folders.map((folder) => (
                  <ListItem
                    key={`folder-${folder.id}`}
                    secondaryAction={
                      <Button size="small" startIcon={<RotateCcw size={14} />} onClick={() => onRestoreFolder?.(folder.id)}>
                        Restore
                      </Button>
                    }
                  >
                    <ListItemIcon>
                      <Folder size={20} color="#8b6f47" />
                    </ListItemIcon>
                    <ListItemText primary={folder.name} />
                  </ListItem>
                ))}
                {files.map((file) => (
                  <ListItem
                    key={`file-${file.id}`}
                    secondaryAction={
                      <Button size="small" startIcon={<RotateCcw size={14} />} onClick={() => onRestoreFile?.(file.id)}>
                        Restore
                      </Button>
                    }
                  >
                    <ListItemIcon>
                      <FileText size={20} color="#8b6f47" />
                    </ListItemIcon>
                    <ListItemText primary={file.filename} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DriveTrashView;
