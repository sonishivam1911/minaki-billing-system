import React, { useEffect, useState } from 'react';
import { Box, IconButton, Typography, CircularProgress, Button, TextField, Switch, FormControlLabel } from '@mui/material';
import { X, Download, FileText, Check, Globe, Copy } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDriveMotion } from './motionConfig';
import { driveApi } from '../../services/driveApi';
import { formatBytes, formatDate } from './DriveItem';

/**
 * Slide-over sheet, response 0.3s / damping 0.8 spring per the Apple-design
 * spec ("Sheet/panel" family in motionConfig.js). Filename heading uses tight
 * negative letter-spacing (large-text typography rule); list/grid names elsewhere
 * keep normal body typography.
 */
const DrivePreviewPanel = ({ file, onClose, onSaveDescription, onSetPublic }) => {
  const motionCfg = useDriveMotion();
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [description, setDescription] = useState('');
  const [savingDescription, setSavingDescription] = useState(false);
  const [descriptionDirty, setDescriptionDirty] = useState(false);
  const [togglingPublic, setTogglingPublic] = useState(false);

  useEffect(() => {
    if (!file) {
      setDownloadUrl(null);
      return;
    }
    setDescription(file.description || '');
    setDescriptionDirty(false);
    let cancelled = false;
    setLoading(true);
    setError(null);
    driveApi
      .getDownloadUrl(file.id)
      .then((res) => {
        if (!cancelled) setDownloadUrl(res.download_url);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.detail || err.message || 'Failed to load preview');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const handleSaveDescription = async () => {
    setSavingDescription(true);
    try {
      await onSaveDescription?.(file.id, description.trim() || null);
      setDescriptionDirty(false);
    } finally {
      setSavingDescription(false);
    }
  };

  const handleTogglePublic = async (e) => {
    setTogglingPublic(true);
    try {
      await onSetPublic?.(file.id, e.target.checked);
    } finally {
      setTogglingPublic(false);
    }
  };

  const isImage = (file?.content_type || '').startsWith('image/');
  const isPdf = file?.content_type === 'application/pdf';

  return (
    <AnimatePresence>
      {file && (
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
              width: 'min(480px, 100vw)',
              backgroundColor: '#fff',
              zIndex: 31,
              boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 2, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{ letterSpacing: '-0.02em', lineHeight: 1.05, wordBreak: 'break-word' }}
                >
                  {file.filename}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatBytes(file.size_bytes)} · {file.content_type || 'Unknown type'} · Uploaded {formatDate(file.created_at)}
                  {file.created_by_email ? ` by ${file.created_by_email}` : ''}
                </Typography>
              </Box>
              <IconButton size="small" onClick={onClose}>
                <X size={18} />
              </IconButton>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
              {loading && <CircularProgress size={28} />}
              {error && <Typography color="error">{error}</Typography>}
              {!loading && !error && downloadUrl && isImage && (
                <Box component="img" src={downloadUrl} alt={file.filename} sx={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 1 }} />
              )}
              {!loading && !error && downloadUrl && isPdf && (
                <Box component="iframe" src={downloadUrl} title={file.filename} sx={{ width: '100%', height: '100%', border: 'none' }} />
              )}
              {!loading && !error && downloadUrl && !isImage && !isPdf && (
                <Box sx={{ textAlign: 'center' }}>
                  <FileText size={48} color="#8b6f47" strokeWidth={1.5} />
                  <Typography sx={{ mt: 1 }} color="text.secondary">
                    No inline preview for this file type
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={5}
                size="small"
                label="Description"
                placeholder="Add a description…"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setDescriptionDirty(true);
                }}
              />
              {descriptionDirty && (
                <Button
                  size="small"
                  startIcon={<Check size={14} />}
                  onClick={handleSaveDescription}
                  disabled={savingDescription}
                  sx={{ mt: 0.5 }}
                >
                  Save description
                </Button>
              )}
            </Box>

            <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              <FormControlLabel
                control={<Switch checked={Boolean(file.is_public)} onChange={handleTogglePublic} disabled={togglingPublic} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Globe size={14} />
                    <Typography variant="body2">Public permanent link</Typography>
                  </Box>
                }
              />
              {file.is_public && file.public_url && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={file.public_url}
                    InputProps={{ readOnly: true }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => navigator.clipboard.writeText(file.public_url)}
                    title="Copy link"
                  >
                    <Copy size={16} />
                  </IconButton>
                </Box>
              )}
              {file.is_public && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Anyone with this link can view the file — no login required. Turn off to revoke.
                </Typography>
              )}
            </Box>

            {downloadUrl && (
              <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Download size={16} />}
                  component="a"
                  href={downloadUrl}
                  download={file.filename}
                >
                  Download
                </Button>
              </Box>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DrivePreviewPanel;
