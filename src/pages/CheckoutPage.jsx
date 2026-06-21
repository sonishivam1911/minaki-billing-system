import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Receipt, User, QrCode, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useCustomers, useInvoices } from '../hooks';
import { useCart } from '../context/CartContext';
import { checkoutApi, paymentsApi } from '../services/api';
import { OrderSummary, CustomerModal, CheckoutSuccess, CurrencyBreakdown, PaymentApprovedReceiptOptions } from '../components';

/**
 * CheckoutPage Component
 * Handles customer selection and payment processing
 */
export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartId, items, totals, clearCart } = useCart();
  const { selectedCustomer, clearSelection, selectCustomer } = useCustomers();
  const { autoSendInvoice } = useInvoices();
  
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showReceiptOptionsView, setShowReceiptOptionsView] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState(null);
  
  // UPI QR Code state
  const [upiQRCode, setUpiQRCode] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  
  // Pine Labs state
  const [pineLabsOrder, setPineLabsOrder] = useState(null);
  const [pineLabsUniqueId, setPineLabsUniqueId] = useState('');
  const [recordingTransaction, setRecordingTransaction] = useState(false);
  const [transactionRecorded, setTransactionRecorded] = useState(false);
  
  // Error handling
  const [paymentError, setPaymentError] = useState(null);
  
  // Auto-send preferences (could come from settings in future)
  const [autoSendPreferences] = useState({
    autoSendWhatsApp: false, // Set to true to auto-send via WhatsApp
    autoSendEmail: false     // Set to true to auto-send via Email
  });
  
  // Reset payment state when payment method changes
  useEffect(() => {
    setUpiQRCode(null);
    setPineLabsOrder(null);
    setPineLabsUniqueId('');
    setTransactionRecorded(false);
    setPaymentError(null);
    setGeneratingQR(false);
    setRecordingTransaction(false);
  }, [paymentMethod]);

  const total = totals?.total || 0;
  const change = cashAmount ? Math.max(0, parseFloat(cashAmount) - total) : 0;

  const handleCustomerSelect = (customer) => {
    selectCustomer(customer);
    setIsCustomerModalOpen(false);
    const customerName = customer.name || customer["Contact Name"] || customer["Display Name"] || customer["Company Name"] || "Unknown Customer";
    // Optional: Show success message
    console.log('Customer selected for checkout:', customerName);
  };

  // Generate UPI QR Code
  const handleGenerateUPIQR = async () => {
    try {
      setGeneratingQR(true);
      setPaymentError(null);
      
      // Validate required values
      if (!total || total <= 0) {
        throw new Error('Invalid amount. Please ensure cart has items.');
      }
      
      // Generate a transaction ID
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const qrData = {
        amount: total,
        transaction_note: `Payment for Cart #${cartId || 'N/A'}`,
        transaction_id: transactionId,
        invoice_url: `${window.location.origin}/invoices`
      };
      
      const result = await paymentsApi.generateUPIQR(qrData);
      
      if (result && result.success && result.qr_code_base64) {
        setUpiQRCode(result);
        console.log('UPI QR Code generated successfully:', result);
      } else {
        throw new Error(result?.message || 'Invalid response from server. QR code data missing.');
      }
    } catch (error) {
      console.error('Error generating UPI QR code:', error);
      const errorMessage = error.message || 'Failed to generate UPI QR code. Please try again.';
      setPaymentError(errorMessage);
      // Don't re-throw - just show error to user
    } finally {
      setGeneratingQR(false);
    }
  };

  // Handle Razorpay Payment
  const handleRazorpayPayment = async () => {
    try {
      setProcessing(true);
      setPaymentError(null);
      
      // Generate receipt ID
      const receiptId = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const orderData = {
        amount: total,
        currency: 'INR',
        receipt: receiptId,
        customer_id: selectedCustomer?.id || selectedCustomer?.["Contact ID"] || null,
        notes: {
          cart_id: cartId,
          customer_name: selectedCustomer?.name || selectedCustomer?.["Contact Name"] || 'Guest'
        }
      };
      
      const result = await paymentsApi.createRazorpayOrder(orderData);
      
      if (result.success) {
        // Open Razorpay checkout
        const options = {
          key: result.key_id,
          amount: result.amount * 100, // Convert to paise
          currency: result.currency,
          name: "MINAKI",
          description: `Payment for Cart #${cartId}`,
          order_id: result.order_id,
          handler: async (response) => {
            // Payment successful
            await handlePaymentSuccess({
              paymentMethod: 'razorpay',
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              gateway: 'razorpay'
            });
          },
          prefill: {
            name: selectedCustomer?.name || selectedCustomer?.["Contact Name"] || '',
            email: selectedCustomer?.email || selectedCustomer?.Email || '',
            contact: selectedCustomer?.phone || selectedCustomer?.Phone || selectedCustomer?.MobilePhone || ''
          },
          theme: {
            color: "#3399cc"
          },
          modal: {
            ondismiss: () => {
              console.log("Payment cancelled by user");
              setProcessing(false);
            }
          }
        };
        
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        throw new Error(result.message || 'Failed to create Razorpay order');
      }
    } catch (error) {
      console.error('Error with Razorpay payment:', error);
      setPaymentError(error.message || 'Failed to process Razorpay payment. Please try again.');
      setProcessing(false);
    }
  };

  // Handle Pine Labs Payment
  const handlePineLabsPayment = async () => {
    try {
      setProcessing(true);
      setPaymentError(null);
      
      // Generate order reference
      const orderReference = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const orderData = {
        amount: total,
        currency: 'INR',
        order_reference: orderReference,
        customer_id: selectedCustomer?.id || selectedCustomer?.["Contact ID"] || null,
        customer_name: selectedCustomer?.name || selectedCustomer?.["Contact Name"] || 'Guest',
        customer_email: selectedCustomer?.email || selectedCustomer?.Email || '',
        customer_phone: selectedCustomer?.phone || selectedCustomer?.Phone || selectedCustomer?.MobilePhone || '',
        description: `Payment for Cart #${cartId}`
      };
      
      const result = await paymentsApi.createPineLabsOrder(orderData);
      
      if (result.success) {
        setPineLabsOrder(result);
        console.log('Pine Labs order created:', result);
        setProcessing(false); // Allow user to click "Complete Sale" after paying at terminal
      } else {
        throw new Error(result.message || 'Failed to create Pine Labs order');
      }
    } catch (error) {
      console.error('Error with Pine Labs payment:', error);
      setPaymentError(error.message || 'Failed to create Pine Labs order. Please try again.');
      setProcessing(false);
    }
  };

  // Record Pine Labs transaction by unique ID (from terminal receipt/display)
  const handleRecordPineLabsTransaction = async () => {
    const uniqueId = pineLabsUniqueId?.trim();
    if (!uniqueId) {
      setPaymentError('Please enter the unique transaction ID from the terminal.');
      return;
    }
    try {
      setRecordingTransaction(true);
      setPaymentError(null);
      const payload = {
        unique_id: uniqueId,
        order_reference: pineLabsOrder?.order_reference ?? undefined,
        amount: total,
      };
      const result = await paymentsApi.recordPineLabsTransaction(payload);
      if (result.success) {
        setTransactionRecorded(true);
        setPaymentError(null);
        console.log('Pine Labs transaction recorded:', result);
      } else {
        throw new Error(result.message || 'Failed to record transaction');
      }
    } catch (error) {
      console.error('Error recording Pine Labs transaction:', error);
      setPaymentError(error.message || 'Failed to record transaction. Please try again.');
    } finally {
      setRecordingTransaction(false);
    }
  };

  // Handle Payment Success (for Razorpay/Pine Labs)
  const handlePaymentSuccess = async (paymentDetails) => {
    try {
      setProcessing(true);
      setPaymentError(null);
      
      // Complete checkout with payment details
      const checkoutData = {
        cart_id: cartId,
        customer_id: selectedCustomer?.id || selectedCustomer?.["Contact ID"] || null,
        payments: [
          {
            payment_method: paymentDetails.gateway === 'razorpay' ? 'razorpay' : 'pinelabs',
            payment_amount: total,
            payment_id: paymentDetails.paymentId,
            order_id: paymentDetails.orderId,
            transaction_reference: paymentDetails.orderId || paymentDetails.paymentId
          }
        ],
        tax_rate_percent: 3.0,
        notes: null,
        sales_person: null
      };
      
      const result = await checkoutApi.completeSale(checkoutData);
      
      // Add payment details to result
      result.paymentDetails = paymentDetails;
      
      setCheckoutResult(result);
      
      // Auto-send invoice if preferences are enabled
      if (result.invoice_id && selectedCustomer && (autoSendPreferences.autoSendWhatsApp || autoSendPreferences.autoSendEmail)) {
        try {
          const autoSendResults = await autoSendInvoice(result.invoice_id, selectedCustomer, autoSendPreferences);
          result.autoSendResults = autoSendResults;
        } catch (autoSendError) {
          console.warn('⚠️ Auto-send failed:', autoSendError);
        }
      }
      
      setShowReceiptOptionsView(true);
      setProcessing(false);
      
    } catch (error) {
      console.error('Error completing checkout after payment:', error);
      setPaymentError(error.message || 'Payment was successful but checkout failed. Please contact support.');
      setProcessing(false);
    }
  };

  // Handle Razorpay Payment Link - create invoice, send link to customer (no modal)
  const handleSendRazorpayPaymentLink = async () => {
    const phone = selectedCustomer?.phone || selectedCustomer?.Phone || selectedCustomer?.MobilePhone || '';
    const email = selectedCustomer?.email || selectedCustomer?.Email || '';
    if (!phone || !email) {
      setPaymentError('Customer phone and email are required to send payment link.');
      return;
    }
    try {
      setProcessing(true);
      setPaymentError(null);
      // 1. Complete checkout with razorpay_link (creates invoice, unpaid)
      const checkoutData = {
        cart_id: cartId,
        customer_id: selectedCustomer?.id || selectedCustomer?.["Contact ID"] || null,
        payments: [{ payment_method: 'razorpay_link', payment_amount: total }],
        tax_rate_percent: 3.0,
        notes: null,
        sales_person: null,
      };
      const result = await checkoutApi.completeSale(checkoutData);
      if (!result?.invoice_id) throw new Error('Checkout failed - no invoice created');
      // 2. Create and send payment link to customer
      const linkData = {
        name: selectedCustomer?.name || selectedCustomer?.["Contact Name"] || 'Customer',
        phone: phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`,
        email,
        amount: total,
        invoice_id: result.invoice_id,
        currency: 'INR',
        send_whatsapp: true,
        send_email: true,
      };
      await paymentsApi.createAndSendRazorpayPaymentLink(linkData);
      setCheckoutResult(result);
      setShowReceiptOptionsView(true);
    } catch (error) {
      console.error('Error sending payment link:', error);
      setPaymentError(error.message || 'Failed to send payment link. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteSale = async () => {
    try {
      setProcessing(true);
      setPaymentError(null);

      // Razorpay Payment Link: send link to customer (no checkout modal)
      if (paymentMethod === 'razorpay_link') {
        await handleSendRazorpayPaymentLink();
        return;
      }

      // Card Terminal (Pine Labs): create order or complete with existing order
      if (paymentMethod === 'card_terminal') {
        if (pineLabsOrder) {
          await handlePaymentSuccess({
            paymentMethod: 'card_terminal',
            paymentId: pineLabsOrder.order_id,
            orderId: pineLabsOrder.order_id,
            transaction_reference: pineLabsOrder.order_reference,
            gateway: 'pinelabs',
          });
          return;
        }
        await handlePineLabsPayment();
        return;
      }

      // For UPI, complete checkout immediately (payment processed externally)
      // For cash, complete checkout with cash payment
      // Debug: Log selected customer to see what fields are available
      console.log('Selected customer for checkout:', selectedCustomer);

      const checkoutData = {
        cart_id: cartId,
        customer_id: selectedCustomer?.id || selectedCustomer?.["Contact ID"] || null,
        payments: [
          {
            payment_method: paymentMethod,
            payment_amount: paymentMethod === 'cash' ? parseFloat(cashAmount) : total
          }
        ],
        tax_rate_percent: 3.0, // Default tax rate - you might want to make this configurable
        notes: null,
        sales_person: null // You might want to add sales person tracking
      };

      // Debug: Log checkout data to see what's being sent
      console.log('Checkout data being sent:', checkoutData);

      const result = await checkoutApi.completeSale(checkoutData);

      console.log('✅ Checkout completed successfully:', result);
      console.log('✅ Checkout result structure:', {
        hasInvoiceId: !!result.invoice_id,
        hasInvoiceNumber: !!result.invoice_number,
        hasTotalAmount: !!result.total_amount,
        invoiceId: result.invoice_id,
        invoiceNumber: result.invoice_number,
        totalAmount: result.total_amount,
        allKeys: Object.keys(result || {})
      });

      // Store the result for the success modal
      setCheckoutResult(result);

      // Auto-send invoice if preferences are enabled
      if (result.invoice_id && selectedCustomer && (autoSendPreferences.autoSendWhatsApp || autoSendPreferences.autoSendEmail)) {
        try {
          const autoSendResults = await autoSendInvoice(result.invoice_id, selectedCustomer, autoSendPreferences);
          console.log('🤖 Auto-send results:', autoSendResults);
          
          // Add auto-send results to the checkout result for display
          result.autoSendResults = autoSendResults;
        } catch (autoSendError) {
          console.warn('⚠️ Auto-send failed:', autoSendError);
          // Don't fail the checkout if auto-send fails
        }
      }

      // Show "Payment approved" receipt options first, then invoice share
      setShowReceiptOptionsView(true);

      // DON'T clear cart immediately - wait for user to finish with invoice
      // await clearCart();
      // console.log('🛒 Cart cleared after successful checkout, ready for next transaction');
      
    } catch (error) {
      console.error('Checkout error:', error);
      setPaymentError(error.message || 'Failed to complete sale. Please try again.');
      // Show error to user but don't force navigation
    } finally {
      setProcessing(false);
    }
  };

  const isValidPayment = () => {
    if (paymentMethod === 'cash') {
      return cashAmount && parseFloat(cashAmount) >= total;
    }
    if (paymentMethod === 'upi') {
      return true;
    }
    if (paymentMethod === 'razorpay_link') {
      const phone = selectedCustomer?.phone || selectedCustomer?.Phone || selectedCustomer?.MobilePhone;
      const email = selectedCustomer?.email || selectedCustomer?.Email;
      return !!selectedCustomer && !!phone && !!email;
    }
    if (paymentMethod === 'card_terminal') {
      return true;
    }
    return true;
  };

  const getCompleteSaleButtonText = () => {
    if (processing) return 'Processing...';
    if (paymentMethod === 'razorpay_link') {
      return 'Send Payment Link to Customer';
    }
    if (paymentMethod === 'card_terminal' && !pineLabsOrder) {
      return 'Create Pine Labs Order';
    }
    return 'Complete Sale';
  };

  const paymentMethodLabels = {
    cash: 'Cash',
    upi: 'UPI',
    razorpay_link: 'Razorpay (Send Link)',
    card_terminal: 'Card Terminal',
  };

  const handleReceiptOptionsDone = () => {
    setShowReceiptOptionsView(false);
    setShowSuccessModal(true);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setCheckoutResult(null);
    // Don't auto-navigate - let user stay where they are
  };

  const handleNewTransaction = async () => {
    // Clear cart and reset state for new transaction
    await clearCart();
    console.log('🛒 Cart cleared for new transaction');
    setShowSuccessModal(false);
    setCheckoutResult(null);
    clearSelection();
    navigate('/catalog');
  };

  const handleViewInvoices = async () => {
    // Clear cart since we're moving to invoices
    await clearCart();
    console.log('🛒 Cart cleared before viewing invoices');
    setShowSuccessModal(false);
    navigate('/invoices');
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
              <div className="customer-selected customer-selected-full">
                <div className="customer-selected-header">
                  <User size={40} />
                  <div className="customer-selected-main">
                    <div className="customer-name">
                      {selectedCustomer.name ||
                       selectedCustomer["Contact Name"] ||
                       selectedCustomer["Display Name"] ||
                       selectedCustomer["Company Name"] ||
                       "Unknown Customer"}
                    </div>
                    <button className="btn-link" onClick={clearSelection}>
                      Change
                    </button>
                  </div>
                </div>
                <div className="customer-details-grid">
                  {(selectedCustomer.phone || selectedCustomer.Phone || selectedCustomer.MobilePhone) && (
                    <div className="customer-detail-row">
                      <span className="customer-detail-label">Phone</span>
                      <span className="customer-detail-value">
                        {selectedCustomer.phone || selectedCustomer.Phone || selectedCustomer.MobilePhone}
                      </span>
                    </div>
                  )}
                  {(selectedCustomer.email || selectedCustomer.Email || selectedCustomer.EmailID) && (
                    <div className="customer-detail-row">
                      <span className="customer-detail-label">Email</span>
                      <span className="customer-detail-value">
                        {selectedCustomer.email || selectedCustomer.Email || selectedCustomer.EmailID}
                      </span>
                    </div>
                  )}
                  {(selectedCustomer.address || selectedCustomer.Address || selectedCustomer["Billing Address"]) && (
                    <div className="customer-detail-row">
                      <span className="customer-detail-label">Address</span>
                      <span className="customer-detail-value">
                        {selectedCustomer.address || selectedCustomer.Address || selectedCustomer["Billing Address"]}
                      </span>
                    </div>
                  )}
                  {(selectedCustomer.city || selectedCustomer.City) && (
                    <div className="customer-detail-row">
                      <span className="customer-detail-label">City</span>
                      <span className="customer-detail-value">
                        {selectedCustomer.city || selectedCustomer.City}
                      </span>
                    </div>
                  )}
                  {(selectedCustomer.state || selectedCustomer.State) && (
                    <div className="customer-detail-row">
                      <span className="customer-detail-label">State</span>
                      <span className="customer-detail-value">
                        {selectedCustomer.state || selectedCustomer.State}
                      </span>
                    </div>
                  )}
                  {(selectedCustomer.postal_code || selectedCustomer["Postal Code"] || selectedCustomer.pincode) && (
                    <div className="customer-detail-row">
                      <span className="customer-detail-label">Postal Code</span>
                      <span className="customer-detail-value">
                        {selectedCustomer.postal_code || selectedCustomer["Postal Code"] || selectedCustomer.pincode}
                      </span>
                    </div>
                  )}
                  {(selectedCustomer.gstin || selectedCustomer.GSTIN || selectedCustomer["GSTIN"]) && (
                    <div className="customer-detail-row">
                      <span className="customer-detail-label">GSTIN</span>
                      <span className="customer-detail-value">
                        {selectedCustomer.gstin || selectedCustomer.GSTIN || selectedCustomer["GSTIN"]}
                      </span>
                    </div>
                  )}
                  {(selectedCustomer.customer_type || selectedCustomer["Customer Type"]) && (
                    <div className="customer-detail-row">
                      <span className="customer-detail-label">Customer Type</span>
                      <span className="customer-detail-value">
                        {selectedCustomer.customer_type || selectedCustomer["Customer Type"]}
                      </span>
                    </div>
                  )}
                  <div className="customer-detail-row">
                    <span className="customer-detail-label">Loyalty Points</span>
                    <span className="customer-detail-value">
                      {selectedCustomer.loyalty_points ?? selectedCustomer["Loyalty Points"] ?? 0}
                    </span>
                  </div>
                  {(selectedCustomer.total_spent != null || selectedCustomer["Total Spent"] != null) && (
                    <div className="customer-detail-row">
                      <span className="customer-detail-label">Total Spent</span>
                      <span className="customer-detail-value">
                        ₹{(selectedCustomer.total_spent ?? selectedCustomer["Total Spent"] ?? 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  {(selectedCustomer["Customer Number"] || selectedCustomer.customer_number) && (
                    <div className="customer-detail-row">
                      <span className="customer-detail-label">Customer #</span>
                      <span className="customer-detail-value">
                        {selectedCustomer["Customer Number"] || selectedCustomer.customer_number}
                      </span>
                    </div>
                  )}
                </div>
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
              {['cash', 'upi', 'razorpay_link', 'card_terminal'].map((method) => (
                <button
                  key={method}
                  className={`payment-method ${paymentMethod === method ? 'active' : ''}`}
                  onClick={() => setPaymentMethod(method)}
                >
                  <CreditCard size={24} />
                  <span>{paymentMethodLabels[method] || method}</span>
                </button>
              ))}
            </div>

            {/* Cash Payment Details */}
            {paymentMethod === 'cash' && (
              <div className="payment-details">
                <CurrencyBreakdown
                  totalAmount={total}
                  onAmountChange={(amount) => setCashAmount(amount.toString())}
                  initialAmount={cashAmount}
                />
              </div>
            )}

            {/* Razorpay Payment Link Details */}
            {paymentMethod === 'razorpay_link' && (
              <div className="payment-details">
                <div className="payment-gateway-info">
                  <p style={{ marginBottom: '15px' }}>Send a payment link (rzp.io) to the customer&apos;s phone and email. They can pay on their device.</p>
                </div>
              </div>
            )}

            {/* Card Terminal (Pine Labs) Payment Details */}
            {paymentMethod === 'card_terminal' && (
              <div className="payment-details">
                <div className="payment-gateway-info">
                  {!pineLabsOrder ? (
                    <div>
                      <p style={{ marginBottom: '15px' }}>Create a Pine Labs order for the card terminal. Click &quot;Create Pine Labs Order&quot; to generate the order reference.</p>
                      <p style={{ fontSize: '0.9em', color: '#666' }}>After payment at the terminal, enter the unique transaction ID from the terminal receipt below to record it.</p>
                    </div>
                  ) : (
                    <>
                      <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '8px', marginBottom: '15px' }}>
                        <p><strong>Order Reference:</strong> {pineLabsOrder.order_reference}</p>
                        <p><strong>Amount:</strong> ₹{total.toLocaleString()}</p>
                        <p><strong>Status:</strong> {pineLabsOrder.status || 'Pending'}</p>
                        <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
                          Pay at the card terminal. You can enter the unique transaction ID from the terminal receipt below to record the payment.
                        </p>
                      </div>
                      <div style={{ marginTop: '15px' }}>
                        <label className="input-label">Unique Transaction ID (from terminal)</label>
                        <p style={{ fontSize: '0.85em', color: '#666', marginBottom: '8px' }}>
                          Enter the unique transaction ID from the terminal receipt or display (Pine Labs ID).
                        </p>
                        <input
                          type="text"
                          value={pineLabsUniqueId}
                          onChange={(e) => setPineLabsUniqueId(e.target.value)}
                          placeholder="e.g. TXN123456"
                          disabled={transactionRecorded}
                          style={{ width: '100%', maxWidth: '280px', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={handleRecordPineLabsTransaction}
                          disabled={recordingTransaction || transactionRecorded || !pineLabsUniqueId?.trim()}
                        >
                          {recordingTransaction ? 'Recording...' : transactionRecorded ? 'Recorded' : 'Record Transaction'}
                        </button>
                        {transactionRecorded && (
                          <div style={{ padding: '10px', background: '#e8f5e9', borderRadius: '4px', marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle size={16} color="#2e7d32" />
                            <span style={{ fontSize: '0.9em' }}>Transaction recorded successfully.</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* UPI Payment Details */}
            {paymentMethod === 'upi' && (
              <div className="payment-details">
                {!upiQRCode ? (
                  <div>
                    <p style={{ marginBottom: '15px' }}>Generate a UPI QR code for customer to scan and pay.</p>
                    <button 
                      className="btn-secondary"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          handleGenerateUPIQR();
                        } catch (error) {
                          console.error('Unexpected error in QR generation:', error);
                          setPaymentError('An unexpected error occurred. Please try again.');
                        }
                      }}
                      disabled={generatingQR || !total || total <= 0}
                    >
                      <QrCode size={18} style={{ marginRight: '8px', display: 'inline' }} />
                      {generatingQR ? 'Generating...' : 'Generate QR Code'}
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ marginBottom: '15px', fontWeight: '500' }}>Scan QR Code to Pay</p>
                    {upiQRCode?.qr_code_base64 ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                          <img 
                            src={`data:image/png;base64,${upiQRCode.qr_code_base64}`}
                            alt="UPI QR Code"
                            style={{ maxWidth: '250px', maxHeight: '250px', border: '1px solid #ddd', borderRadius: '8px' }}
                            onError={(e) => {
                              console.error('Failed to load QR code image');
                              setPaymentError('Failed to display QR code image. Please try generating again.');
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                        <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
                          Amount: ₹{(total || 0).toLocaleString('en-IN')}
                        </p>
                      </>
                    ) : (
                      <p style={{ color: '#c00', marginBottom: '15px' }}>
                        QR code data is missing. Please generate again.
                      </p>
                    )}
                    <button 
                      className="btn-link"
                      onClick={() => {
                        setUpiQRCode(null);
                        setPaymentError(null);
                      }}
                    >
                      Generate New QR Code
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Error Display */}
            {paymentError && (
              <div style={{ 
                padding: '12px', 
                background: '#fee', 
                border: '1px solid #fcc', 
                borderRadius: '4px', 
                marginTop: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={18} color="#c00" />
                <span style={{ color: '#c00', fontSize: '0.9em' }}>{paymentError}</span>
                <button
                  onClick={() => setPaymentError(null)}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={16} />
                </button>
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
            {getCompleteSaleButtonText()}
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

      {/* Payment approved / Receipt options (shown first after payment) */}
      <PaymentApprovedReceiptOptions
        isOpen={showReceiptOptionsView}
        onDone={handleReceiptOptionsDone}
        invoiceId={checkoutResult?.invoice_id}
        customerData={selectedCustomer}
      />

      {/* Checkout Success Modal (invoice share - shown after receipt options) */}
      <CheckoutSuccess
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        onNewTransaction={handleNewTransaction}
        onViewInvoices={handleViewInvoices}
        invoiceData={checkoutResult}
        customerData={selectedCustomer}
      />
    </div>
  );
};