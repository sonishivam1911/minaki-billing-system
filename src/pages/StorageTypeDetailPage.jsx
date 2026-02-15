/**
 * StorageTypeDetailPage - Shows all storage objects in a storage type with their products
 * Displays storage objects in a grid, with products listed under each storage object
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LoadingSpinner, ErrorMessage } from '../components';
import BoxProductsModal from '../components/BoxProductsModal';
import storageObjectsApi from '../services/storageObjectsApi';
import productsApi from '../services/productLocationApi';
import storageTypesApi from '../services/storageTypesApi';
import '../styles/App.css';
import '../styles/ShelfDetailPage.css';

const StorageTypeDetailPage = () => {
  const { storageTypeId } = useParams();
  const navigate = useNavigate();
  const [storageType, setStorageType] = useState(null);
  const [storageObjects, setStorageObjects] = useState([]);
  const [storageObjectProducts, setStorageObjectProducts] = useState({}); // { storageObjectId: [products] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStorageObject, setSelectedStorageObject] = useState(null); // Selected storage object for modal

  // Fetch storage type details, storage objects, and products
  useEffect(() => {
    const fetchStorageTypeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch storage type details
        const storageTypeData = await storageTypesApi.getById(storageTypeId);
        setStorageType(storageTypeData);

        // Fetch all storage objects in this storage type
        const storageObjectsData = await storageObjectsApi.getByStorageType(storageTypeId, true);
        const storageObjectsList = Array.isArray(storageObjectsData) ? storageObjectsData : storageObjectsData.items || storageObjectsData || [];
        setStorageObjects(storageObjectsList);

        // Fetch products for each storage object
        const productsMap = {};
        for (const storageObject of storageObjectsList) {
          try {
            // Use search API to get products in this storage object
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
        setError(err.message || 'Failed to load storage type data');
        console.error('Error fetching storage type data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (storageTypeId) {
      fetchStorageTypeData();
    }
  }, [storageTypeId]);

  if (loading) {
    return <LoadingSpinner message="Loading storage type details..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="shelf-detail-page">
      <div className="shelf-detail-header">
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/store-locator')}
        >
          ← Back to Store Locator
        </button>
        
        <div className="shelf-info">
          <h2>📚 {storageType?.storage_type_name || storageType?.name || 'Storage Type'}</h2>
          <p className="shelf-code">{storageType?.storage_type_code || 'N/A'}</p>
        </div>
      </div>

      <div className="boxes-grid">
        {storageObjects.length === 0 ? (
          <div className="no-boxes">
            <p>No storage objects available in this storage type</p>
          </div>
        ) : (
          storageObjects.map((storageObject) => {
            const products = storageObjectProducts[storageObject.id] || [];
            return (
              <div 
                key={storageObject.id} 
                className="box-card clickable"
                onClick={() => setSelectedStorageObject(storageObject)}
              >
                <div className="box-header">
                  <h3>{storageObject.storage_object_label || storageObject.name || 'Storage Object'}</h3>
                  <span className="box-code">{storageObject.storage_object_code || 'N/A'}</span>
                </div>
                
                <div className="box-products">
                  {products.length === 0 ? (
                    <p className="empty-box">📭 Empty</p>
                  ) : (
                    <div className="products-list">
                      {products.map((product, idx) => {
                        const productName = product.product_name || product.name || 'Product';
                        const sku = product.sku || 'N/A';
                        const quantity = product.quantity || product.total_quantity || 0;
                        const productType = product.product_type || 'real_jewelry';
                        const productId = product.product_id || product.id;
                        
                        return (
                          <div key={idx} className="product-item">
                            <div className="product-info">
                              <span className="product-sku">{sku}</span>
                              <span className="product-name">{productName}</span>
                            </div>
                            <span className="product-qty">Qty: {quantity}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <div className="box-footer">
                  <span className="box-total">{products.length} {products.length === 1 ? 'item' : 'items'}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Storage Object Products Modal */}
      {selectedStorageObject && (
        <BoxProductsModal
          isOpen={!!selectedStorageObject}
          onClose={() => setSelectedStorageObject(null)}
          boxName={selectedStorageObject.storage_object_label || selectedStorageObject.name}
          boxCode={selectedStorageObject.storage_object_code}
          products={storageObjectProducts[selectedStorageObject.id] || []}
        />
      )}
    </div>
  );
};

export default StorageTypeDetailPage;

