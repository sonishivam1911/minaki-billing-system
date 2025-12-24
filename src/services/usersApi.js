import { apiRequest } from './apiClient';

/**
 * Users API Service
 * Handles all user management operations
 */
export const usersApi = {
  /**
   * Get all users
   * GET /auth/users
   */
  getAll: async () => {
    try {
      const data = await apiRequest('GET', '/auth/users');
      return data.users || data;
    } catch (error) {
      console.error('Users API - Get all error:', error);
      throw error;
    }
  },

  /**
   * Get user by ID
   * GET /auth/users/{id}
   */
  getById: async (id) => {
    try {
      const data = await apiRequest('GET', `/auth/users/${id}`);
      return data.user || data;
    } catch (error) {
      console.error('Users API - Get by ID error:', error);
      throw error;
    }
  },

  /**
   * Create new user
   * POST /auth/users
   * Always sends welcome email with login credentials unless explicitly disabled
   */
  create: async (userData) => {
    try {
      const data = await apiRequest('POST', '/auth/users', {
        email: userData.email,
        name: userData.name,
        role: userData.role || 'staff',
        send_welcome_email: userData.sendWelcomeEmail !== false // Default to true
      });
      
      // Show success message if email was sent
      if (userData.sendWelcomeEmail !== false && data.user) {
        console.log('✅ User created successfully. Welcome email sent to:', data.user.email);
      }
      
      return data.user || data;
    } catch (error) {
      console.error('Users API - Create error:', error);
      throw error;
    }
  },

  /**
   * Update user
   * PATCH /auth/users/{id}
   */
  update: async (id, userData) => {
    try {
      const updateData = {};
      if (userData.name !== undefined) updateData.name = userData.name;
      if (userData.role !== undefined) updateData.role = userData.role;
      if (userData.is_active !== undefined) updateData.is_active = userData.is_active;

      const data = await apiRequest('PATCH', `/auth/users/${id}`, updateData);
      return data.user || data;
    } catch (error) {
      console.error('Users API - Update error:', error);
      throw error;
    }
  },

  /**
   * Deactivate user
   * DELETE /auth/users/{id}
   */
  deactivate: async (id) => {
    try {
      const data = await apiRequest('DELETE', `/auth/users/${id}`);
      return data;
    } catch (error) {
      console.error('Users API - Deactivate error:', error);
      throw error;
    }
  },

  /**
   * Reset user password
   * POST /auth/users/{id}/reset-password
   */
  resetPassword: async (id) => {
    try {
      const data = await apiRequest('POST', `/auth/users/${id}/reset-password`);
      return data;
    } catch (error) {
      console.error('Users API - Reset password error:', error);
      throw error;
    }
  },
};

