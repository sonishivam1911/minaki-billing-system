import { apiRequest } from './apiClient';

/**
 * Permissions API Service
 * Handles all permission management operations
 */
export const permissionsApi = {
  /**
   * Get all modules
   * GET /auth/modules
   */
  getModules: async () => {
    try {
      const data = await apiRequest('GET', '/auth/modules');
      return data.modules || data;
    } catch (error) {
      console.error('Permissions API - Get modules error:', error);
      throw error;
    }
  },

  /**
   * Get all role permissions
   * GET /auth/permissions/all
   */
  getAllRolePermissions: async () => {
    try {
      const data = await apiRequest('GET', '/auth/permissions/all');
      return data.permissions || data;
    } catch (error) {
      console.error('Permissions API - Get all role permissions error:', error);
      throw error;
    }
  },

  /**
   * Get permissions for a specific role
   * GET /auth/permissions/{role}
   */
  getRolePermissions: async (role) => {
    try {
      const data = await apiRequest('GET', `/auth/permissions/${role}`);
      return data.permissions || data;
    } catch (error) {
      console.error('Permissions API - Get role permissions error:', error);
      throw error;
    }
  },

  /**
   * Update single permission
   * PUT /auth/permissions/{role}/{module_key}
   */
  updatePermission: async (role, moduleKey, permissionData) => {
    try {
      const data = await apiRequest('PUT', `/auth/permissions/${role}/${moduleKey}`, {
        can_view: permissionData.can_view,
        can_read: permissionData.can_read,
        can_write: permissionData.can_write
      });
      return data.permission || data;
    } catch (error) {
      console.error('Permissions API - Update permission error:', error);
      throw error;
    }
  },

  /**
   * Bulk update permissions
   * POST /auth/permissions/bulk
   */
  bulkUpdate: async (updates) => {
    try {
      const data = await apiRequest('POST', '/auth/permissions/bulk', {
        updates: updates
      });
      return data;
    } catch (error) {
      console.error('Permissions API - Bulk update error:', error);
      throw error;
    }
  },
};

