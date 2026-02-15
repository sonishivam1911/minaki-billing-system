import React, { useState } from 'react';
import { Save, Eye, FileText, Edit } from 'lucide-react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Tooltip,
  CircularProgress,
} from '@mui/material';
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
    <Box>
      {error && <ErrorMessage message={error} />}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c2416' }}>
          Role Permissions Matrix
        </Typography>
        {hasChanges && (
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} /> : <Save size={18} />}
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Module</TableCell>
              {roles.map((role) => (
                <TableCell key={role} sx={{ fontWeight: 600, textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View">
                        <Eye size={14} color="#6b7280" />
                      </Tooltip>
                      <Tooltip title="Read">
                        <FileText size={14} color="#6b7280" />
                      </Tooltip>
                      <Tooltip title="Write">
                        <Edit size={14} color="#6b7280" />
                      </Tooltip>
                    </Box>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {modules.map((module) => (
              <TableRow key={module.module_key}>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {module.module_name}
                    </Typography>
                    {module.description && (
                      <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mt: 0.5 }}>
                        {module.description}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                {roles.map((role) => (
                  <TableCell key={`${module.module_key}-${role}`} align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Tooltip title="View - See module in navigation">
                        <Checkbox
                          checked={getPermissionValue(role, module.module_key, 'can_view')}
                          onChange={() => handlePermissionChange(role, module.module_key, 'can_view')}
                          disabled={loading || saving}
                          icon={<Eye size={16} />}
                          checkedIcon={<Eye size={16} />}
                          sx={{ p: 0.5 }}
                        />
                      </Tooltip>
                      <Tooltip title="Read - View data (GET requests)">
                        <Checkbox
                          checked={getPermissionValue(role, module.module_key, 'can_read')}
                          onChange={() => handlePermissionChange(role, module.module_key, 'can_read')}
                          disabled={loading || saving || !getPermissionValue(role, module.module_key, 'can_view')}
                          icon={<FileText size={16} />}
                          checkedIcon={<FileText size={16} />}
                          sx={{ p: 0.5 }}
                        />
                      </Tooltip>
                      <Tooltip title="Write - Create/Update/Delete (POST/PUT/DELETE)">
                        <Checkbox
                          checked={getPermissionValue(role, module.module_key, 'can_write')}
                          onChange={() => handlePermissionChange(role, module.module_key, 'can_write')}
                          disabled={loading || saving || !getPermissionValue(role, module.module_key, 'can_read')}
                          icon={<Edit size={16} />}
                          checkedIcon={<Edit size={16} />}
                          sx={{ p: 0.5 }}
                        />
                      </Tooltip>
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', gap: 3, mt: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Eye size={16} color="#6b7280" />
          <Typography variant="body2" sx={{ color: '#5d4e37' }}>
            View - See module in navigation
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FileText size={16} color="#6b7280" />
          <Typography variant="body2" sx={{ color: '#5d4e37' }}>
            Read - View data (GET requests)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Edit size={16} color="#6b7280" />
          <Typography variant="body2" sx={{ color: '#5d4e37' }}>
            Write - Create/Update/Delete (POST/PUT/DELETE)
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
