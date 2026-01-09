import React from 'react';
import { User } from 'lucide-react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Avatar,
} from '@mui/material';

/**
 * CustomerCard Component
 * Displays customer information in a card format
 * 
 * @param {Object} props
 * @param {Object} props.customer - Customer data
 * @param {Function} props.onSelect - Callback when customer is selected
 */
export const CustomerCard = ({ customer, onSelect }) => {
  // Handle different possible field names from the API response
  const name = customer.name || customer["Contact Name"] || customer["Display Name"] || customer["Company Name"] || "Unknown";
  const phone = customer.phone || customer.Phone || customer.MobilePhone || "";
  const email = customer.email || customer.EmailID || "";
  const loyaltyPoints = customer.loyalty_points || 0;
  const totalSpent = customer.total_spent || 0;

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ backgroundColor: '#8b6f47', width: 56, height: 56 }}>
            <User size={32} />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c2416' }}>
              {name}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
              {phone && (
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  {phone}
                </Typography>
              )}
              {email && (
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  {email}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
              Loyalty Points
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#8b6f47' }}>
              {loyaltyPoints}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
              Total Spent
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#8b6f47' }}>
              ₹{totalSpent.toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => onSelect(customer)}
        >
          Select Customer
        </Button>
      </CardActions>
    </Card>
  );
};
