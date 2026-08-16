import React, { useCallback, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { motion } from 'framer-motion';
import { Box, Typography, IconButton, Menu, MenuItem, Divider } from '@mui/material';
import { Folder, FileText, Image as ImageIcon, MoreVertical, Link as LinkIcon, Info } from 'lucide-react';
import { useDriveMotion } from './motionConfig';

export const DRIVE_ITEM_TYPE = 'DRIVE_ITEM';

const iconFor = (item) => {
  if (item.type === 'folder') return Folder;
  if ((item.content_type || '').startsWith('image/')) return ImageIcon;
  return FileText;
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
}) => {
  const motionCfg = useDriveMotion();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const Icon = iconFor(item);

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
        <Icon size={20} color="#8b6f47" />
        <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </Typography>
        {item.type === 'file' && (
          <Typography variant="caption" color="text.secondary">
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
        <ItemMenu
          item={item}
          anchor={menuAnchor}
          onClose={() => setMenuAnchor(null)}
          onRename={() => onRename?.(item)}
          onDelete={() => onDelete?.(item)}
          onCopyLink={item.type === 'file' ? () => onCopyLink?.(item) : null}
          onDetails={() => onDetails?.(item)}
        />
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
        <Icon size={40} color="#8b6f47" strokeWidth={1.5} />
        {item.description && (
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
      <ItemMenu
        item={item}
        anchor={menuAnchor}
        onClose={() => setMenuAnchor(null)}
        onRename={() => onRename?.(item)}
        onDelete={() => onDelete?.(item)}
        onCopyLink={item.type === 'file' ? () => onCopyLink?.(item) : null}
        onDetails={() => onDetails?.(item)}
      />
    </motion.div>
  );
};

const ItemMenu = ({ anchor, onClose, onRename, onDelete, onCopyLink, onDetails }) => (
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

export default DriveItem;
