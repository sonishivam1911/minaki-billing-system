import React, { useRef } from 'react';
import { Box, Button, IconButton, Tooltip } from '@mui/material';
import { FolderPlus, Upload, LayoutGrid, List as ListIcon, Trash2 } from 'lucide-react';
import DriveSearchBar from './DriveSearchBar';

/**
 * Sticky translucent header — content scrolls underneath, per the Apple
 * "Materials & Depth" spec: backdrop-filter blur + saturate, not an opaque bar.
 * prefers-reduced-transparency falls back to a solid background.
 */
const DriveToolbar = ({
  onNewFolder,
  onUploadFiles,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  onOpenTrash,
}) => {
  const fileInputRef = useRef(null);

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        backdropFilter: 'blur(20px) saturate(180%)',
        backgroundColor: 'rgba(255,255,255,0.72)',
        borderBottom: '1px solid rgba(139,111,71,0.15)',
        '@media (prefers-reduced-transparency: reduce)': {
          backdropFilter: 'none',
          backgroundColor: 'rgba(255,255,255,0.97)',
        },
      }}
    >
      <Button startIcon={<FolderPlus size={18} />} onClick={onNewFolder} size="small">
        New Folder
      </Button>
      <Button startIcon={<Upload size={18} />} onClick={() => fileInputRef.current?.click()} size="small" variant="contained">
        Upload
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onUploadFiles?.(e.target.files);
          e.target.value = '';
        }}
      />

      <Box sx={{ flex: 1 }} />

      <DriveSearchBar value={searchQuery} onChange={onSearchChange} />

      <Tooltip title="Grid view">
        <IconButton
          size="small"
          onClick={() => onViewModeChange?.('grid')}
          color={viewMode === 'grid' ? 'primary' : 'default'}
        >
          <LayoutGrid size={18} />
        </IconButton>
      </Tooltip>
      <Tooltip title="List view">
        <IconButton
          size="small"
          onClick={() => onViewModeChange?.('list')}
          color={viewMode === 'list' ? 'primary' : 'default'}
        >
          <ListIcon size={18} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Trash">
        <IconButton size="small" onClick={onOpenTrash}>
          <Trash2 size={18} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default DriveToolbar;
