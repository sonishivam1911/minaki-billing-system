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
 * CustomProductCard Component
 * Displays custom product information in a card format
 */
export const CustomProductCard = ({
  product,
  onViewDetails,
  onEdit,
  onDelete,
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

  const customerName = product.customer?.name ||
    product.customer?.['Contact Name'] ||
    product.customer?.['Display Name'] ||
    'Unknown Customer';

  const displayPrice = product.total_amount || product.estimated_price;

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
              {product.product_number || `Product #${product.id}`}
            </Typography>
            {product.article_code && (
              <Typography variant="caption" sx={{ color: '#8b6f47', display: 'block', mb: 0.5 }}>
                {product.article_code} • {product.classification || 'Made to Order'}
              </Typography>
            )}
            <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
              {customerName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={14} color="#6b7280" />
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                {formatDate(product.created_at)}
              </Typography>
            </Box>
          </Box>
          <Box>
            <Chip
              label={product.status || 'draft'}
              color={getStatusColor(product.status)}
              size="small"
              sx={{ mb: 1 }}
            />
            <IconButton size="small" onClick={handleMenuClick}>
              <MoreVertical size={18} />
            </IconButton>
          </Box>
        </Box>

        {product.reference_images && product.reference_images.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <ImageGallery images={product.reference_images.slice(0, 3)} />
            {product.reference_images.length > 3 && (
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                +{product.reference_images.length - 3} more images
              </Typography>
            )}
          </Box>
        )}

        {product.description && (
          <Typography variant="body2" sx={{ color: '#333', mb: 2 }}>
            {product.description.length > 100
              ? `${product.description.substring(0, 100)}...`
              : product.description}
          </Typography>
        )}

        {displayPrice && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IndianRupee size={16} color="#8b6f47" />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#8b6f47' }}>
              ₹{Number(displayPrice).toLocaleString()}
            </Typography>
          </Box>
        )}
      </CardContent>

      <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
        {onViewDetails && (
          <Box
            component="button"
            onClick={() => onViewDetails(product)}
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
            onEdit(product);
          }}>
            Edit
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={() => {
            handleMenuClose();
            onDelete(product);
          }} sx={{ color: 'error.main' }}>
            Delete
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};
