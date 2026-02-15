import React, { useState } from 'react';
import { UserPlus, Mail, User, Shield } from 'lucide-react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  Box,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { ErrorMessage } from './ErrorMessage';

/**
 * CreateUserModal Component
 * Modal for creating new users
 */
export const CreateUserModal = ({ isOpen, onClose, onCreate, loading }) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'staff',
    sendWelcomeEmail: true,
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleCheckboxChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.checked,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.email || !formData.name) {
      setError('Email and name are required');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreate(formData);
      // Reset form
      setFormData({
        email: '',
        name: '',
        role: 'staff',
        sendWelcomeEmail: true,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UserPlus size={24} color="#8b6f47" />
            <span>Create New User</span>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <ErrorMessage message={error} />}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="user@example.com"
              required
              disabled={isSubmitting}
              InputProps={{
                startAdornment: <Mail size={18} style={{ marginRight: 8, color: '#6b7280' }} />,
              }}
            />

            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
              disabled={isSubmitting}
              InputProps={{
                startAdornment: <User size={18} style={{ marginRight: 8, color: '#6b7280' }} />,
              }}
            />

            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                label="Role"
                disabled={isSubmitting}
                startAdornment={<Shield size={18} style={{ marginLeft: 8, color: '#6b7280' }} />}
              >
                <MenuItem value="staff">Staff</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  name="sendWelcomeEmail"
                  checked={formData.sendWelcomeEmail}
                  onChange={handleCheckboxChange}
                  disabled={isSubmitting}
                />
              }
              label="Send welcome email with login credentials (email and temporary password)"
            />
            <FormHelperText sx={{ ml: 4, mt: -1 }}>
              The user will receive an email with their email address and temporary password to log in.
            </FormHelperText>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={onClose}
            disabled={isSubmitting}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            variant="contained"
            startIcon={isSubmitting ? <CircularProgress size={18} /> : null}
          >
            {isSubmitting ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
