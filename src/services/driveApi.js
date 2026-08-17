/**
 * MINAKI Drive API Service
 * Shared team drive — folders, files, presigned upload/download, trash, search.
 *
 * API Prefix: /drive/api — path-proxied in dev (vite.config.js), appended to
 * the absolute backend origin in prod (API_ORIGIN, since nginx has no path
 * proxy rules there — see apiClient.js for why).
 */

import { apiRequest, API_ORIGIN } from './apiClient';

const DRIVE_BASE_URL = API_ORIGIN ? `${API_ORIGIN}/drive/api` : '/drive/api';

const driveRequest = (method, path, data = null, options = {}) =>
  apiRequest(method, path, data, { ...options, baseUrl: DRIVE_BASE_URL });

export const driveApi = {
  getRoot: () => driveRequest('GET', '/root'),

  getFolder: (folderId) => driveRequest('GET', `/folders/${folderId}`),

  createFolder: (name, parentFolderId = null) =>
    driveRequest('POST', '/folders', { name, parent_folder_id: parentFolderId }),

  renameFolder: (folderId, name) =>
    driveRequest('PATCH', `/folders/${folderId}/rename`, { name }),

  moveFolder: (folderId, parentFolderId) =>
    driveRequest('PATCH', `/folders/${folderId}/move`, { parent_folder_id: parentFolderId }),

  updateFolderDescription: (folderId, description) =>
    driveRequest('PATCH', `/folders/${folderId}/description`, { description }),

  deleteFolder: (folderId) => driveRequest('DELETE', `/folders/${folderId}`),

  restoreFolder: (folderId) => driveRequest('POST', `/folders/${folderId}/restore`),

  createUploadIntent: ({ filename, contentType, sizeBytes, folderId = null }) =>
    driveRequest('POST', '/files/upload-intent', {
      filename,
      content_type: contentType,
      size_bytes: sizeBytes,
      folder_id: folderId,
    }),

  /**
   * Direct browser -> Contabo S3 PUT using the presigned URL. Bypasses
   * apiClient (no auth header, no /drive/api base — it's a different origin).
   */
  putToPresignedUrl: async (uploadUrl, file, headers) => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers,
      body: file,
    });
    if (!response.ok) {
      throw new Error(`Upload to storage failed: ${response.status} ${response.statusText}`);
    }
    return response;
  },

  confirmUpload: (fileId, checksumSha256 = null) =>
    driveRequest('POST', `/files/${fileId}/confirm`, { checksum_sha256: checksumSha256 }),

  getDownloadUrl: (fileId) => driveRequest('GET', `/files/${fileId}/download`),

  renameFile: (fileId, filename) => driveRequest('PATCH', `/files/${fileId}/rename`, { filename }),

  moveFile: (fileId, folderId) => driveRequest('PATCH', `/files/${fileId}/move`, { folder_id: folderId }),

  updateFileDescription: (fileId, description) =>
    driveRequest('PATCH', `/files/${fileId}/description`, { description }),

  setFilePublic: (fileId, isPublic) => driveRequest('PATCH', `/files/${fileId}/public`, { is_public: isPublic }),

  deleteFile: (fileId) => driveRequest('DELETE', `/files/${fileId}`),

  restoreFile: (fileId) => driveRequest('POST', `/files/${fileId}/restore`),

  getTrash: () => driveRequest('GET', '/trash'),

  search: (query) => driveRequest('GET', '/search', null, { params: { q: query } }),
};

export default driveApi;
