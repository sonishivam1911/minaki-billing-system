/**
 * StoreLocatorPage - In-Store Product Locator
 * Browse stores and view inventory by shelf
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { 
  LoadingSpinner, 
  ErrorMessage 
} from '../components';
import StoreGridView from '../components/StoreGridView';
import ShopFloorMap from '../components/ShopFloorMap';
import TransferStockModal from '../components/TransferStockModal';
import UpdateQuantityModal from '../components/UpdateQuantityModal';
import { useStoreLocator } from '../hooks';
import { useStoreManagement } from '../hooks/useStoreManagement';
import { useProductLocationTracking } from '../hooks';
import storageObjectsApi from '../services/storageObjectsApi';
import productsApi from '../services/productLocationApi';
import StorageTypeDropdown from '../components/StorageTypeDropdown';
import StorageObjectDropdown from '../components/StorageObjectDropdown';

const StoreLocatorPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedStorageType, setSelectedStorageType] = useState(null);
  const [storageObjects, setStorageObjects] = useState([]);
  const [storageObjectProducts, setStorageObjectProducts] = useState({});
  const [storeSummary, setStoreSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = summary, 1 = map
  const [storeProducts, setStoreProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [allStorageObjects, setAllStorageObjects] = useState([]);
  const [filters, setFilters] = useState({
    section_type: '',
    storage_type_id: '',
    storage_object_id: '',
    in_stock_only: false
  });
  
  // Legacy state names for backward compatibility
  const selectedShelf = selectedStorageType;
  const shelfBoxes = storageObjects;
  const boxProducts = storageObjectProducts;
  const allBoxes = allStorageObjects;
  
  // Modals
  const [transferModal, setTransferModal] = useState({
    isOpen: false,
    product: null,
    location: null
  });
  const [updateModal, setUpdateModal] = useState({
    isOpen: false,
    product: null,
    location: null
  });

  // All sections across all stores (for transfer modal)
  const [allSections, setAllSections] = useState([]);

  // Hook
  const {
    locations,
    stores,
    sections,
    loading,
    error,
    fetchStores,
    fetchStoreSections,
    getStoreInventory,
    getSectionInventory,
    updateLocationQuantity,
    transferStock,
    moveProductToSection
  } = useStoreLocator();

  // Additional hooks for products and storage objects
  const { searchProducts } = useProductLocationTracking();
  const { fetchBoxesByShelf } = useStoreManagement();

  // Ref to track if we're currently fetching to prevent duplicate calls
  const fetchingRef = useRef(false);
  const lastStoreIdRef = useRef(null);

  // Fetch stores on mount
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  /**
   * Fetch all products in the store with their storage type and storage object information for the table
   */
  const fetchStoreProductsForTable = useCallback(async (locationId) => {
    try {
      setLoadingProducts(true);
      // Build search filters with new field names
      const searchFilters = { location_id: locationId };
      if (filters.storage_type_id) {
        searchFilters.storage_type_id = parseInt(filters.storage_type_id);
      }
      if (filters.storage_object_id) {
        searchFilters.storage_object_id = parseInt(filters.storage_object_id);
      }
      
      // Fetch all products in this location
      const products = await searchProducts(searchFilters);
      const productsList = Array.isArray(products) ? products : products?.items || [];
      
      // Fetch all storage types and storage objects to map IDs to names
      const storageTypesList = await fetchStoreSections(locationId);
      const storageTypesMap = {};
      const storageObjectsMap = {};
      
      // Create storage type ID to name mapping
      for (const storageType of storageTypesList) {
        storageTypesMap[storageType.id] = {
          name: storageType.storage_type_name || storageType.name,
          code: storageType.storage_type_code || storageType.code
        };
        
        // Fetch storage objects for each storage type
        try {
          const storageObjectsList = await fetchBoxesByShelf(storageType.id);
          storageObjectsList.forEach(so => {
            storageObjectsMap[so.id] = {
              name: so.storage_object_label || so.storage_object_name || so.name,
              code: so.storage_object_code || so.code,
              storage_type_id: storageType.id
            };
          });
        } catch (err) {
          console.error(`Error fetching storage objects for storage type ${storageType.id}:`, err);
        }
      }
      
      // Enrich products with storage type and storage object names
      const enrichedProducts = productsList.map(product => ({
        ...product,
        storage_type_name: storageTypesMap[product.storage_type_id || product.shelf_id]?.name || '—',
        storage_type_code: storageTypesMap[product.storage_type_id || product.shelf_id]?.code || '—',
        storage_object_name: storageObjectsMap[product.storage_object_id || product.box_id]?.name || '—',
        storage_object_code: storageObjectsMap[product.storage_object_id || product.box_id]?.code || '—',
        // Legacy field names for backward compatibility
        shelf_name: storageTypesMap[product.storage_type_id || product.shelf_id]?.name || '—',
        shelf_code: storageTypesMap[product.storage_type_id || product.shelf_id]?.code || '—',
        box_name: storageObjectsMap[product.storage_object_id || product.box_id]?.name || '—',
        box_code: storageObjectsMap[product.storage_object_id || product.box_id]?.code || '—'
      }));
      
      setStoreProducts(enrichedProducts);
    } catch (err) {
      console.error('Error fetching store products:', err);
      setStoreProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [searchProducts, fetchStoreSections, fetchBoxesByShelf, filters]);

  // Fetch sections when store is selected
  useEffect(() => {
    if (!selectedStore) {
      setAllStorageObjects([]);
      setStoreProducts([]);
      setStoreSummary(null);
      lastStoreIdRef.current = null;
      return;
    }

    const locationId = selectedStore.location_id || selectedStore.id;
    
    // Prevent duplicate calls for the same store
    if (lastStoreIdRef.current === locationId && fetchingRef.current) {
      return;
    }

    // Prevent infinite loops
    if (fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;
    lastStoreIdRef.current = locationId;

    const fetchData = async () => {
      try {
        // Fetch storage types first
        const storageTypesList = await fetchStoreSections(locationId);
        
        // Fetch storage objects for all storage types for the map
        if (Array.isArray(storageTypesList)) {
          const allStorageObjectsList = [];
          for (const storageType of storageTypesList) {
            try {
              const storageObjectsList = await fetchBoxesByShelf(storageType.id);
              allStorageObjectsList.push(...storageObjectsList);
            } catch (err) {
              console.error(`Error fetching storage objects for storage type ${storageType.id}:`, err);
            }
          }
          setAllStorageObjects(allStorageObjectsList);
        }
        
        // Fetch products for the table
        await fetchStoreProductsForTable(locationId);
      } catch (err) {
        console.error('Error fetching store data:', err);
      } finally {
        fetchingRef.current = false;
      }
    };

    fetchData();
  }, [selectedStore?.id, selectedStore?.location_id, fetchStoreSections, fetchBoxesByShelf, fetchStoreProductsForTable]);

  // Load all sections from all stores for transfer modal
  useEffect(() => {
    const loadAllSections = async () => {
      const allSectionsList = [];
      for (const store of stores) {
        try {
          const locationId = store.location_id || store.id;
          const storeSections = await fetchStoreSections(locationId);
          allSectionsList.push(...storeSections);
        } catch (err) {
          const locationId = store.location_id || store.id;
          console.error(`Error loading sections for location ${locationId}:`, err);
        }
      }
      setAllSections(allSectionsList);
    };

    if (stores.length > 0) {
      loadAllSections();
    }
  }, [stores, fetchStoreSections]);

  // Handle store selection
  const handleStoreSelect = async (store) => {
    setSelectedStore(store);
    setSelectedSection(null);
    setSelectedStorageType(null);
    setStorageObjects([]);
    setStorageObjectProducts({});
    const locationId = store.location_id || store.id;
    await getStoreInventory(locationId, filters);
    // Calculate summary
    calculateStoreSummary(locationId);
  };

  // Calculate store summary
  const calculateStoreSummary = async (locationId) => {
    try {
      setLoadingSummary(true);
      const inventory = await productsApi.getSummary(locationId);
      const inventoryList = Array.isArray(inventory) ? inventory : inventory.items || inventory;
      
      const summary = {
        totalProducts: inventoryList.length,
        totalQuantity: inventoryList.reduce((sum, item) => sum + (item.total_quantity || item.quantity || 0), 0),
        byType: {},
        byShelf: {}
      };

      inventoryList.forEach(item => {
        // By product type
        const type = item.product_type || 'unknown';
        if (!summary.byType[type]) {
          summary.byType[type] = { count: 0, quantity: 0 };
        }
        summary.byType[type].count++;
        summary.byType[type].quantity += item.total_quantity || item.quantity || 0;

        // By storage type
        const storageTypeId = item.storage_type_id || item.shelf_id || 'unknown';
        if (!summary.byShelf[storageTypeId]) {
          summary.byShelf[storageTypeId] = { count: 0, quantity: 0 };
        }
        summary.byShelf[storageTypeId].count++;
        summary.byShelf[storageTypeId].quantity += item.total_quantity || item.quantity || 0;
      });

      setStoreSummary(summary);
    } catch (err) {
      console.error('Error calculating summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Handle storage type click - show storage objects
  const handleStorageTypeClick = async (storageType) => {
    setSelectedStorageType(storageType);
    try {
      const storageObjectsData = await storageObjectsApi.getByStorageType(storageType.id, true);
      const storageObjectsList = Array.isArray(storageObjectsData) ? storageObjectsData : storageObjectsData.items || storageObjectsData;
      setStorageObjects(storageObjectsList);

      // Fetch products for each storage object
      const productsMap = {};
      for (const storageObject of storageObjectsList) {
        try {
          const products = await productsApi.search({ storage_object_id: storageObject.id });
          const productsList = Array.isArray(products) ? products : products.items || products || [];
          productsMap[storageObject.id] = productsList;
        } catch (err) {
          console.error(`Error fetching products for storage object ${storageObject.id}:`, err);
          productsMap[storageObject.id] = [];
        }
      }
      setStorageObjectProducts(productsMap);
    } catch (err) {
      console.error('Error fetching storage objects:', err);
      setStorageObjects([]);
    }
  };

  // Legacy function name for backward compatibility
  const handleShelfClick = handleStorageTypeClick;

  // Handle section click in grid view - show storage objects
  const handleSectionClick = (section) => {
    handleStorageTypeClick(section);
  };

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    
    // Re-fetch store inventory when filters change
    if (selectedStore) {
      const locationId = selectedStore.location_id || selectedStore.id;
      getStoreInventory(locationId, newFilters);
      fetchStoreProductsForTable(locationId);
      calculateStoreSummary(locationId);
    }
  };

  // Handle transfer stock
  const handleTransferClick = (location) => {
    setTransferModal({
      isOpen: true,
      product: location.variant || location.product?.variant,
      location: location
    });
  };

  const handleTransferSubmit = async (transferData) => {
    await transferStock(transferData);
    setTransferModal({ isOpen: false, product: null, location: null });
    
    // Refresh current view
    if (selectedStore) {
      const locationId = selectedStore.location_id || selectedStore.id;
      await getStoreInventory(locationId, filters);
      await fetchStoreProductsForTable(locationId);
      await calculateStoreSummary(locationId);
    }
  };

  // Handle update quantity
  const handleUpdateQuantityClick = (location) => {
    setUpdateModal({
      isOpen: true,
      product: location.variant || location.product?.variant,
      location: location
    });
  };

  const handleUpdateQuantitySubmit = async (locationId, data) => {
    await updateLocationQuantity(locationId, data);
    setUpdateModal({ isOpen: false, product: null, location: null });
    
    // Refresh current view
    if (selectedStore) {
      const locationId = selectedStore.location_id || selectedStore.id;
      await getStoreInventory(locationId, filters);
      await fetchStoreProductsForTable(locationId);
      await calculateStoreSummary(locationId);
    }
  };

  // Handle product drag-and-drop in grid view
  const handleProductMove = async (product, fromLocation, toSection) => {
    try {
      await moveProductToSection(
        product.id,
        fromLocation.id,
        toSection.id,
        fromLocation.quantity_available
      );
      
      // Refresh store inventory
      if (selectedStore) {
        const locationId = selectedStore.location_id || selectedStore.id;
        await getStoreInventory(locationId, filters);
        await fetchStoreProductsForTable(locationId);
        await calculateStoreSummary(locationId);
      }
    } catch (err) {
      throw err;
    }
  };

  // Prepare inventory for grid view
  const inventoryForGrid = locations.map(loc => {
    const product = loc.variant || loc.product || {
      id: loc.product_id,
      name: loc.product_name,
      sku: loc.sku,
      product_type: loc.product_type,
      product_id: loc.product_id,
      product_name: loc.product_name,
    };
    
    const location = {
      ...loc,
      quantity: loc.quantity || loc.total_quantity || 0,
      storage_type_id: loc.storage_type_id || loc.shelf_id,
      storage_object_id: loc.storage_object_id || loc.box_id,
      storage_object_code: loc.storage_object_code || loc.box_code,
      product_id: loc.product_id,
      sku: loc.sku,
      product_type: loc.product_type,
      product_name: loc.product_name,
      shelf_id: loc.storage_type_id || loc.shelf_id,
      box_id: loc.storage_object_id || loc.box_id,
      box_code: loc.storage_object_code || loc.box_code,
    };
    
    return {
      product,
      location
    };
  });

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1, sm: 2 } }}>
      {/* Browse Mode */}
      {!selectedStore ? (
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 3, color: '#2c2416', textAlign: 'center' }}>
            Select a Store
          </Typography>
          <Grid container spacing={2}>
            {stores.map(store => (
              <Grid item xs={12} sm={6} md={4} key={store.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => handleStoreSelect(store)}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c2416', mb: 1 }}>
                      {store.location_name || store.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
                      {store.location_code || 'Location'}
                    </Typography>
                    {store.is_warehouse && (
                      <Chip label="Warehouse" size="small" sx={{ backgroundColor: '#f5f1e8', color: '#5d4e37' }} />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        <Box>
          {/* Header with Back Button and Filters */}
          <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setSelectedStore(null)}
              sx={{ alignSelf: 'flex-start' }}
            >
              ← Back to Stores
            </Button>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <FormControl sx={{ minWidth: { xs: '100%', sm: 180 } }} size="small">
                <InputLabel>Section Type</InputLabel>
                <Select
                  value={filters.section_type}
                  onChange={(e) => handleFilterChange('section_type', e.target.value)}
                  label="Section Type"
                >
                  <MenuItem value="">All Section Types</MenuItem>
                  <MenuItem value="display">Display</MenuItem>
                  <MenuItem value="vault">Vault</MenuItem>
                  <MenuItem value="storage">Storage</MenuItem>
                  <MenuItem value="counter">Counter</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                <StorageTypeDropdown
                  locationId={selectedStore?.location_id || selectedStore?.id}
                  value={filters.storage_type_id ? parseInt(filters.storage_type_id) : null}
                  onChange={(storageTypeId) => {
                    handleFilterChange('storage_type_id', storageTypeId || '');
                    if (!storageTypeId) {
                      handleFilterChange('storage_object_id', '');
                    }
                  }}
                  activeOnly={true}
                  placeholder="Filter by Storage Type"
                />
              </Box>

              {filters.storage_type_id && (
                <Box sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                  <StorageObjectDropdown
                    storageTypeId={parseInt(filters.storage_type_id)}
                    value={filters.storage_object_id ? parseInt(filters.storage_object_id) : null}
                    onChange={(storageObjectId) => handleFilterChange('storage_object_id', storageObjectId || '')}
                    activeOnly={true}
                    placeholder="Filter by Storage Object"
                  />
                </Box>
              )}

              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.in_stock_only}
                    onChange={(e) => handleFilterChange('in_stock_only', e.target.checked)}
                  />
                }
                label="In Stock Only"
              />
            </Box>
          </Box>

          {loading && <LoadingSpinner message="Loading store layout..." />}
          {error && <ErrorMessage message={error} />}

          {!loading && !error && (
            <>
              {/* Tabs */}
              <Box sx={{ borderBottom: 2, borderColor: '#d4c4a8', mb: 3 }}>
                <Tabs
                  value={activeTab}
                  onChange={(e, newValue) => setActiveTab(newValue)}
                  sx={{
                    minHeight: 'auto',
                    '& .MuiTabs-flexContainer': {
                      gap: 1,
                    },
                    '& .MuiTab-root': {
                      minHeight: '40px',
                      minWidth: 'auto',
                      px: { xs: 2, sm: 3 },
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: { xs: '0.875rem', sm: '0.9rem' },
                    },
                    '& .MuiTabs-indicator': {
                      height: 3,
                    },
                  }}
                >
                  <Tab label="Summary" />
                  <Tab label="Map" />
                </Tabs>
              </Box>

              {/* Summary Tab */}
              {activeTab === 0 && (
                <Box>
                  {/* Summary Cards */}
                  {loadingSummary ? (
                    <LoadingSpinner message="Loading store summary..." />
                  ) : storeSummary ? (
                    <Card sx={{ mb: 3, backgroundColor: '#faf8f3', border: '2px solid #d4c4a8' }}>
                      <CardContent>
                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#5d4e37', fontFamily: "'Cormorant Garamond', serif" }}>
                          Store Summary
                        </Typography>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={12} sm={4}>
                            <Card sx={{ backgroundColor: 'white' }}>
                              <CardContent>
                                <Typography variant="caption" sx={{ color: '#8b7355', display: 'block', mb: 0.5 }}>
                                  Total Products
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#5d4e37' }}>
                                  {storeSummary.totalProducts}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Card sx={{ backgroundColor: 'white' }}>
                              <CardContent>
                                <Typography variant="caption" sx={{ color: '#8b7355', display: 'block', mb: 0.5 }}>
                                  Total Quantity
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#5d4e37' }}>
                                  {storeSummary.totalQuantity}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Card sx={{ backgroundColor: 'white' }}>
                              <CardContent>
                                <Typography variant="caption" sx={{ color: '#8b7355', display: 'block', mb: 0.5 }}>
                                  Storage Types
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#5d4e37' }}>
                                  {sections.length}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>

                        {/* Product Types Breakdown Table */}
                        {Object.keys(storeSummary.byType).length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#5d4e37' }}>
                              By Product Type
                            </Typography>
                            <TableContainer component={Paper} variant="outlined">
                              <Table>
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#8b6f47', color: 'white' }}>Type</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#8b6f47', color: 'white' }}>Products</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#8b6f47', color: 'white' }}>Quantity</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {Object.entries(storeSummary.byType).map(([type, data]) => (
                                    <TableRow key={type} hover>
                                      <TableCell sx={{ color: '#5d4e37' }}>{type}</TableCell>
                                      <TableCell align="right" sx={{ color: '#5d4e37' }}>{data.count}</TableCell>
                                      <TableCell align="right" sx={{ color: '#5d4e37', fontWeight: 600 }}>{data.quantity}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ) : null}

                  {/* Products Table */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#5d4e37', fontFamily: "'Cormorant Garamond', serif" }}>
                      Complete Products Inventory
                    </Typography>
                    {loadingProducts ? (
                      <LoadingSpinner message="Loading products..." />
                    ) : storeProducts.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" sx={{ color: '#8b7355' }}>
                          No products in this store yet
                        </Typography>
                      </Box>
                    ) : (
                      <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
                        <Table stickyHeader sx={{ minWidth: { xs: 800, sm: 'auto' } }}>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600, backgroundColor: '#8b6f47', color: 'white', whiteSpace: 'nowrap' }}>Product ID</TableCell>
                              <TableCell sx={{ fontWeight: 600, backgroundColor: '#8b6f47', color: 'white', whiteSpace: 'nowrap' }}>Product Name</TableCell>
                              <TableCell sx={{ fontWeight: 600, backgroundColor: '#8b6f47', color: 'white', whiteSpace: 'nowrap' }}>SKU</TableCell>
                              <TableCell sx={{ fontWeight: 600, backgroundColor: '#8b6f47', color: 'white', whiteSpace: 'nowrap' }}>Product Type</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#8b6f47', color: 'white', whiteSpace: 'nowrap' }}>Quantity</TableCell>
                              <TableCell sx={{ fontWeight: 600, backgroundColor: '#8b6f47', color: 'white', whiteSpace: 'nowrap' }}>Storage Type</TableCell>
                              <TableCell sx={{ fontWeight: 600, backgroundColor: '#8b6f47', color: 'white', whiteSpace: 'nowrap' }}>Storage Type Code</TableCell>
                              <TableCell sx={{ fontWeight: 600, backgroundColor: '#8b6f47', color: 'white', whiteSpace: 'nowrap' }}>Storage Object</TableCell>
                              <TableCell sx={{ fontWeight: 600, backgroundColor: '#8b6f47', color: 'white', whiteSpace: 'nowrap' }}>Storage Object Code</TableCell>
                              <TableCell sx={{ fontWeight: 600, backgroundColor: '#8b6f47', color: 'white', whiteSpace: 'nowrap' }}>Details</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {storeProducts.map((product, index) => (
                              <TableRow key={product.id || index} hover>
                                <TableCell sx={{ color: '#8b7355', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                  {product.product_id ? product.product_id.substring(0, 8) + '...' : '—'}
                                </TableCell>
                                <TableCell sx={{ color: '#5d4e37', fontWeight: 500 }}>
                                  {product.product_name || '—'}
                                </TableCell>
                                <TableCell sx={{ color: '#8b7355', fontSize: '0.75rem' }}>
                                  {product.sku || '—'}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={product.product_type === 'real_jewelry' ? 'Jewelry' : 'Product'}
                                    size="small"
                                    sx={{
                                      backgroundColor: product.product_type === 'real_jewelry' ? '#f5f1e8' : '#e8e0d0',
                                      color: '#5d4e37',
                                      fontWeight: 500,
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="center" sx={{ color: '#5d4e37', fontWeight: 600 }}>
                                  {product.quantity || product.total_quantity || 0}
                                </TableCell>
                                <TableCell sx={{ color: '#5d4e37', fontWeight: 500 }}>
                                  {product.storage_type_name || product.shelf_name || '—'}
                                </TableCell>
                                <TableCell sx={{ color: '#8b7355', fontSize: '0.75rem' }}>
                                  {product.storage_type_code || product.shelf_code || '—'}
                                </TableCell>
                                <TableCell sx={{ color: '#5d4e37', fontWeight: 500 }}>
                                  {product.storage_object_name || product.box_name || '—'}
                                </TableCell>
                                <TableCell sx={{ color: '#8b7355', fontSize: '0.75rem' }}>
                                  {product.storage_object_code || product.box_code || '—'}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.7rem', color: '#8b7355' }}>
                                  {product.product_type === 'real_jewelry' ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                      {product.metal_weight_g && (
                                        <Typography variant="caption">Weight: {product.metal_weight_g}g</Typography>
                                      )}
                                      {product.purity_k && (
                                        <Typography variant="caption">Purity: {product.purity_k}K</Typography>
                                      )}
                                      {!product.metal_weight_g && !product.purity_k && <span>—</span>}
                                    </Box>
                                  ) : (
                                    <span>—</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                </Box>
              )}

              {/* Map Tab */}
              {activeTab === 1 && (
                <Box>
                  {selectedStorageType ? (
                    <Box sx={{ mb: 3 }}>
                      <Button
                        variant="outlined"
                        onClick={() => setSelectedStorageType(null)}
                        sx={{ mb: 2 }}
                      >
                        ← Back to Map
                      </Button>
                      <Card sx={{ backgroundColor: '#faf8f3', border: '2px solid #d4c4a8' }}>
                        <CardContent>
                          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#5d4e37', fontFamily: "'Cormorant Garamond', serif" }}>
                            {selectedStorageType.storage_type_name || selectedStorageType.name} - Storage Objects
                          </Typography>
                          {storageObjects.length === 0 ? (
                            <Typography variant="body1" sx={{ color: '#8b7355', textAlign: 'center', py: 4 }}>
                              No storage objects in this storage type
                            </Typography>
                          ) : (
                            <Grid container spacing={2}>
                              {storageObjects.map(storageObject => (
                                <Grid item xs={12} sm={6} md={4} key={storageObject.id}>
                                  <Card
                                    sx={{
                                      cursor: 'pointer',
                                      transition: 'border-color 0.2s',
                                      '&:hover': {
                                        borderColor: '#8b6f47',
                                      },
                                      border: '2px solid #d4c4a8',
                                    }}
                                  >
                                    <CardContent>
                                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#5d4e37' }}>
                                        {storageObject.storage_object_label || storageObject.storage_object_name || storageObject.name}
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: '#8b7355', mb: 0.5 }}>
                                        Code: {storageObject.storage_object_code || storageObject.code}
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: '#8b7355', mb: 1 }}>
                                        Capacity: {storageObject.capacity || '—'}
                                      </Typography>
                                      {storageObjectProducts[storageObject.id] && (
                                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #e8e0d0' }}>
                                          <Typography variant="caption" sx={{ color: '#8b7355', display: 'block', mb: 0.5 }}>
                                            Products: {storageObjectProducts[storageObject.id].length}
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: '#5d4e37', fontWeight: 600 }}>
                                            Total: {storageObjectProducts[storageObject.id].reduce((sum, p) => sum + (p.quantity || 0), 0)} units
                                          </Typography>
                                        </Box>
                                      )}
                                    </CardContent>
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          )}
                        </CardContent>
                      </Card>
                    </Box>
                  ) : (
                    <ShopFloorMap
                      shelves={sections}
                      boxes={allStorageObjects}
                      selectedShelf={selectedStorageType}
                      onShelfClick={handleStorageTypeClick}
                      store={selectedStore}
                      onPositionUpdated={async (updatedStorageType) => {
                        if (selectedStore) {
                          const locationId = selectedStore.location_id || selectedStore.id;
                          await fetchStoreSections(locationId);
                        }
                      }}
                    />
                  )}
                </Box>
              )}
            </>
          )}
        </Box>
      )}

      {/* Modals */}
      <TransferStockModal
        isOpen={transferModal.isOpen}
        onClose={() => setTransferModal({ isOpen: false, product: null, location: null })}
        product={transferModal.product}
        fromLocation={transferModal.location}
        stores={stores}
        sections={allSections}
        onTransfer={handleTransferSubmit}
      />

      <UpdateQuantityModal
        isOpen={updateModal.isOpen}
        onClose={() => setUpdateModal({ isOpen: false, product: null, location: null })}
        product={updateModal.product}
        location={updateModal.location}
        onUpdate={handleUpdateQuantitySubmit}
      />
    </Container>
  );
};

export default StoreLocatorPage;
