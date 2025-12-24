import React, { useState } from 'react';
import { UserPlus, Search, Edit, Shield, Mail, User, CheckCircle, XCircle } from 'lucide-react';
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
      <div className="screen-container">
        <ErrorMessage message={`Access denied. Admin privileges required. Your current role: ${userInfo?.role || 'not set'}`} />
      </div>
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
    <div className="screen-container">
      <div className="page-header">
        <div className="page-title">
          <Shield size={32} />
          <div>
            <h1>User Management</h1>
            <p>Manage staff accounts and permissions</p>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <UserPlus size={20} />
          Create User
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={clearError} />}

      <div className="filters-bar">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="users-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      <User size={20} />
                      <span>{user.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="email-info">
                      <Mail size={16} />
                      <span>{user.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      <Shield size={14} />
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {user.is_active !== false ? (
                      <span className="status-badge status-active">
                        <CheckCircle size={14} />
                        Active
                      </span>
                    ) : (
                      <span className="status-badge status-inactive">
                        <XCircle size={14} />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td>
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEditUser(user)}
                      title="Edit user"
                    >
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
    </div>
  );
};

