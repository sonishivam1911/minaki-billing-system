import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useDrive } from '../../hooks/useDrive';
import DriveToolbar from '../../components/drive/DriveToolbar';
import DriveBreadcrumbs from '../../components/drive/DriveBreadcrumbs';
import DriveGrid from '../../components/drive/DriveGrid';
import DriveList from '../../components/drive/DriveList';
import DriveDropzone from '../../components/drive/DriveDropzone';
import DriveUploadQueue from '../../components/drive/DriveUploadQueue';
import DrivePreviewPanel from '../../components/drive/DrivePreviewPanel';
import DriveTrashView from '../../components/drive/DriveTrashView';

const FOLDER_PATH_RE = /^\/drive\/folder\/(\d+)/;

const errText = (err, fallback) => err?.response?.data?.detail || err?.message || fallback;

/**
 * Mounted once at /drive/* (App.jsx). Deliberately does NOT use nested
 * <Routes> for /drive/folder/:id — switching between sibling Route matches
 * would unmount/remount this component and drop the upload queue mid-flight.
 * Instead folder navigation updates the URL via useNavigate while staying
 * inside one persistent component instance; the pathname is parsed on change
 * to keep breadcrumb deep-links and browser back/forward working.
 */
export const DrivePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const drive = useDrive();
  const [viewMode, setViewMode] = useState('grid');
  const [previewFile, setPreviewFile] = useState(null);
  const [trashOpen, setTrashOpen] = useState(false);

  useEffect(() => {
    const match = location.pathname.match(FOLDER_PATH_RE);
    const folderId = match ? Number(match[1]) : null;
    drive.loadFolder(folderId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const openFolder = (folder) => navigate(`/drive/folder/${folder.id}`);
  const navigateBreadcrumb = (folderId) => navigate(folderId ? `/drive/folder/${folderId}` : '/drive');

  const handleNewFolder = async () => {
    const name = window.prompt('Folder name');
    if (!name || !name.trim()) return;
    try {
      await drive.createFolder(name.trim());
    } catch (err) {
      window.alert(errText(err, 'Failed to create folder'));
    }
  };

  const handleRename = async (item) => {
    const currentName = item.name || item.filename;
    const nextName = window.prompt('Rename to', currentName);
    if (!nextName || !nextName.trim() || nextName === currentName) return;
    try {
      if (item.type === 'folder') {
        await drive.renameFolder(item.id, nextName.trim());
      } else {
        await drive.renameFile(item.id, nextName.trim());
      }
    } catch (err) {
      window.alert(errText(err, 'Rename failed'));
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name || item.filename}"?`)) return;
    try {
      if (item.type === 'folder') {
        await drive.deleteFolder(item.id);
      } else {
        await drive.deleteFile(item.id);
      }
    } catch (err) {
      window.alert(errText(err, 'Delete failed'));
    }
  };

  const handleMove = async (draggedItem, targetFolderId) => {
    try {
      await drive.moveItem(draggedItem, targetFolderId);
    } catch (err) {
      window.alert(errText(err, 'Move failed'));
    }
  };

  const handleOpenTrash = async () => {
    setTrashOpen(true);
    try {
      await drive.loadTrash();
    } catch {
      /* surfaced via drive.error */
    }
  };

  const ViewComponent = viewMode === 'grid' ? DriveGrid : DriveList;
  const activeListing = drive.searchResults || drive.listing;
  const isSearching = Boolean(drive.searchResults);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <DriveToolbar
        onNewFolder={handleNewFolder}
        onUploadFiles={drive.uploadFiles}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={drive.searchQuery}
        onSearchChange={drive.search}
        onOpenTrash={handleOpenTrash}
      />

      {!isSearching && drive.listing && (
        <DriveBreadcrumbs items={drive.listing.breadcrumbs} onNavigate={navigateBreadcrumb} />
      )}

      {drive.error && (
        <Typography color="error" sx={{ px: 2, pt: 1 }}>
          {drive.error}
        </Typography>
      )}

      <DriveDropzone onFilesDropped={drive.uploadFiles}>
        {drive.loading && !activeListing ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={28} />
          </Box>
        ) : activeListing ? (
          <ViewComponent
            folders={activeListing.folders ?? activeListing.subfolders ?? []}
            files={activeListing.files ?? []}
            selectedIds={drive.selectedIds}
            onOpenFolder={openFolder}
            onPreviewFile={setPreviewFile}
            onRename={handleRename}
            onDelete={handleDelete}
            onMove={handleMove}
          />
        ) : null}
      </DriveDropzone>

      <DriveUploadQueue items={drive.uploadQueue} onDismiss={drive.dismissUpload} />
      <DrivePreviewPanel file={previewFile} onClose={() => setPreviewFile(null)} />
      <DriveTrashView
        open={trashOpen}
        trash={drive.trash}
        loading={drive.trashLoading}
        onClose={() => setTrashOpen(false)}
        onRestoreFolder={drive.restoreFolder}
        onRestoreFile={drive.restoreFile}
      />
    </Box>
  );
};

