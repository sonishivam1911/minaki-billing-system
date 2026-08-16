import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Snackbar, Alert } from '@mui/material';
import { useDrive } from '../../hooks/useDrive';
import DriveToolbar from '../../components/drive/DriveToolbar';
import DriveBreadcrumbs from '../../components/drive/DriveBreadcrumbs';
import DriveGrid from '../../components/drive/DriveGrid';
import DriveList from '../../components/drive/DriveList';
import DriveDropzone from '../../components/drive/DriveDropzone';
import DriveUploadQueue from '../../components/drive/DriveUploadQueue';
import DrivePreviewPanel from '../../components/drive/DrivePreviewPanel';
import DriveTrashView from '../../components/drive/DriveTrashView';
import NamePromptDialog from '../../components/drive/NamePromptDialog';
import ConfirmDialog from '../../components/drive/ConfirmDialog';
import FolderDetailsDialog from '../../components/drive/FolderDetailsDialog';
import { driveApi } from '../../services/driveApi';

const FOLDER_PATH_RE = /^\/drive\/folder\/(\d+)/;

const errText = (err, fallback) => err?.response?.data?.detail || err?.message || fallback;

/**
 * Mounted once at /drive/* (App.jsx). Deliberately does NOT use nested
 * <Routes> for /drive/folder/:id — switching between sibling Route matches
 * would unmount/remount this component and drop the upload queue mid-flight.
 * Instead folder navigation updates the URL via useNavigate while staying
 * inside one persistent component instance; the pathname is parsed on change
 * to keep breadcrumb deep-links and browser back/forward working.
 *
 * Folder create/rename/delete go through in-DOM MUI dialogs (NamePromptDialog/
 * ConfirmDialog), not window.prompt()/confirm() — native dialogs are
 * unsupported in some embedded webview contexts this app runs in, which is
 * why "New Folder" previously did nothing at all.
 */
export const DrivePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const drive = useDrive();
  const [viewMode, setViewMode] = useState('grid');
  const [previewFile, setPreviewFile] = useState(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailsFolder, setDetailsFolder] = useState(null);
  const [toast, setToast] = useState(null); // { severity, message }

  useEffect(() => {
    const match = location.pathname.match(FOLDER_PATH_RE);
    const folderId = match ? Number(match[1]) : null;
    drive.loadFolder(folderId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Mirror hook-level errors (load/trash/search failures) into the toast —
  // drive.error itself is never cleared by the hook, so the Snackbar's open
  // state is driven solely by local `toast`, not by drive.error directly.
  useEffect(() => {
    if (drive.error) setToast({ severity: 'error', message: drive.error });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drive.error]);

  const openFolder = (folder) => navigate(`/drive/folder/${folder.id}`);
  const navigateBreadcrumb = (folderId) => navigate(folderId ? `/drive/folder/${folderId}` : '/drive');

  const handleCreateFolder = async (name) => {
    try {
      await drive.createFolder(name);
    } catch (err) {
      setToast({ severity: 'error', message: errText(err, 'Failed to create folder') });
      throw err;
    }
  };

  const handleRenameSubmit = async (nextName) => {
    const item = renameTarget;
    try {
      if (item.type === 'folder') {
        await drive.renameFolder(item.id, nextName);
      } else {
        await drive.renameFile(item.id, nextName);
      }
    } catch (err) {
      setToast({ severity: 'error', message: errText(err, 'Rename failed') });
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    const item = deleteTarget;
    try {
      if (item.type === 'folder') {
        await drive.deleteFolder(item.id);
      } else {
        await drive.deleteFile(item.id);
      }
    } catch (err) {
      setToast({ severity: 'error', message: errText(err, 'Delete failed') });
      throw err;
    }
  };

  const handleMove = async (draggedItem, targetFolderId) => {
    try {
      await drive.moveItem(draggedItem, targetFolderId);
    } catch (err) {
      setToast({ severity: 'error', message: errText(err, 'Move failed') });
    }
  };

  const handleCopyLink = async (file) => {
    try {
      const { download_url: url } = await driveApi.getDownloadUrl(file.id);
      await navigator.clipboard.writeText(url);
      setToast({ severity: 'success', message: 'Link copied — valid for a limited time' });
    } catch (err) {
      setToast({ severity: 'error', message: errText(err, 'Failed to copy link') });
    }
  };

  const handleDetails = (item) => {
    if (item.type === 'folder') {
      setDetailsFolder(item);
    } else {
      setPreviewFile(item);
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
        onNewFolder={() => setNewFolderOpen(true)}
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
            onRename={setRenameTarget}
            onDelete={setDeleteTarget}
            onMove={handleMove}
            onCopyLink={handleCopyLink}
            onDetails={handleDetails}
          />
        ) : null}
      </DriveDropzone>

      <DriveUploadQueue items={drive.uploadQueue} onDismiss={drive.dismissUpload} />

      <DrivePreviewPanel
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onSaveDescription={async (fileId, description) => {
          try {
            await drive.updateFileDescription(fileId, description);
          } catch (err) {
            setToast({ severity: 'error', message: errText(err, 'Failed to save description') });
            throw err;
          }
        }}
      />

      <FolderDetailsDialog
        folder={detailsFolder}
        onClose={() => setDetailsFolder(null)}
        onSaveDescription={async (description) => {
          try {
            await drive.updateFolderDescription(detailsFolder.id, description);
          } catch (err) {
            setToast({ severity: 'error', message: errText(err, 'Failed to save description') });
            throw err;
          }
        }}
      />

      <DriveTrashView
        open={trashOpen}
        trash={drive.trash}
        loading={drive.trashLoading}
        onClose={() => setTrashOpen(false)}
        onRestoreFolder={drive.restoreFolder}
        onRestoreFile={drive.restoreFile}
      />

      <NamePromptDialog
        open={newFolderOpen}
        title="New Folder"
        label="Folder name"
        confirmLabel="Create"
        onConfirm={handleCreateFolder}
        onClose={() => setNewFolderOpen(false)}
      />

      <NamePromptDialog
        open={Boolean(renameTarget)}
        title="Rename"
        label={renameTarget?.type === 'folder' ? 'Folder name' : 'File name'}
        initialValue={renameTarget?.name || renameTarget?.filename || ''}
        confirmLabel="Rename"
        onConfirm={handleRenameSubmit}
        onClose={() => setRenameTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete"
        message={`Delete "${deleteTarget?.name || deleteTarget?.filename}"? You can restore it from Trash.`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert severity={toast?.severity || 'error'} onClose={() => setToast(null)} variant="filled">
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
