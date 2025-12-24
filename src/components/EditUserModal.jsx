import React, { useState, useEffect } from 'react';
import { X, User, Shield, Mail, Key, Trash2 } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

/**
 * EditUserModal Component
 * Modal for editing user details and resetting password
 */
export const EditUserModal = ({ isOpen, onClose, user, onUpdate, onDeactivate, onResetPassword, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: 'staff',
    is_active: true,
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        role: user.role || 'staff',
        is_active: user.is_active !== false,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name) {
      setError('Name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onUpdate(user.id, formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!window.confirm(`Send password reset email to ${user.email}?`)) {
      return;
    }

    try {
      setResetPasswordLoading(true);
      setError(null);
      await onResetPassword(user.id);
      alert('Password reset email sent successfully!');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm(`Are you sure you want to deactivate ${user.name || user.email}?`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onDeactivate(user.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to deactivate user');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <User size={24} />
            <span>Edit User</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <ErrorMessage message={error} />}

          <div className="form-group">
            <label>
              <Mail size={18} />
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="disabled-input"
            />
            <small>Email cannot be changed</small>
          </div>

          <div className="form-group">
            <label htmlFor="name">
              <User size={18} />
              Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">
              <Shield size={18} />
              Role <span className="required">*</span>
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              <span>Active</span>
            </label>
          </div>

          <div className="form-group">
            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={handleResetPassword}
              disabled={resetPasswordLoading || isSubmitting}
            >
              <Key size={18} />
              {resetPasswordLoading ? 'Sending...' : 'Send Password Reset Email'}
            </button>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDeactivate}
              disabled={isSubmitting}
            >
              <Trash2 size={18} />
              Deactivate
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

