/**
 * ShelfDetailPage - Shows all boxes in a shelf with their products
 * Displays boxes in a grid, with products listed under each box
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LoadingSpinner, ErrorMessage } from '../components';
import BoxProductsModal from '../components/BoxProductsModal';
import boxesApi from '../services/boxApi';
import productsApi from '../services/productLocationApi';
import shelvesApi from '../services/shelfApi';
import '../styles/App.css';
import '../styles/ShelfDetailPage.css';

const ShelfDetailPage = () => {
  const { shelfId } = useParams();
  const navigate = useNavigate();
  const [shelf, setShelf] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [boxProducts, setBoxProducts] = useState({}); // { boxId: [products] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBox, setSelectedBox] = useState(null); // Selected box for modal

  // Fetch shelf details, boxes, and products
  useEffect(() => {
    const fetchShelfData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch shelf details
        const shelfData = await shelvesApi.getById(shelfId);
        setShelf(shelfData);

        // Fetch all boxes in this shelf
        const boxesData = await boxesApi.getByShelf(shelfId, true);
        const boxesList = Array.isArray(boxesData) ? boxesData : boxesData.items || boxesData || [];
        setBoxes(boxesList);

        // Fetch products for each box
        const productsMap = {};
        for (const box of boxesList) {
          try {
            // Use search API to get products in this box
            const products = await productsApi.search({ box_id: box.id });
            const productsList = Array.isArray(products) ? products : products.items || products || [];
            productsMap[box.id] = productsList;
          } catch (err) {
            console.error(`Error fetching products for box ${box.id}:`, err);
            productsMap[box.id] = [];
          }
        }
        setBoxProducts(productsMap);
      } catch (err) {
        setError(err.message || 'Failed to load shelf data');
        console.error('Error fetching shelf data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (shelfId) {
      fetchShelfData();
    }
  }, [shelfId]);

  if (loading) {
    return <LoadingSpinner message="Loading shelf details..." />;
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
          <h2>📦 {shelf?.shelf_name || shelf?.name || 'Shelf'}</h2>
          <p className="shelf-code">{shelf?.shelf_code || 'N/A'}</p>
        </div>
      </div>

      <div className="boxes-grid">
        {boxes.length === 0 ? (
          <div className="no-boxes">
            <p>No boxes available in this shelf</p>
          </div>
        ) : (
          boxes.map((box) => {
            const products = boxProducts[box.id] || [];
            return (
              <div 
                key={box.id} 
                className="box-card clickable"
                onClick={() => setSelectedBox(box)}
              >
                <div className="box-header">
                  <h3>{box.box_name || box.name || 'Box'}</h3>
                  <span className="box-code">{box.box_code || 'N/A'}</span>
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

      {/* Box Products Modal */}
      {selectedBox && (
        <BoxProductsModal
          isOpen={!!selectedBox}
          onClose={() => setSelectedBox(null)}
          boxName={selectedBox.box_name || selectedBox.name}
          boxCode={selectedBox.box_code}
          products={boxProducts[selectedBox.id] || []}
        />
      )}
    </div>
  );
};

export default ShelfDetailPage;

