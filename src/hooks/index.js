// Export all custom hooks from a single file for easy imports
export { useCart } from './useCart';
export { useCustomers } from './useCustomers';
export { useProducts } from './useProducts';
export { useDemifiedProducts } from './useDemifiedProducts';
export { useInvoices } from './useInvoices';
export { useStoreLocator } from './useStoreLocator';
export { useStoreManagement } from './useStoreManagement';
export { useProductLocationTracking } from './useLocations';
// Backwards compatibility and direct exports
export { useProductLocationTracking as useProductLocations } from './useLocations';
export { default as useLocations } from './useLocations';