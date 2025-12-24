import React from 'react';
import { Shield, Lock } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import { PermissionMatrix } from '../components/PermissionMatrix';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

/**
 * PermissionManagementPage Component
 * Admin page for managing role permissions
 */
export const PermissionManagementPage = () => {
  const { isAdmin, userInfo, loading: authLoading } = useAuth();
  const {
    modules,
    permissions,
    roles,
    loading,
    error,
    updatePermission,
    bulkUpdate,
    clearError,
  } = usePermissions();

  // Wait for auth to load, then check admin status
  if (authLoading) {
    return <LoadingSpinner message="Checking permissions..." />;
  }

  // Redirect if not admin
  if (!isAdmin()) {
    return (
      <div className="screen-container">
        <ErrorMessage message={`Access denied. Admin privileges required. Your current role: ${userInfo?.role || 'not set'}`} />
      </div>
    );
  }

  if (loading && modules.length === 0) {
    return <LoadingSpinner message="Loading permissions..." />;
  }

  return (
    <div className="screen-container">
      <div className="page-header">
        <div className="page-title">
          <Lock size={32} />
          <div>
            <h1>Permission Management</h1>
            <p>Configure role-based access control for modules</p>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={clearError} />}

      <PermissionMatrix
        modules={modules}
        permissions={permissions}
        roles={roles}
        onUpdatePermission={updatePermission}
        onBulkUpdate={bulkUpdate}
        loading={loading}
        error={error}
      />
    </div>
  );
};

