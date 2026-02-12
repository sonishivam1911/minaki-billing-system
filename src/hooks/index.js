// Export all custom hooks from a single file for easy imports
export { useCart } from './useCart';
export { useCustomers } from './useCustomers';
export { useProducts } from './useProducts';
export { useDemistifiedProducts } from './useDemistifiedProducts';
export { useInvoices } from './useInvoices';
export { useStoreLocator } from './useStoreLocator';
export { useStoreManagement } from './useStoreManagement';
export { useProductLocationTracking } from './useLocations';
export { useUsers } from './useUsers';
export { usePermissions } from './usePermissions';
// Reports Hooks
export { useReports } from './useReports';
export { useReportFilters } from './useReportFilters';
export { useInventoryReport } from './useInventoryReport';
export { useSalesReport } from './useSalesReport';
export { useProductReport } from './useProductReport';
// Backwards compatibility and direct exports
export { useProductLocationTracking as useProductLocations } from './useLocations';
export { default as useLocations } from './useLocations';
// Walk-in and Custom Order Hooks
export { useWalkIns } from './useWalkIns';
export { useEnquiries } from './useEnquiries';
export { useCustomOrders } from './useCustomOrders';
export { useHrDashboard } from './useHrDashboard';