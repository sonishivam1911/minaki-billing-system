import React from 'react';
import { User, Phone, Mail, MapPin, Building2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Avatar,
  Divider,
} from '@mui/material';

// Helper to resolve field from multiple possible API field names
// API returns Zoho-style columns: "Contact Name", "Billing City", "Billing State", etc.
const getField = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj[k];
    if (v != null && v !== '') return v;
  }
  return null;
};

// Build full name from various API field combinations
const getDisplayName = (customer) => {
  const full = getField(customer, 'name', 'Contact Name', 'Display Name', 'Company Name');
  if (full) return full;
  const first = getField(customer, 'First Name', 'first_name');
  const last = getField(customer, 'Last Name', 'last_name');
  if (first || last) return [first, last].filter(Boolean).join(' ').trim();
  return 'Unknown';
};

/**
 * CustomerCard Component
 * Displays all customer information in a card format
 * Maps both snake_case and Zoho API column names (e.g. "Billing City", "Contact ID")
 *
 * @param {Object} props
 * @param {Object} props.customer - Customer data from API (customer_master columns)
 * @param {Function} props.onSelect - Callback when customer is selected
 */
export const CustomerCard = ({ customer, onSelect }) => {
  const name = getDisplayName(customer);
  const phone = getField(customer, 'phone', 'Phone', 'MobilePhone', 'mobile_phone');
  const email = getField(customer, 'email', 'Email', 'EmailID');
  const address = getField(customer, 'address', 'Address', 'Billing Address');
  const city = getField(customer, 'city', 'City', 'Billing City');
  const state = getField(customer, 'state', 'State', 'Billing State');
  const postalCode = getField(customer, 'postal_code', 'Postal Code', 'pincode', 'Billing Code');
  const gstin = getField(customer, 'gstin', 'GSTIN');
  const customerType = getField(customer, 'customer_type', 'Customer Type', 'Customer Sub Type');
  const customerNumber = getField(customer, 'Customer Number', 'customer_number');
  const contactId = getField(customer, 'Contact ID', 'id', 'contact_id');
  const loyaltyPoints = customer?.loyalty_points ?? customer?.['Loyalty Points'] ?? 0;
  const totalSpent = customer?.total_spent ?? customer?.['Total Spent'] ?? 0;

  const DetailRow = ({ label, value, icon: Icon }) =>
    value ? (
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
        {Icon && <Icon size={14} style={{ marginTop: 3, flexShrink: 0, color: '#8b7355' }} />}
        <Box>
          <Typography variant="caption" sx={{ color: '#8b7355', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {label}
          </Typography>
          <Typography variant="body2" sx={{ color: '#2c2416' }}>
            {value}
          </Typography>
        </Box>
      </Box>
    ) : null;

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
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c2416' }}>
              {name}
            </Typography>
            {(customerNumber || contactId) && (
              <Typography variant="caption" sx={{ color: '#8b7355' }}>
                #{customerNumber || contactId}
              </Typography>
            )}
          </Box>
        </Box>

        <DetailRow label="Phone" value={phone} icon={Phone} />
        <DetailRow label="Email" value={email} icon={Mail} />
        <DetailRow label="Address" value={address} icon={MapPin} />
        {(city || state || postalCode) && (
          <DetailRow
            label="Location"
            value={[city, state, postalCode].filter(Boolean).join(', ')}
            icon={Building2}
          />
        )}
        <DetailRow label="GSTIN" value={gstin} />
        <DetailRow label="Customer Type" value={customerType} />

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 2 }}>
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
              ₹{totalSpent.toLocaleString('en-IN')}
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
