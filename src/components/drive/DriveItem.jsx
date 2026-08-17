import React, { useCallback, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { motion } from 'framer-motion';
import { Box, Typography, IconButton, Menu, MenuItem, Divider, Chip } from '@mui/material';
import {
  Folder,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  MoreVertical,
  Link as LinkIcon,
  Info,
  Globe,
} from 'lucide-react';
import { useDriveMotion } from './motionConfig';

export const DRIVE_ITEM_TYPE = 'DRIVE_ITEM';

const EXT_MAP = {
  pdf: { Icon: FileText, color: '#c0392b', label: 'PDF' },
  doc: { Icon: FileText, color: '#2b579a', label: 'Word' },
  docx: { Icon: FileText, color: '#2b579a', label: 'Word' },
  csv: { Icon: FileSpreadsheet, color: '#1e7e45', label: 'CSV' },
  xls: { Icon: FileSpreadsheet, color: '#1e7e45', label: 'Excel' },
  xlsx: { Icon: FileSpreadsheet, color: '#1e7e45', label: 'Excel' },
  zip: { Icon: FileArchive, color: '#8b6f47', label: 'Archive' },
  rar: { Icon: FileArchive, color: '#8b6f47', label: 'Archive' },
  '7z': { Icon: FileArchive, color: '#8b6f47', label: 'Archive' },
  mp4: { Icon: FileVideo, color: '#7b3fa0', label: 'Video' },
  mov: { Icon: FileVideo, color: '#7b3fa0', label: 'Video' },
  mp3: { Icon: FileAudio, color: '#c77c1e', label: 'Audio' },
  wav: { Icon: FileAudio, color: '#c77c1e', label: 'Audio' },
  json: { Icon: FileCode, color: '#555', label: 'Code' },
  txt: { Icon: FileText, color: '#5d4e37', label: 'Text' },
};

/** Distinct icon + color per file type (Finder/Drive-style), not one generic icon for everything. */
const iconMetaFor = (item) => {
  if (item.type === 'folder') return { Icon: Folder, color: '#8b6f47', label: 'Folder' };

  const contentType = item.content_type || '';
  if (contentType.startsWith('image/')) return { Icon: ImageIcon, color: '#2e7d32', label: 'Image' };
  if (contentType.startsWith('video/')) return { Icon: FileVideo, color: '#7b3fa0', label: 'Video' };
  if (contentType.startsWith('audio/')) return { Icon: FileAudio, color: '#c77c1e', label: 'Audio' };
  if (contentType === 'application/pdf') return EXT_MAP.pdf;
  if (contentType === 'text/csv') return EXT_MAP.csv;
  if (contentType.includes('spreadsheet')) return EXT_MAP.xlsx;
  if (contentType.includes('zip') || contentType.includes('compressed')) return EXT_MAP.zip;
  if (contentType === 'application/json') return EXT_MAP.json;

  const ext = (item.filename || '').split('.').pop()?.toLowerCase();
  if (ext && EXT_MAP[ext]) return EXT_MAP[ext];

  return { Icon: FileText, color: '#8b6f47', label: 'File' };
};

export const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

export const formatDate = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * A single folder/file tile (grid) or row (list). Drag source for itself,
 * drop target for other items when it's a folder (in-app item -> folder
 * dragging via the app-wide react-dnd DndProvider — see App.jsx).
 */
const DriveItem = ({
  item,
  viewMode = 'grid',
  selected,
  onSelect,
  onOpen,
  onRename,
  onDelete,
  onMove,
  onPreview,
  onCopyLink,
  onDetails,
  onSetPublic,
}) => {
  const motionCfg = useDriveMotion();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const { Icon, color, label: typeLabel } = iconMetaFor(item);

  const [{ isDragging }, drag] = useDrag({
    type: DRIVE_ITEM_TYPE,
    item: { type: item.type, id: item.id, name: item.name || item.filename },
    canDrag: () => true,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: DRIVE_ITEM_TYPE,
    canDrop: (dragged) => item.type === 'folder' && !(dragged.type === 'folder' && dragged.id === item.id),
    drop: (dragged) => onMove?.(dragged, item.id),
    collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
  });

  const attachRef = useCallback(
    (node) => {
      drag(node);
      if (item.type === 'folder') drop(node);
    },
    [drag, drop, item.type]
  );

  const handleClick = (e) => {
    if (item.type === 'folder') {
      onOpen?.(item);
    } else {
      onPreview?.(item);
    }
    onSelect?.(item, e.metaKey || e.ctrlKey);
  };

  const label = item.name || item.filename;
  const isDropHighlight = isOver && canDrop;

  const tileStyle = {
    opacity: isDragging ? 0.4 : 1,
    outline: isDropHighlight ? '2px solid #8b6f47' : selected ? '2px solid rgba(139,111,71,0.5)' : '2px solid transparent',
    outlineOffset: 2,
    cursor: 'pointer',
  };

  const menu = (
    <ItemMenu
      item={item}
      anchor={menuAnchor}
      onClose={() => setMenuAnchor(null)}
      onRename={() => onRename?.(item)}
      onDelete={() => onDelete?.(item)}
      onCopyLink={item.type === 'file' ? () => onCopyLink?.(item) : null}
      onDetails={() => onDetails?.(item)}
      onSetPublic={item.type === 'file' ? (isPublic) => onSetPublic?.(item.id, isPublic) : null}
    />
  );

  if (viewMode === 'list') {
    return (
      <motion.div
        ref={attachRef}
        onClick={handleClick}
        whileTap={{ scale: 0.99 }}
        transition={motionCfg.tap}
        animate={{ backgroundColor: isDropHighlight ? 'rgba(139,111,71,0.08)' : 'rgba(0,0,0,0)' }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 12px',
          borderRadius: 8,
          ...tileStyle,
        }}
      >
        <Icon size={20} color={color} />
        <Typography
          variant="body2"
          onDoubleClick={(e) => {
            e.stopPropagation();
            onRename?.(item);
          }}
          sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {label}
        </Typography>
        {item.is_public && <Chip icon={<Globe size={12} />} label="Public" size="small" sx={{ height: 20 }} />}
        {item.type === 'file' && (
          <Typography variant="caption" color="text.secondary" sx={{ width: 60, textAlign: 'right' }}>
            {typeLabel}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ width: 90, textAlign: 'right' }}>
          {formatDate(item.created_at)}
        </Typography>
        {item.type === 'file' && (
          <Typography variant="caption" color="text.secondary" sx={{ width: 60, textAlign: 'right' }}>
            {formatBytes(item.size_bytes)}
          </Typography>
        )}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setMenuAnchor(e.currentTarget);
          }}
        >
          <MoreVertical size={16} />
        </IconButton>
        {menu}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={attachRef}
      onClick={handleClick}
      whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(139,111,71,0.16)' }}
      whileTap={{ scale: 0.98 }}
      transition={motionCfg.micro}
      animate={{ backgroundColor: isDropHighlight ? 'rgba(139,111,71,0.1)' : 'rgba(250,248,243,1)' }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 16,
        width: 140,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        ...tileStyle,
      }}
    >
      <Box sx={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Icon size={40} color={color} strokeWidth={1.5} />
        {item.is_public && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -2,
              left: '50%',
              transform: 'translateX(6px)',
              backgroundColor: '#fff',
              borderRadius: '50%',
              display: 'flex',
              p: '2px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }}
          >
            <Globe size={11} color="#2e7d32" />
          </Box>
        )}
        {item.description && !item.is_public && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -2,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 5,
              height: 5,
              borderRadius: '50%',
              backgroundColor: '#8b6f47',
            }}
          />
        )}
        <IconButton
          size="small"
          sx={{ position: 'absolute', top: -8, right: -8 }}
          onClick={(e) => {
            e.stopPropagation();
            setMenuAnchor(e.currentTarget);
          }}
        >
          <MoreVertical size={14} />
        </IconButton>
      </Box>
      <Typography
        variant="body2"
        align="center"
        sx={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {label}
      </Typography>
      {menu}
    </motion.div>
  );
};

const ItemMenu = ({ anchor, onClose, onRename, onDelete, onCopyLink, onDetails, onSetPublic, item }) => (
  <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={onClose} onClick={(e) => e.stopPropagation()}>
    <MenuItem
      onClick={() => {
        onDetails();
        onClose();
      }}
    >
      <Info size={16} style={{ marginRight: 10 }} />
      Details
    </MenuItem>
    {onCopyLink && (
      <MenuItem
        onClick={() => {
          onCopyLink();
          onClose();
        }}
      >
        <LinkIcon size={16} style={{ marginRight: 10 }} />
        Copy Link
      </MenuItem>
    )}
    {onSetPublic && (
      <MenuItem
        onClick={() => {
          onSetPublic(!item?.is_public);
          onClose();
        }}
      >
        <Globe size={16} style={{ marginRight: 10 }} />
        {item?.is_public ? 'Revoke Public Link' : 'Make Public'}
      </MenuItem>
    )}
    <MenuItem
      onClick={() => {
        onRename();
        onClose();
      }}
    >
      Rename
    </MenuItem>
    <Divider />
    <MenuItem
      onClick={() => {
        onDelete();
        onClose();
      }}
      sx={{ color: 'error.main' }}
    >
      Delete
    </MenuItem>
  </Menu>
);

export default DriveItem;
