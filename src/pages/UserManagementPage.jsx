import React, { useState } from 'react';
import { UserPlus, Search, Edit, Shield, Mail, User, CheckCircle, XCircle } from 'lucide-react';
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
} from '@mui/material';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import { CreateUserModal } from '../components/CreateUserModal';
import { EditUserModal } from '../components/EditUserModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

/**
 * UserManagementPage Component
 * Admin page for managing users
 */
export const UserManagementPage = () => {
  const { isAdmin, userInfo, loading: authLoading } = useAuth();
  const {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deactivateUser,
    resetPassword,
    clearError,
  } = useUsers();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Wait for auth to load, then check admin status
  if (authLoading) {
    return <LoadingSpinner message="Checking permissions..." />;
  }

  // Redirect if not admin
  if (!isAdmin()) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <ErrorMessage message={`Access denied. Admin privileges required. Your current role: ${userInfo?.role || 'not set'}`} />
      </Container>
    );
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.is_active !== false) ||
      (statusFilter === 'inactive' && user.is_active === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = async (userData) => {
    try {
      const newUser = await createUser(userData);
      // Show success message
      if (userData.sendWelcomeEmail !== false) {
        alert(`✅ User created successfully!\n\nEmail: ${newUser.email}\n\nA welcome email with login credentials has been sent to ${newUser.email}`);
      } else {
        alert(`✅ User created successfully!\n\nEmail: ${newUser.email}\n\nNote: Welcome email was not sent (checkbox was unchecked).`);
      }
    } catch (error) {
      // Error is already handled by the modal
      throw error;
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
  };

  const handleUpdateUser = async (id, userData) => {
    await updateUser(id, userData);
    setEditingUser(null);
  };

  const handleDeactivateUser = async (id) => {
    await deactivateUser(id);
    setEditingUser(null);
  };

  const handleResetPassword = async (id) => {
    await resetPassword(id);
  };

  if (loading && users.length === 0) {
    return <LoadingSpinner message="Loading users..." />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Shield size={32} color="#8b6f47" />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#2c2416' }}>
              User Management
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              Manage staff accounts and permissions
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<UserPlus size={20} />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create User
        </Button>
      </Box>

      {error && <ErrorMessage message={error} onRetry={clearError} />}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} color="#6b7280" />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            label="Role"
          >
            <MenuItem value="all">All Roles</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="staff">Staff</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    No users found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <User size={20} color="#6b7280" />
                      <Typography variant="body2">
                        {user.name || 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Mail size={16} color="#6b7280" />
                      <Typography variant="body2">
                        {user.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<Shield size={14} />}
                      label={user.role}
                      size="small"
                      sx={{
                        backgroundColor: '#f5f1e8',
                        color: '#5d4e37',
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {user.is_active !== false ? (
                      <Chip
                        icon={<CheckCircle size={14} />}
                        label="Active"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        icon={<XCircle size={14} />}
                        label="Inactive"
                        color="error"
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleEditUser(user)}
                      title="Edit user"
                      size="small"
                    >
                      <Edit size={16} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateUser}
        loading={loading}
      />

      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onUpdate={handleUpdateUser}
        onDeactivate={handleDeactivateUser}
        onResetPassword={handleResetPassword}
        loading={loading}
      />
    </Container>
  );
};
