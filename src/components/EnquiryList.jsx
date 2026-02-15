import React from 'react';
import { FileText, Plus, Edit, Trash2 } from 'lucide-react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
} from '@mui/material';
import { format } from 'date-fns';

/**
 * EnquiryList Component
 * Displays list of enquiries with status badges and actions
 * 
 * @param {Object} props
 * @param {Array} props.enquiries - Array of enquiry objects
 * @param {Function} props.onCreateOrder - Callback when create order is clicked
 * @param {Function} props.onEdit - Callback when edit is clicked
 * @param {Function} props.onDelete - Callback when delete is clicked
 * @param {Function} props.onStatusChange - Callback when status is changed
 */
export const EnquiryList = ({
  enquiries = [],
  onCreateOrder,
  onEdit,
  onDelete,
  onStatusChange
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'default';
      case 'quoted':
        return 'info';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  if (enquiries.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <FileText size={48} color="#9ca3af" />
        <Typography variant="body1" sx={{ mt: 2, color: '#6b7280' }}>
          No enquiries found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {enquiries.map((enquiry) => (
        <Card key={enquiry.id} sx={{ '&:hover': { boxShadow: 2 } }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {enquiry.category?.charAt(0).toUpperCase() + enquiry.category?.slice(1) || 'Enquiry'}
                  </Typography>
                  <Chip
                    label={enquiry.status || 'new'}
                    color={getStatusColor(enquiry.status)}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
                  {enquiry.product_type?.replace('_', ' ') || 'N/A'} • Created {formatDate(enquiry.created_at)}
                </Typography>
                {enquiry.budget_min || enquiry.budget_max ? (
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Budget: ₹{enquiry.budget_min || 0} - ₹{enquiry.budget_max || '∞'}
                  </Typography>
                ) : null}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {onCreateOrder && enquiry.category === 'custom' && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Plus size={16} />}
                    onClick={() => onCreateOrder(enquiry)}
                    sx={{
                      bgcolor: '#8b6f47',
                      '&:hover': { bgcolor: '#6d5637' }
                    }}
                  >
                    Create Order
                  </Button>
                )}
                {onEdit && (
                  <IconButton size="small" onClick={() => onEdit(enquiry)}>
                    <Edit size={16} />
                  </IconButton>
                )}
                {onDelete && (
                  <IconButton size="small" color="error" onClick={() => onDelete(enquiry)}>
                    <Trash2 size={16} />
                  </IconButton>
                )}
              </Box>
            </Box>
            
            {enquiry.description && (
              <Typography variant="body2" sx={{ color: '#333', mt: 1 }}>
                {enquiry.description.length > 200 
                  ? `${enquiry.description.substring(0, 200)}...` 
                  : enquiry.description}
              </Typography>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};


