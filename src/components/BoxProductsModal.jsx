/**
 * BoxProductsModal - Modal to display all products in a box in table format
 * Shows product details without images
 */
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';

const BoxProductsModal = ({ 
  isOpen, 
  onClose, 
  boxName,
  boxCode,
  products = []
}) => {
  const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || p.total_quantity || 0), 0);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              📦 {boxName || 'Box'}
            </Typography>
            {boxCode && (
              <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                {boxCode}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {products.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" sx={{ color: '#6b7280' }}>
              📭 No products in this box
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>SKU</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Product Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Product Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Quantity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product, idx) => {
                  const sku = product.sku || 'N/A';
                  const productName = product.product_name || product.name || 'Product';
                  const productType = product.product_type || 'N/A';
                  const quantity = product.quantity || product.total_quantity || 0;
                  
                  return (
                    <TableRow key={idx} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#8b7355' }}>
                          {sku}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {productName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            productType === 'real_jewelry' ? 'Real Jewelry' : 
                            productType === 'zakya_product' ? 'Zakya Product' : 
                            productType
                          }
                          size="small"
                          sx={{
                            backgroundColor: productType === 'real_jewelry' ? '#f5f1e8' : '#e8e0d0',
                            color: '#5d4e37',
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {quantity}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} sx={{ fontWeight: 600 }}>
                    Total Items:
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {products.length}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} sx={{ fontWeight: 600 }}>
                    Total Quantity:
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {totalQuantity}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BoxProductsModal;
