import React from 'react';
import { formatRupees } from '../utils';

/**
 * OrderSummary Component
 * Displays order totals with subtotal, tax, and total
 * 
 * @param {Object} props
 * @param {Array} props.items - Cart items
 * @param {number} props.subtotal - Subtotal amount
 * @param {number} props.tax - Tax amount
 * @param {number} props.total - Total amount
 * @param {number} props.itemCount - Number of items
 * @param {boolean} props.showItems - Whether to show itemized list
 */
export const OrderSummary = ({ 
  items = [], 
  subtotal, 
  tax, 
  total, 
  itemCount,
  showItems = false 
}) => {
  return (
    <div className="order-summary">
      <h2>Order Summary</h2>

      {showItems && items.length > 0 && (
        <>
          <div className="summary-items">
            {items.map((item) => (
              <div key={item.cart_item_id || item.id} className="summary-item">
                <span>{item.quantity}× {item.name}</span>
                <span>{formatRupees(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="summary-divider"></div>
        </>
      )}

      <div className="summary-line">
        <span>Subtotal {itemCount > 0 && `(${itemCount} items)`}</span>
        <span>{formatRupees(subtotal)}</span>
      </div>

      <div className="summary-line">
        <span>GST (3%)</span>
        <span>{formatRupees(tax)}</span>
      </div>

      <div className="summary-divider"></div>

      <div className="summary-line total">
        <span>Total</span>
        <span>{formatRupees(total)}</span>
      </div>
    </div>
  );
};