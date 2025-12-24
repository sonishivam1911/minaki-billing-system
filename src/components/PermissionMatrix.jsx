import React, { useState } from 'react';
import { Save, Eye, FileText, Edit } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

/**
 * PermissionMatrix Component
 * Visual grid for managing role permissions
 */
export const PermissionMatrix = ({ modules, permissions, roles, onUpdatePermission, onBulkUpdate, loading, error }) => {
  const [localPermissions, setLocalPermissions] = useState(permissions);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Update local state when permissions prop changes
  React.useEffect(() => {
    setLocalPermissions(permissions);
    setHasChanges(false);
  }, [permissions]);

  const handlePermissionChange = (role, moduleKey, permissionType) => {
    setLocalPermissions((prev) => {
      const newPerms = { ...prev };
      if (!newPerms[role]) newPerms[role] = {};
      if (!newPerms[role][moduleKey]) {
        newPerms[role][moduleKey] = {
          can_view: false,
          can_read: false,
          can_write: false,
        };
      }
      
      const newValue = !newPerms[role][moduleKey][permissionType];
      newPerms[role][moduleKey][permissionType] = newValue;
      
      // Auto-set can_read if can_write is true
      if (permissionType === 'can_write' && newValue) {
        newPerms[role][moduleKey].can_read = true;
      }
      // Auto-set can_view if can_read is true
      if (permissionType === 'can_read' && newValue) {
        newPerms[role][moduleKey].can_view = true;
      }
      // Auto-unset can_write if can_read is false
      if (permissionType === 'can_read' && !newValue) {
        newPerms[role][moduleKey].can_write = false;
      }
      // Auto-unset can_read if can_view is false
      if (permissionType === 'can_view' && !newValue) {
        newPerms[role][moduleKey].can_read = false;
        newPerms[role][moduleKey].can_write = false;
      }
      
      return newPerms;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Build bulk update array
      const updates = [];
      roles.forEach((role) => {
        modules.forEach((module) => {
          const currentPerm = localPermissions[role]?.[module.module_key] || {
            can_view: false,
            can_read: false,
            can_write: false,
          };
          
          const originalPerm = permissions[role]?.[module.module_key] || {
            can_view: false,
            can_read: false,
            can_write: false,
          };

          // Only include if changed
          if (
            currentPerm.can_view !== originalPerm.can_view ||
            currentPerm.can_read !== originalPerm.can_read ||
            currentPerm.can_write !== originalPerm.can_write
          ) {
            updates.push({
              role,
              module_key: module.module_key,
              can_view: currentPerm.can_view,
              can_read: currentPerm.can_read,
              can_write: currentPerm.can_write,
            });
          }
        });
      });

      if (updates.length > 0) {
        await onBulkUpdate(updates);
        setHasChanges(false);
      }
    } catch (err) {
      console.error('Save permissions error:', err);
    } finally {
      setSaving(false);
    }
  };

  const getPermissionValue = (role, moduleKey, permissionType) => {
    return localPermissions[role]?.[moduleKey]?.[permissionType] || false;
  };

  return (
    <div className="permission-matrix-container">
      {error && <ErrorMessage message={error} />}

      <div className="permission-matrix-header">
        <h3>Role Permissions Matrix</h3>
        {hasChanges && (
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || loading}
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      <div className="permission-matrix-table-wrapper">
        <table className="permission-matrix-table">
          <thead>
            <tr>
              <th className="module-column">Module</th>
              {roles.map((role) => (
                <th key={role} className="role-column">
                  <div className="role-header">
                    <span className="role-name">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                    <div className="permission-labels">
                      <span title="View"><Eye size={14} /></span>
                      <span title="Read"><FileText size={14} /></span>
                      <span title="Write"><Edit size={14} /></span>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((module) => (
              <tr key={module.module_key}>
                <td className="module-name">
                  <strong>{module.module_name}</strong>
                  {module.description && (
                    <small>{module.description}</small>
                  )}
                </td>
                {roles.map((role) => (
                  <td key={`${module.module_key}-${role}`} className="permission-cell">
                    <div className="permission-checkboxes">
                      <label className="permission-checkbox">
                        <input
                          type="checkbox"
                          checked={getPermissionValue(role, module.module_key, 'can_view')}
                          onChange={() => handlePermissionChange(role, module.module_key, 'can_view')}
                          disabled={loading || saving}
                        />
                        <Eye size={16} />
                      </label>
                      <label className="permission-checkbox">
                        <input
                          type="checkbox"
                          checked={getPermissionValue(role, module.module_key, 'can_read')}
                          onChange={() => handlePermissionChange(role, module.module_key, 'can_read')}
                          disabled={loading || saving || !getPermissionValue(role, module.module_key, 'can_view')}
                        />
                        <FileText size={16} />
                      </label>
                      <label className="permission-checkbox">
                        <input
                          type="checkbox"
                          checked={getPermissionValue(role, module.module_key, 'can_write')}
                          onChange={() => handlePermissionChange(role, module.module_key, 'can_write')}
                          disabled={loading || saving || !getPermissionValue(role, module.module_key, 'can_read')}
                        />
                        <Edit size={16} />
                      </label>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="permission-legend">
        <div className="legend-item">
          <Eye size={16} />
          <span>View - See module in navigation</span>
        </div>
        <div className="legend-item">
          <FileText size={16} />
          <span>Read - View data (GET requests)</span>
        </div>
        <div className="legend-item">
          <Edit size={16} />
          <span>Write - Create/Update/Delete (POST/PUT/DELETE)</span>
        </div>
      </div>
    </div>
  );
};

