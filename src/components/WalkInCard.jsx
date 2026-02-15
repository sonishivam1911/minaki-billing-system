import React from 'react';
import { Clock, User, FileText, MoreVertical } from 'lucide-react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { format } from 'date-fns';

/**
 * WalkInCard Component
 * Displays walk-in visit information in a card format
 * 
 * @param {Object} props
 * @param {Object} props.walkIn - Walk-in data
 * @param {Function} props.onViewDetails - Callback when view details is clicked
 * @param {Function} props.onAddEnquiry - Callback when add enquiry is clicked
 * @param {Function} props.onEdit - Callback when edit is clicked
 * @param {Function} props.onDelete - Callback when delete is clicked
 */
export const WalkInCard = ({
  walkIn,
  onViewDetails,
  onAddEnquiry,
  onEdit,
  onDelete
}) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'default';
      case 'follow_up':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDateTime = (date, time) => {
    try {
      if (date && time) {
        const dateTime = new Date(`${date}T${time}`);
        return format(dateTime, 'MMM dd, yyyy hh:mm a');
      }
      if (date) {
        return format(new Date(date), 'MMM dd, yyyy');
      }
      return 'N/A';
    } catch (e) {
      return `${date} ${time}`;
    }
  };

  const customerName = walkIn.customer?.name || 
                       walkIn.customer?.['Contact Name'] || 
                       walkIn.customer?.['Display Name'] || 
                       'Unknown Customer';

  const visitPurposeLabels = {
    browsing: 'Browsing',
    enquiry: 'Enquiry',
    custom_order: 'Custom Order',
    repair: 'Repair',
    pickup: 'Pickup',
    other: 'Other'
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c2416', mb: 1 }}>
              {customerName}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Clock size={14} color="#6b7280" />
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  {formatDateTime(walkIn.visit_date, walkIn.visit_time)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <User size={14} color="#6b7280" />
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  Staff: {walkIn.assigned_staff || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box>
            <Chip
              label={walkIn.status || 'active'}
              color={getStatusColor(walkIn.status)}
              size="small"
              sx={{ mb: 1 }}
            />
            <IconButton size="small" onClick={handleMenuClick}>
              <MoreVertical size={18} />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Chip
            label={visitPurposeLabels[walkIn.visit_purpose] || walkIn.visit_purpose || 'N/A'}
            variant="outlined"
            size="small"
            sx={{ mr: 1 }}
          />
        </Box>

        {walkIn.notes && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 1 }}>
            <FileText size={14} color="#6b7280" style={{ marginTop: 2 }} />
            <Typography variant="body2" sx={{ color: '#6b7280', fontStyle: 'italic' }}>
              {walkIn.notes.length > 100 ? `${walkIn.notes.substring(0, 100)}...` : walkIn.notes}
            </Typography>
          </Box>
        )}
      </CardContent>

      <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
        {onAddEnquiry && (
          <Box
            component="button"
            onClick={() => onAddEnquiry(walkIn)}
            sx={{
              flex: 1,
              p: 1,
              border: '1px solid #8b6f47',
              borderRadius: 1,
              bgcolor: 'transparent',
              color: '#8b6f47',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              '&:hover': {
                bgcolor: '#f5f5f5'
              }
            }}
          >
            Add Enquiry
          </Box>
        )}
        {onViewDetails && (
          <Box
            component="button"
            onClick={() => onViewDetails(walkIn)}
            sx={{
              flex: 1,
              p: 1,
              border: '1px solid #ccc',
              borderRadius: 1,
              bgcolor: 'transparent',
              color: '#666',
              cursor: 'pointer',
              fontSize: '0.875rem',
              '&:hover': {
                bgcolor: '#f5f5f5'
              }
            }}
          >
            View Details
          </Box>
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
      >
        {onEdit && (
          <MenuItem onClick={() => {
            handleMenuClose();
            onEdit(walkIn);
          }}>
            Edit
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={() => {
            handleMenuClose();
            onDelete(walkIn);
          }} sx={{ color: 'error.main' }}>
            Delete
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};


