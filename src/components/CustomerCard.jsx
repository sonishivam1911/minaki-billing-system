import React from 'react';
import { User } from 'lucide-react';

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
    <div className="customer-card">
      <div className="customer-avatar">
        <User size={32} />
      </div>

      <div className="customer-info">
        <h3 className="customer-card-name">{name}</h3>
        <div className="customer-contact">
          {phone && <span>{phone}</span>}
          {email && phone && (
            <>
              <span>•</span>
              <span>{email}</span>
            </>
          )}
          {email && !phone && <span>{email}</span>}
        </div>
      </div>

      <div className="customer-stats">
        <div className="stat">
          <div className="stat-label">Loyalty Points</div>
          <div className="stat-value">{loyaltyPoints}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Total Spent</div>
          <div className="stat-value">₹{totalSpent.toLocaleString()}</div>
        </div>
      </div>

      <button 
        className="btn-outline"
        onClick={() => onSelect(customer)}
      >
        Select Customer
      </button>
    </div>
  );
};