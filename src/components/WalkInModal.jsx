import React, { useState, useEffect } from 'react';
import { X, User, Clock, UserCheck, FileText, Plus, Search } from 'lucide-react';
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
  Box,
  IconButton,
  CircularProgress,
  Autocomplete,
  Paper,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
} from '@mui/material';
import { useCustomers } from '../hooks';
import { CustomerModal } from './CustomerModal';
import { useAuth } from '../context/AuthContext';

/**
 * WalkInModal Component
 * Modal for registering a new walk-in visit
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Function to close modal
 * @param {Function} props.onSubmit - Function called when walk-in is created
 * @param {Object} props.initialCustomer - Pre-selected customer (optional)
 */
export const WalkInModal = ({ isOpen, onClose, onSubmit, initialCustomer = null }) => {
  const { userInfo } = useAuth();
  const [formData, setFormData] = useState({
    customer_id: null,
    visit_date: new Date().toISOString().split('T')[0],
    visit_time: new Date().toTimeString().slice(0, 5),
    assigned_staff: userInfo?.email || userInfo?.username || '',
    visit_purpose: '',
    notes: '',
    status: 'active'
  });
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { customers, loading: customersLoading, createCustomer } = useCustomers();

  useEffect(() => {
    if (initialCustomer) {
      setSelectedCustomer(initialCustomer);
      setFormData(prev => ({
        ...prev,
        customer_id: initialCustomer.id || initialCustomer['Contact ID']
      }));
    }
  }, [initialCustomer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customer_id: customer.id || customer['Contact ID']
    }));
    setCustomerSearchQuery('');
    setIsCustomerModalOpen(false);
  };

  const handleCreateCustomer = async (customerData) => {
    try {
      const newCustomer = await createCustomer(customerData);
      handleCustomerSelect(newCustomer);
      setIsCreateCustomerModalOpen(false);
    } catch (err) {
      console.error('Failed to create customer:', err);
      setError('Failed to create customer. Please try again.');
    }
  };

  // Filter customers based on search query
  // Show all customers if query is empty, otherwise filter
  const filteredCustomers = React.useMemo(() => {
    // Ensure customers is always an array
    const customersList = Array.isArray(customers) ? customers : [];
    
    if (!customerSearchQuery || customerSearchQuery.trim() === '') {
      return customersList; // Show all customers when no search query
    }
    
    const query = customerSearchQuery.toLowerCase().trim();
    if (!query) return customersList;
    
    return customersList.filter((customer) => {
      try {
        if (!customer || typeof customer !== 'object') {
          return false;
        }
        const name = (customer.name || customer["Contact Name"] || customer["Display Name"] || customer["Company Name"] || "").toString().toLowerCase();
        const phone = (customer.phone || customer.Phone || customer.MobilePhone || "").toString().toLowerCase();
        const email = (customer.email || customer.EmailID || "").toString().toLowerCase();
        
        return (
          name.includes(query) ||
          phone.includes(query) ||
          email.includes(query)
        );
      } catch (err) {
        console.error('Error filtering customer:', err, customer);
        return false;
      }
    });
  }, [customers, customerSearchQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.customer_id && !selectedCustomer) {
      setError('Please select or create a customer');
      return;
    }

    if (!formData.assigned_staff) {
      setError('Assigned staff is required');
      return;
    }

    if (!formData.visit_purpose) {
      setError('Visit purpose is required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const walkInData = {
        ...formData,
        customer_id: formData.customer_id || selectedCustomer?.id || selectedCustomer?.['Contact ID'],
        visit_date: formData.visit_date,
        visit_time: formData.visit_time,
      };

      await onSubmit(walkInData);
      
      // Reset form
      setFormData({
        customer_id: null,
        visit_date: new Date().toISOString().split('T')[0],
        visit_time: new Date().toTimeString().slice(0, 5),
        assigned_staff: userInfo?.email || userInfo?.username || '',
        visit_purpose: '',
        notes: '',
        status: 'active'
      });
      setSelectedCustomer(null);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create walk-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const visitPurposes = [
    { value: 'browsing', label: 'Browsing' },
    { value: 'enquiry', label: 'Enquiry' },
    { value: 'custom_order', label: 'Custom Order' },
    { value: 'repair', label: 'Repair' },
    { value: 'pickup', label: 'Pickup' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <>
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
              <User size={20} />
              <span>Register Walk-in</span>
            </Box>
            <IconButton onClick={onClose} size="small">
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: '#fee', color: '#c33', borderRadius: 1 }}>
                {error}
              </Box>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Customer Selection */}
              <Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Autocomplete
                    fullWidth
                    options={filteredCustomers || []}
                    getOptionLabel={(option) => {
                      try {
                        if (!option || typeof option !== 'object') return '';
                        return option.name || 
                               option["Contact Name"] || 
                               option["Display Name"] || 
                               option["Company Name"] || 
                               'Unknown Customer';
                      } catch (err) {
                        console.error('Error getting option label:', err, option);
                        return 'Unknown Customer';
                      }
                    }}
                    getOptionKey={(option) => {
                      return option?.id || option?.['Contact ID'] || option?.name || Math.random();
                    }}
                    value={selectedCustomer}
                    onChange={(event, newValue) => {
                      if (newValue) {
                        handleCustomerSelect(newValue);
                      } else {
                        setSelectedCustomer(null);
                        setFormData(prev => ({ ...prev, customer_id: null }));
                      }
                    }}
                    inputValue={customerSearchQuery}
                    onInputChange={(event, newInputValue, reason) => {
                      try {
                        // Only update on user input, not on selection
                        if (reason === 'input') {
                          setCustomerSearchQuery(newInputValue || '');
                        }
                      } catch (err) {
                        console.error('Error in customer search input:', err);
                        setCustomerSearchQuery('');
                      }
                    }}
                    loading={customersLoading}
                    filterOptions={(options, state) => {
                      // Let the component handle filtering, we already filtered in useMemo
                      return options;
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Customer *"
                        placeholder="Search customer by name, phone, or email..."
                        required
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: <Search size={18} style={{ marginRight: 8, color: '#999' }} />,
                        }}
                      />
                    )}
                    renderOption={(props, option) => {
                      try {
                        if (!option || typeof option !== 'object') return null;
                        
                        const name = option.name || 
                                    option["Contact Name"] || 
                                    option["Display Name"] || 
                                    option["Company Name"] || 
                                    'Unknown Customer';
                        const phone = option.phone || option.Phone || option.MobilePhone || '';
                        const email = option.email || option.EmailID || '';
                        
                        return (
                          <ListItem {...props} key={option.id || option['Contact ID'] || Math.random()}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: '#8b6f47' }}>
                                <User size={20} />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={name}
                              secondary={
                                <>
                                  {phone && <span>Phone: {phone}</span>}
                                  {phone && email && ' • '}
                                  {email && <span>Email: {email}</span>}
                                </>
                              }
                            />
                          </ListItem>
                        );
                      } catch (err) {
                        console.error('Error rendering customer option:', err, option);
                        return null;
                      }
                    }}
                    PaperComponent={(props) => (
                      <Paper {...props} sx={{ mt: 1 }} />
                    )}
                    noOptionsText={
                      customerSearchQuery && customerSearchQuery.trim() ? (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            No customer found matching "{customerSearchQuery}"
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Plus size={16} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsCreateCustomerModalOpen(true);
                            }}
                            sx={{ mt: 1 }}
                          >
                            Create New Customer
                          </Button>
                        </Box>
                      ) : (
                        'Start typing to search customers...'
                      )
                    }
                    isOptionEqualToValue={(option, value) => {
                      try {
                        if (!option || !value || typeof option !== 'object' || typeof value !== 'object') return false;
                        return (option.id || option['Contact ID']) === (value.id || value['Contact ID']);
                      } catch (err) {
                        console.error('Error comparing options:', err);
                        return false;
                      }
                    }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<Plus size={18} />}
                    onClick={() => setIsCreateCustomerModalOpen(true)}
                    sx={{
                      minWidth: 'auto',
                      px: 2,
                      borderColor: '#8b6f47',
                      color: '#8b6f47',
                      '&:hover': {
                        borderColor: '#6d5637',
                        bgcolor: '#f5f5f5'
                      }
                    }}
                  >
                    Add
                  </Button>
                </Box>
                {selectedCustomer && (
                  <Box sx={{ mt: 1, p: 1.5, bgcolor: '#f0f8ff', borderRadius: 1, border: '1px solid #8b6f47' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <UserCheck size={16} color="#8b6f47" />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#8b6f47' }}>
                        Selected: {selectedCustomer.name || selectedCustomer['Contact Name'] || selectedCustomer['Display Name'] || 'Customer'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, fontSize: '0.875rem', color: '#666' }}>
                      {selectedCustomer.phone && <span>📞 {selectedCustomer.phone}</span>}
                      {selectedCustomer.email && <span>✉️ {selectedCustomer.email}</span>}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Visit Date */}
              <TextField
                label="Visit Date *"
                type="date"
                name="visit_date"
                value={formData.visit_date}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />

              {/* Visit Time */}
              <TextField
                label="Visit Time *"
                type="time"
                name="visit_time"
                value={formData.visit_time}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />

              {/* Assigned Staff */}
              <TextField
                label="Assigned Staff *"
                name="assigned_staff"
                value={formData.assigned_staff}
                onChange={handleChange}
                fullWidth
                required
                helperText="Username or email of staff member"
              />

              {/* Visit Purpose */}
              <FormControl fullWidth required>
                <InputLabel>Visit Purpose *</InputLabel>
                <Select
                  name="visit_purpose"
                  value={formData.visit_purpose}
                  onChange={handleChange}
                  label="Visit Purpose *"
                >
                  {visitPurposes.map((purpose) => (
                    <MenuItem key={purpose.value} value={purpose.value}>
                      {purpose.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Notes */}
              <TextField
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
                placeholder="Additional notes about the visit..."
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
              sx={{
                bgcolor: '#8b6f47',
                '&:hover': { bgcolor: '#6d5637' }
              }}
            >
              {isSubmitting ? 'Creating...' : 'Register Walk-in'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Customer Selection Modal (for browsing all customers) */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelectCustomer={handleCustomerSelect}
      />

      {/* Create Customer Modal */}
      <CreateCustomerModal
        isOpen={isCreateCustomerModalOpen}
        onClose={() => setIsCreateCustomerModalOpen(false)}
        onSubmit={handleCreateCustomer}
      />
    </>
  );
};

/**
 * CreateCustomerModal Component
 * Simple modal for creating a new customer
 */
const CreateCustomerModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Customer name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      
      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to create customer');
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
            <Plus size={20} />
            <span>Create New Customer</span>
          </Box>
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#fee', color: '#c33', borderRadius: 1 }}>
              {error}
            </Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Customer Name *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
              placeholder="Enter customer name"
            />

            <TextField
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              fullWidth
              placeholder="Enter phone number"
            />

            <TextField
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              placeholder="Enter email address"
            />

            <TextField
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              placeholder="Enter customer address"
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !formData.name.trim()}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
            sx={{
              bgcolor: '#8b6f47',
              '&:hover': { bgcolor: '#6d5637' }
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Customer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

