import React from 'react';
import { Box, Typography } from '@mui/material';
import DriveItem from './DriveItem';

const DriveGrid = ({
  folders = [],
  files = [],
  selectedIds,
  onSelect,
  onOpenFolder,
  onPreviewFile,
  onRename,
  onDelete,
  onMove,
  onCopyLink,
  onDetails,
}) => {
  if (folders.length === 0 && files.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography color="text.secondary">This folder is empty</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, p: 2 }}>
      {folders.map((folder) => (
        <DriveItem
          key={`folder-${folder.id}`}
          item={{ ...folder, type: 'folder' }}
          viewMode="grid"
          selected={selectedIds?.has(`folder-${folder.id}`)}
          onSelect={onSelect}
          onOpen={onOpenFolder}
          onRename={onRename}
          onDelete={onDelete}
          onMove={onMove}
          onDetails={onDetails}
        />
      ))}
      {files.map((file) => (
        <DriveItem
          key={`file-${file.id}`}
          item={{ ...file, type: 'file' }}
          viewMode="grid"
          selected={selectedIds?.has(`file-${file.id}`)}
          onSelect={onSelect}
          onPreview={onPreviewFile}
          onRename={onRename}
          onDelete={onDelete}
          onMove={onMove}
          onCopyLink={onCopyLink}
          onDetails={onDetails}
        />
      ))}
    </Box>
  );
};

export default DriveGrid;
