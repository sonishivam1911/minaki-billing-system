import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Receipt, UserCheck, User } from 'lucide-react';
import { useCustomers } from '../hooks';
import { useCart } from '../context/CartContext';
import { checkoutApi, cartApi } from '../services/api';
import { OrderSummary, CustomerModal } from '../components';

/**
 * CheckoutPage Component
 * Handles customer selection and payment processing
 */
export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartId, items, totals, clearCart } = useCart();
  const { selectedCustomer, clearSelection, selectCustomer } = useCustomers();
  
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const total = totals.total;
  const change = cashAmount ? Math.max(0, parseFloat(cashAmount) - total) : 0;

  const handleCustomerSelect = (customer) => {
    selectCustomer(customer);
    setIsCustomerModalOpen(false);
    const customerName = customer.name || customer["Contact Name"] || customer["Display Name"] || customer["Company Name"] || "Unknown Customer";
    // Optional: Show success message
    console.log('Customer selected for checkout:', customerName);
  };

  const handleCompleteSale = async () => {
    try {
      setProcessing(true);

      const checkoutData = {
        cart_id: cartId,
        customer_id: selectedCustomer?.id || null,
        payment_method: paymentMethod,
        cash_amount: paymentMethod === 'cash' ? parseFloat(cashAmount) : null,
      };

      const result = await checkoutApi.completeSale(checkoutData);

      alert(`Sale completed! Invoice #${result.invoice_number}`);

      // Clear cart and create new one
      await clearCart();
      const newCart = await cartApi.create();
      
      // Navigate back to catalog
      navigate('/catalog');
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to complete sale. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const isValidPayment = () => {
    if (paymentMethod === 'cash') {
      return cashAmount && parseFloat(cashAmount) >= total;
    }
    return true; // Other payment methods are assumed valid
  };

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">Checkout</h1>
          <p className="screen-subtitle">Complete your transaction</p>
        </div>
      </div>

      <div className="checkout-layout">
        <div className="checkout-main">
          {/* Customer Information Section */}
          <div className="checkout-section">
            <h2 className="section-title">Customer Information</h2>

            {selectedCustomer ? (
              <div className="customer-selected">
                <User size={40} />
                <div>
                  <div className="customer-name">
                    {selectedCustomer.name || 
                     selectedCustomer["Contact Name"] || 
                     selectedCustomer["Display Name"] || 
                     selectedCustomer["Company Name"] || 
                     "Unknown Customer"}
                  </div>
                  <div className="customer-phone">
                    {selectedCustomer.phone || 
                     selectedCustomer.Phone || 
                     selectedCustomer.MobilePhone || 
                     "No phone"}
                  </div>
                  <div className="customer-loyalty">
                    Loyalty Points: {selectedCustomer.loyalty_points || 0}
                  </div>
                </div>
                <button className="btn-link" onClick={clearSelection}>
                  Change
                </button>
              </div>
            ) : (
              <div className="customer-actions">
                <button
                  className="btn-outline"
                  onClick={() => setIsCustomerModalOpen(true)}
                >
                  <User size={18} />
                  Select Customer
                </button>
                <button 
                  className="btn-outline"
                  onClick={() => setIsCustomerModalOpen(true)}
                >
                  <User size={18} />
                  Create New Customer
                </button>
                <button className="btn-link">Continue as Guest</button>
              </div>
            )}
          </div>

          {/* Payment Method Section */}
          <div className="checkout-section">
            <h2 className="section-title">Payment Method</h2>

            <div className="payment-methods">
              {['cash', 'card', 'upi', 'bank_transfer'].map((method) => (
                <button
                  key={method}
                  className={`payment-method ${paymentMethod === method ? 'active' : ''}`}
                  onClick={() => setPaymentMethod(method)}
                >
                  <CreditCard size={24} />
                  <span>{method.replace('_', ' ').toUpperCase()}</span>
                </button>
              ))}
            </div>

            {/* Cash Payment Details */}
            {paymentMethod === 'cash' && (
              <div className="payment-details">
                <label className="input-label">Cash Received</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Enter amount"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                />
                {change > 0 && (
                  <div className="change-display">
                    Change to return: <strong>₹{change.toLocaleString()}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Card Payment Details */}
            {paymentMethod === 'card' && (
              <div className="payment-details">
                <div className="card-terminal">
                  <CreditCard size={48} />
                  <p>Waiting for card...</p>
                  <p className="terminal-hint">Insert, tap, or swipe card</p>
                </div>
              </div>
            )}

            {/* UPI Payment Details */}
            {paymentMethod === 'upi' && (
              <div className="payment-details">
                <label className="input-label">UPI ID</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="customer@upi"
                />
                <button className="btn-secondary">Generate QR Code</button>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="checkout-summary">
          <OrderSummary
            items={items}
            subtotal={totals.subtotal}
            tax={totals.tax}
            total={totals.total}
            itemCount={totals.itemCount}
            showItems={true}
          />

          <button
            className="btn-primary btn-full btn-large"
            onClick={handleCompleteSale}
            disabled={processing || !isValidPayment()}
          >
            <Receipt size={20} />
            {processing ? 'Processing...' : 'Complete Sale'}
          </button>

          <button className="btn-secondary btn-full">
            Hold Transaction
          </button>
        </div>
      </div>

      {/* Customer Selection Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelectCustomer={handleCustomerSelect}
      />
    </div>
  );
};