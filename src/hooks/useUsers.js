import { useState, useEffect, useCallback } from 'react';
import { usersApi } from '../services/usersApi';
import { useAuth } from '../context/AuthContext';

/**
 * Custom Hook: useUsers
 * Manages users data and operations
 */
export const useUsers = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch all users
   */
  const fetchUsers = useCallback(async () => {
    // Don't fetch if not admin
    if (!isAdmin()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await usersApi.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      // Don't redirect on 401 if we're checking admin status
      if (err.status === 401) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError(err.message || 'Failed to load users');
      }
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  /**
   * Fetch users on mount (only if admin)
   */
  useEffect(() => {
    if (!authLoading && isAdmin()) {
      fetchUsers();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [fetchUsers, authLoading, isAdmin]);

  /**
   * Create new user
   */
  const createUser = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const newUser = await usersApi.create(userData);
      setUsers((prev) => [...prev, newUser]);
      return newUser;
    } catch (err) {
      setError(err.message || 'Failed to create user');
      console.error('Create user error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user
   */
  const updateUser = useCallback(async (id, userData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedUser = await usersApi.update(id, userData);
      setUsers((prev) => prev.map((u) => (u.id === id ? updatedUser : u)));
      return updatedUser;
    } catch (err) {
      setError(err.message || 'Failed to update user');
      console.error('Update user error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Deactivate user
   */
  const deactivateUser = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await usersApi.deactivate(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: false } : u)));
    } catch (err) {
      setError(err.message || 'Failed to deactivate user');
      console.error('Deactivate user error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reset user password
   */
  const resetPassword = useCallback(async (id) => {
    try {
      setError(null);
      const result = await usersApi.resetPassword(id);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to reset password');
      console.error('Reset password error:', err);
      throw err;
    }
  }, []);

  /**
   * Select user
   */
  const selectUser = useCallback((user) => {
    setSelectedUser(user);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    users,
    selectedUser,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deactivateUser,
    resetPassword,
    selectUser,
    clearError,
  };
};

