import React from 'react';
import { Package, Calendar, IndianRupee, MoreVertical } from 'lucide-react';
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
import { ImageGallery } from './ImageGallery';
import { format } from 'date-fns';

/**
 * CustomOrderCard Component
 * Displays custom order information in a card format
 * 
 * @param {Object} props
 * @param {Object} props.order - Custom order data
 * @param {Function} props.onViewDetails - Callback when view details is clicked
 * @param {Function} props.onEdit - Callback when edit is clicked
 * @param {Function} props.onDelete - Callback when delete is clicked
 * @param {Function} props.onGenerateQuote - Callback when generate quote is clicked
 */
export const CustomOrderCard = ({
  order,
  onViewDetails,
  onEdit,
  onDelete,
  onGenerateQuote
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
      case 'draft':
        return 'default';
      case 'quoted':
        return 'info';
      case 'approved':
        return 'success';
      case 'in_production':
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

  const customerName = order.customer?.name || 
                       order.customer?.['Contact Name'] || 
                       order.customer?.['Display Name'] || 
                       'Unknown Customer';

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
              {order.order_number || `Order #${order.id}`}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
              {customerName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={14} color="#6b7280" />
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                {formatDate(order.created_at)}
              </Typography>
            </Box>
          </Box>
          <Box>
            <Chip
              label={order.status || 'draft'}
              color={getStatusColor(order.status)}
              size="small"
              sx={{ mb: 1 }}
            />
            <IconButton size="small" onClick={handleMenuClick}>
              <MoreVertical size={18} />
            </IconButton>
          </Box>
        </Box>

        {/* Reference Images Preview */}
        {order.reference_images && order.reference_images.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <ImageGallery images={order.reference_images.slice(0, 3)} />
            {order.reference_images.length > 3 && (
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                +{order.reference_images.length - 3} more images
              </Typography>
            )}
          </Box>
        )}

        {/* Description Preview */}
        {order.description && (
          <Typography variant="body2" sx={{ color: '#333', mb: 2 }}>
            {order.description.length > 100 
              ? `${order.description.substring(0, 100)}...` 
              : order.description}
          </Typography>
        )}

        {/* Estimated Price */}
        {order.estimated_price && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IndianRupee size={16} color="#8b6f47" />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#8b6f47' }}>
              ₹{order.estimated_price.toLocaleString()}
            </Typography>
          </Box>
        )}
      </CardContent>

      <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
        {onViewDetails && (
          <Box
            component="button"
            onClick={() => onViewDetails(order)}
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
        {onGenerateQuote && order.status === 'draft' && (
          <Box
            component="button"
            onClick={() => onGenerateQuote(order)}
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
            Generate Quote
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
            onEdit(order);
          }}>
            Edit
          </MenuItem>
        )}
        {onGenerateQuote && order.status === 'draft' && (
          <MenuItem onClick={() => {
            handleMenuClose();
            onGenerateQuote(order);
          }}>
            Generate Quote
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={() => {
            handleMenuClose();
            onDelete(order);
          }} sx={{ color: 'error.main' }}>
            Delete
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};

