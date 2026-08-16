/**
 * React Hook for MINAKI Drive
 *
 * Owns: current folder listing, breadcrumbs, selection, the presigned-upload
 * queue (with real progress via XHR), trash, and search. Pattern follows
 * useLocations.js / useCart.js — plain hook holds state+logic, a thin
 * Context (none needed here, DrivePage is the sole consumer) would wrap it
 * if Drive state needed to be shared across unrelated routes.
 */

import { useCallback, useRef, useState } from 'react';
import { driveApi } from '../services/driveApi';

let _uploadIdSeq = 0;

export const useDrive = () => {
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [listing, setListing] = useState(null); // { folder, breadcrumbs, subfolders, files }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [uploadQueue, setUploadQueue] = useState([]); // [{ id, name, progress, status, error }]

  const [trash, setTrash] = useState(null); // { folders, files }
  const [trashLoading, setTrashLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null); // { folders, files }
  const [searching, setSearching] = useState(false);

  const errorMessage = (err, fallback) => err.response?.data?.detail || err.message || fallback;

  const loadFolder = useCallback(async (folderId = null) => {
    setLoading(true);
    setError(null);
    try {
      const data = folderId ? await driveApi.getFolder(folderId) : await driveApi.getRoot();
      setListing(data);
      setCurrentFolderId(folderId);
      setSelectedIds(new Set());
      return data;
    } catch (err) {
      setError(errorMessage(err, 'Failed to load folder'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => loadFolder(currentFolderId), [loadFolder, currentFolderId]);

  const createFolder = useCallback(
    async (name) => {
      await driveApi.createFolder(name, currentFolderId);
      await refresh();
    },
    [currentFolderId, refresh]
  );

  const renameFolder = useCallback(
    async (folderId, name) => {
      await driveApi.renameFolder(folderId, name);
      await refresh();
    },
    [refresh]
  );

  const renameFile = useCallback(
    async (fileId, filename) => {
      await driveApi.renameFile(fileId, filename);
      await refresh();
    },
    [refresh]
  );

  const updateFolderDescription = useCallback(
    async (folderId, description) => {
      await driveApi.updateFolderDescription(folderId, description);
      await refresh();
    },
    [refresh]
  );

  const updateFileDescription = useCallback(
    async (fileId, description) => {
      await driveApi.updateFileDescription(fileId, description);
      await refresh();
    },
    [refresh]
  );

  const moveItem = useCallback(
    async (item, targetFolderId) => {
      if (item.type === 'folder') {
        await driveApi.moveFolder(item.id, targetFolderId);
      } else {
        await driveApi.moveFile(item.id, targetFolderId);
      }
      await refresh();
    },
    [refresh]
  );

  const deleteFolder = useCallback(
    async (folderId) => {
      await driveApi.deleteFolder(folderId);
      await refresh();
    },
    [refresh]
  );

  const deleteFile = useCallback(
    async (fileId) => {
      await driveApi.deleteFile(fileId);
      await refresh();
    },
    [refresh]
  );

  const toggleSelection = useCallback((key, additive = false) => {
    setSelectedIds((prev) => {
      const next = additive ? new Set(prev) : new Set();
      if (prev.has(key) && additive) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // --- Upload queue (presigned PUT direct to Contabo S3, XHR for progress) ---

  const uploadFile = useCallback(
    (file, folderId = currentFolderId) => {
      const queueId = `${Date.now()}-${_uploadIdSeq++}`;
      setUploadQueue((prev) => [...prev, { id: queueId, name: file.name, progress: 0, status: 'uploading', error: null }]);

      (async () => {
        try {
          const intent = await driveApi.createUploadIntent({
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
            folderId,
          });

          await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', intent.upload_url, true);
            Object.entries(intent.upload_headers || {}).forEach(([key, value]) => xhr.setRequestHeader(key, value));
            xhr.upload.onprogress = (evt) => {
              if (!evt.lengthComputable) return;
              const progress = Math.round((evt.loaded / evt.total) * 100);
              setUploadQueue((prev) => prev.map((u) => (u.id === queueId ? { ...u, progress } : u)));
            };
            xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
            xhr.onerror = () => reject(new Error('Upload failed: network error'));
            xhr.send(file);
          });

          await driveApi.confirmUpload(intent.file_id);
          setUploadQueue((prev) => prev.map((u) => (u.id === queueId ? { ...u, progress: 100, status: 'done' } : u)));
          if (folderId === currentFolderId) {
            await refresh();
          }
        } catch (err) {
          setUploadQueue((prev) =>
            prev.map((u) => (u.id === queueId ? { ...u, status: 'error', error: errorMessage(err, 'Upload failed') } : u))
          );
        }
      })();

      return queueId;
    },
    [currentFolderId, refresh]
  );

  const uploadFiles = useCallback(
    (fileList) => Array.from(fileList).forEach((file) => uploadFile(file)),
    [uploadFile]
  );

  const dismissUpload = useCallback((queueId) => {
    setUploadQueue((prev) => prev.filter((u) => u.id !== queueId));
  }, []);

  // --- Trash ---

  const loadTrash = useCallback(async () => {
    setTrashLoading(true);
    try {
      const data = await driveApi.getTrash();
      setTrash(data);
      return data;
    } catch (err) {
      setError(errorMessage(err, 'Failed to load trash'));
      throw err;
    } finally {
      setTrashLoading(false);
    }
  }, []);

  const restoreFolder = useCallback(
    async (folderId) => {
      await driveApi.restoreFolder(folderId);
      await loadTrash();
    },
    [loadTrash]
  );

  const restoreFile = useCallback(
    async (fileId) => {
      await driveApi.restoreFile(fileId);
      await loadTrash();
    },
    [loadTrash]
  );

  // --- Search ---

  const searchDebounceRef = useRef(null);

  const search = useCallback((query) => {
    setSearchQuery(query);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!query || !query.trim()) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const data = await driveApi.search(query.trim());
        setSearchResults(data);
      } catch (err) {
        setError(errorMessage(err, 'Search failed'));
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  return {
    currentFolderId,
    listing,
    loading,
    error,
    loadFolder,
    refresh,
    createFolder,
    renameFolder,
    renameFile,
    updateFolderDescription,
    updateFileDescription,
    moveItem,
    deleteFolder,
    deleteFile,
    selectedIds,
    toggleSelection,
    clearSelection,
    uploadQueue,
    uploadFile,
    uploadFiles,
    dismissUpload,
    trash,
    trashLoading,
    loadTrash,
    restoreFolder,
    restoreFile,
    searchQuery,
    searchResults,
    searching,
    search,
  };
};

export default useDrive;
