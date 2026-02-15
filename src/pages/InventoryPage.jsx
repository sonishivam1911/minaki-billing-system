import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts, useDemistifiedProducts } from '../hooks';
import {
  ProductCard,
  LoadingSpinner,
  ErrorMessage,
  DemistifiedFilters,
  Pagination,
  CreateLabProductModal,
  ProductFilters,
  ReportTable,
} from '../components';
import { productsApi } from '../services/api';
import { applyProductFilters } from '../utils/productUtils';
import { Plus, Grid, List } from 'lucide-react';
import '../styles/CatalogPage.css';

/**
 * InventoryPage Component
 * Lists products (Lab + Demistified) with tabular and card views, Create product (lab-grown only)
 */
export const InventoryPage = () => {
  const navigate = useNavigate();
  const [productType, setProductType] = useState('lab'); // 'lab' | 'demistified'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'card'
  const [filters, setFilters] = useState({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const realProductsHook = useProducts({ autoFetch: true });
  const demistifiedProductsHook = useDemistifiedProducts({ autoFetch: false });
  const activeHook = productType === 'lab' ? realProductsHook : demistifiedProductsHook;

  const filteredProducts = useMemo(() => {
    if (productType === 'demistified') {
      return activeHook.products || [];
    }
    if (Object.keys(filters).length === 0) {
      return activeHook.products || [];
    }
    return applyProductFilters(activeHook.products || [], filters);
  }, [activeHook.products, filters, productType]);

  const tableData = useMemo(() => {
    return (filteredProducts || []).map((p) => ({
      id: p.id || p.item_id || p.sku,
      name: p.name || p.title || '—',
      sku: p.sku || '—',
      stock_on_hand: p.stock_on_hand ?? p.available_stock ?? p.stock ?? 0,
      category: p.category_name || p.category || '—',
      rate: p.rate ?? p.price ?? p.final_price ?? 0,
      image: p.image || p.shopify_image?.url,
      product: p,
    }));
  }, [filteredProducts]);

  const sortedTableData = useMemo(() => {
    const key = sortBy;
    const order = sortOrder === 'asc' ? 1 : -1;
    return [...tableData].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (typeof aVal === 'number' && typeof bVal === 'number') return order * (aVal - bVal);
      const aStr = String(aVal ?? '').toLowerCase();
      const bStr = String(bVal ?? '').toLowerCase();
      return order * aStr.localeCompare(bStr);
    });
  }, [tableData, sortBy, sortOrder]);

  const handleProductTypeChange = async (type) => {
    setProductType(type);
    setFilters({});
    if (type === 'demistified' && !demistifiedProductsHook.hasInitiallyLoaded) {
      try {
        await demistifiedProductsHook.refetch();
      } catch (err) {
        console.error('Error loading demistified products:', err);
      }
    }
  };

  const handleFiltersChange = async (newFilters) => {
    setFilters(newFilters);
    if (productType === 'demistified') {
      try {
        await demistifiedProductsHook.applyFilters(newFilters);
      } catch (err) {
        console.error('Filter error:', err);
      }
    }
  };

  const handleSort = (columnKey, order) => {
    setSortBy(columnKey);
    setSortOrder(order);
  };

  const handlePageChange = async (page) => {
    try {
      await activeHook.goToPage(page);
    } catch (err) {
      console.error('Page change error:', err);
    }
  };

  const handleCreateProduct = async (productData, images) => {
    setIsCreating(true);
    try {
      const response = await productsApi.createLabGrownProduct(productData);
      if (images?.length > 0 && response.product_summary?.variants?.length > 0) {
        const sku = response.product_summary.variants[0].sku;
        if (sku) {
          try {
            await productsApi.uploadImagesForSku(sku, images, { compress: true, makePublic: true });
          } catch (imageErr) {
            console.error('Error uploading images:', imageErr);
            alert(`Product created but image upload failed: ${imageErr.message}`);
          }
        }
      }
      await realProductsHook.refetch();
      alert(`Product created successfully! ${response.message || ''}`);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Error creating product:', err);
      alert(`Failed to create product: ${err.message}`);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  const handleRowClick = (row) => {
    const p = row?.product;
    if (!p) return;
    const type = p.isDemistified ? 'demistified' : 'real';
    const id = encodeURIComponent(p.item_id || p.id || p.sku || '');
    if (id) navigate(`/product/${type}/${id}`);
  };

  const tableColumns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {row.image && (
            <img
              src={row.image}
              alt=""
              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
            />
          )}
          <span style={{ fontWeight: 500 }}>{row.name}</span>
        </div>
      ),
    },
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'stock_on_hand', label: 'Stock on Hand', sortable: true, format: 'number' },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'rate', label: 'Rate', sortable: true, format: 'currency' },
  ];

  const shouldShowFullPageLoader = activeHook.loading;

  if (shouldShowFullPageLoader && !activeHook.products?.length) {
    return <LoadingSpinner message="Loading products..." />;
  }

  if (activeHook.error && !activeHook.products?.length) {
    return <ErrorMessage message={activeHook.error} onRetry={() => activeHook.refetch()} />;
  }

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">Inventory</h1>
          <p className="screen-subtitle">Manage products — Fine and Demi Fine</p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          marginTop: 20,
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div className="form-mode-toggle">
          <button
            type="button"
            className={`toggle-btn ${productType === 'lab' ? 'active' : ''}`}
            onClick={() => handleProductTypeChange('lab')}
            disabled={shouldShowFullPageLoader}
          >
            Fine
          </button>
          <button
            type="button"
            className={`toggle-btn ${productType === 'demistified' ? 'active' : ''}`}
            onClick={() => handleProductTypeChange('demistified')}
            disabled={shouldShowFullPageLoader}
          >
            Demi Fine
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div className="form-mode-toggle">
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
              onClick={() => setViewMode('card')}
              title="Card View"
            >
              <Grid size={16} />
            </button>
          </div>

          {productType === 'lab' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsCreateModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={18} />
              Create Product
            </button>
          )}
        </div>
      </div>

      {productType === 'demistified' ? (
        <DemistifiedFilters filters={filters} onFiltersChange={handleFiltersChange} />
      ) : (
        <ProductFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          products={activeHook.products || []}
        />
      )}

      {viewMode === 'table' ? (
        <ReportTable
          columns={tableColumns}
          data={sortedTableData}
          onSort={handleSort}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onRowClick={handleRowClick}
          loading={activeHook.loading && !tableData.length}
          emptyMessage={`No ${productType === 'lab' ? 'Fine' : 'Demi Fine'} products found. Try adjusting filters.`}
        />
      ) : (
        <div className={viewMode === 'card' ? 'products-grid' : 'products-list-detailed'}>
          {(filteredProducts || []).map((product) => (
            <ProductCard
              key={`${product.id ?? product.item_id}-${productType}`}
              product={product}
              onAddToCart={() => {}}
            />
          ))}
        </div>
      )}

      {(viewMode === 'card' || viewMode === 'table') && activeHook.totalPages > 1 && (
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
          <Pagination
            currentPage={activeHook.currentPage}
            totalPages={activeHook.totalPages}
            onPageChange={handlePageChange}
            disabled={activeHook.loading}
          />
        </div>
      )}

      {(!filteredProducts || filteredProducts.length === 0) && !shouldShowFullPageLoader && (
        <div className="empty-state">
          <p>
            No {productType === 'lab' ? 'Fine' : 'Demi Fine'} products found
            {Object.keys(filters).length > 0 && ' with selected filters'}.
          </p>
          {Object.keys(filters).length > 0 && (
            <button
              className="btn btn-secondary"
              onClick={() => handleFiltersChange({})}
              style={{ marginTop: '1rem' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      <CreateLabProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProduct}
        loading={isCreating}
      />
    </div>
  );
};
