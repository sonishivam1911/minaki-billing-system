import { useState, useEffect, useCallback } from 'react';
import { permissionsApi } from '../services/permissionsApi';
import { useAuth } from '../context/AuthContext';

/**
 * Custom Hook: usePermissions
 * Manages permissions data and operations
 */
export const usePermissions = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [modules, setModules] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const roles = ['admin', 'manager', 'staff'];

  /**
   * Fetch all modules
   */
  const fetchModules = useCallback(async () => {
    try {
      const data = await permissionsApi.getModules();
      setModules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch modules error:', err);
      throw err;
    }
  }, []);

  /**
   * Fetch all role permissions
   */
  const fetchPermissions = useCallback(async () => {
    // Don't fetch if not admin
    if (!isAdmin()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await permissionsApi.getAllRolePermissions();
      
      // Transform to object structure: { role: { module_key: { can_view, can_read, can_write } } }
      const permissionsObj = {};
      roles.forEach((role) => {
        permissionsObj[role] = {};
      });

      if (Array.isArray(data)) {
        data.forEach((perm) => {
          if (!permissionsObj[perm.role]) {
            permissionsObj[perm.role] = {};
          }
          permissionsObj[perm.role][perm.module_key] = {
            can_view: perm.can_view || false,
            can_read: perm.can_read || false,
            can_write: perm.can_write || false,
          };
        });
      }

      setPermissions(permissionsObj);
    } catch (err) {
      // Don't redirect on 401 if we're checking admin status
      if (err.status === 401) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError(err.message || 'Failed to load permissions');
      }
      console.error('Fetch permissions error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  /**
   * Fetch modules and permissions on mount (only if admin)
   */
  useEffect(() => {
    if (!authLoading && isAdmin()) {
      const loadData = async () => {
        try {
          await Promise.all([fetchModules(), fetchPermissions()]);
        } catch (err) {
          if (err.status !== 401) {
            setError(err.message || 'Failed to load data');
          }
        }
      };
      loadData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [fetchModules, fetchPermissions, authLoading, isAdmin]);

  /**
   * Update single permission
   */
  const updatePermission = useCallback(async (role, moduleKey, permissionData) => {
    try {
      setError(null);
      await permissionsApi.updatePermission(role, moduleKey, permissionData);
      
      // Update local state
      setPermissions((prev) => ({
        ...prev,
        [role]: {
          ...prev[role],
          [moduleKey]: permissionData,
        },
      }));
    } catch (err) {
      setError(err.message || 'Failed to update permission');
      console.error('Update permission error:', err);
      throw err;
    }
  }, []);

  /**
   * Bulk update permissions
   */
  const bulkUpdate = useCallback(async (updates) => {
    try {
      setLoading(true);
      setError(null);
      await permissionsApi.bulkUpdate(updates);
      
      // Refresh permissions
      await fetchPermissions();
    } catch (err) {
      setError(err.message || 'Failed to bulk update permissions');
      console.error('Bulk update error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPermissions]);

  /**
   * Get permission for role and module
   */
  const getPermission = useCallback((role, moduleKey) => {
    return permissions[role]?.[moduleKey] || {
      can_view: false,
      can_read: false,
      can_write: false,
    };
  }, [permissions]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    modules,
    permissions,
    roles,
    loading,
    error,
    fetchModules,
    fetchPermissions,
    updatePermission,
    bulkUpdate,
    getPermission,
    clearError,
  };
};

