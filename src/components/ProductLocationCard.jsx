import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
} from '@mui/material';
import '../styles/ProductLocationCard.css';

/**
 * ProductLocationCard Component
 * Displays a single product and all its locations
 * 
 * Props:
 * - product: Product details (name, sku, image, etc.)
 * - locations: Array of locations where this product is stored
 * - onTransfer: Callback when transfer button is clicked
 * - onUpdateQuantity: Callback when update quantity button is clicked
 */
const ProductLocationCard = ({ 
  product = {}, 
  locations = [], 
  onTransfer,
  onUpdateQuantity 
}) => {
  const handleTransfer = (location) => {
    if (onTransfer) {
      onTransfer(location);
    }
  };

  const handleUpdateQuantity = (location) => {
    if (onUpdateQuantity) {
      onUpdateQuantity(location);
    }
  };

  const totalQuantity = locations.reduce((sum, loc) => sum + (loc.quantity || 0), 0);

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ fontSize: '2rem' }}>
              {product.image || '💍'}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c2416' }}>
                {product.name || 'Unknown Product'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                SKU: {product.sku || 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#8b6f47', fontWeight: 600, mt: 0.5 }}>
                ₹{parseFloat(product.price || 0).toFixed(2)}
              </Typography>
            </Box>
          </Box>
        }
        action={
          <Chip
            label={`Total: ${totalQuantity} units`}
            color="primary"
            sx={{ fontWeight: 600 }}
          />
        }
      />
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#2c2416' }}>
          Locations:
        </Typography>
        {locations.length === 0 ? (
          <Typography variant="body2" sx={{ color: '#6b7280', py: 2 }}>
            No locations found
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Store</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Storage Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Storage Object</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Quantity</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {locations.map((location, idx) => (
                  <TableRow key={location.id || idx} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {location.store_name || location.store?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {location.storage_type_name || location.section_type || location.section?.type || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {location.storage_object_code || location.box_code || location.box?.code || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {location.quantity || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleTransfer(location)}
                          title="Transfer to another location"
                        >
                          ↔️ Transfer
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleUpdateQuantity(location)}
                          title="Update quantity"
                        >
                          📝 Update
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductLocationCard;
