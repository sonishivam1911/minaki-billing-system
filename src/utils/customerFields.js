/**
 * Utilities for resolving customer field names from the API.
 * The API returns customer_master columns with Zoho-style names:
 * "Contact ID", "Contact Name", "Billing City", "Billing State", "Billing Code",
 * "EmailID", "Phone", "MobilePhone", "First Name", "Last Name", etc.
 */

export const getField = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v != null && v !== '') return v;
  }
  return null;
};

export const getDisplayName = (customer) => {
  const full = getField(customer, 'name', 'Contact Name', 'Display Name', 'Company Name');
  if (full) return full;
  const first = getField(customer, 'First Name', 'first_name');
  const last = getField(customer, 'Last Name', 'last_name');
  if (first || last) return [first, last].filter(Boolean).join(' ').trim();
  return null;
};

export const getCustomerDisplay = (customer) => ({
  name: getDisplayName(customer),
  phone: getField(customer, 'phone', 'Phone', 'MobilePhone', 'mobile_phone'),
  email: getField(customer, 'email', 'Email', 'EmailID'),
  address: getField(customer, 'address', 'Address', 'Billing Address'),
  city: getField(customer, 'city', 'City', 'Billing City'),
  state: getField(customer, 'state', 'State', 'Billing State'),
  postalCode: getField(customer, 'postal_code', 'Postal Code', 'pincode', 'Billing Code'),
  gstin: getField(customer, 'gstin', 'GSTIN'),
  customerType: getField(customer, 'customer_type', 'Customer Type', 'Customer Sub Type'),
  customerNumber: getField(customer, 'Customer Number', 'customer_number'),
  contactId: getField(customer, 'Contact ID', 'id', 'contact_id'),
  loyaltyPoints: Number(customer?.loyalty_points ?? customer?.['Loyalty Points'] ?? 0) || 0,
  totalSpent: Number(customer?.total_spent ?? customer?.['Total Spent'] ?? 0) || 0,
});

export const getCustomerKey = (customer) =>
  customer?.['Contact ID'] || customer?.id || customer?.['Customer Number'] || null;
