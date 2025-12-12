import React, { useState, useEffect } from 'react';
import { CheckCircle, Download, Send, Mail, X, Phone } from 'lucide-react';
import { invoicesApi } from '../services/api';

/**
 * CheckoutSuccess Component
 * Shows success message after checkout completion with invoice actions
 */
export const CheckoutSuccess = ({ 
  isOpen, 
  onClose, 
  onNewTransaction,
  onViewInvoices,
  invoiceData = {},
  customerData = {} 
}) => {
  const [loading, setLoading] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendType, setSendType] = useState('whatsapp'); // 'whatsapp' or 'email'

  const {
    invoice_id,
    invoice_number,
    total_amount,
    status = 'Paid'
  } = invoiceData || {};

  // Debug: Log invoice data to see what we're receiving
  React.useEffect(() => {
    if (isOpen) {
      console.log('🎉 CheckoutSuccess - Invoice Data:', invoiceData);
      console.log('🎉 CheckoutSuccess - Customer Data:', customerData);
      console.log('🎉 CheckoutSuccess - Parsed Fields:', {
        invoice_id,
        invoice_number,
        total_amount,
        status
      });
    }
  }, [isOpen, invoiceData, customerData, invoice_id, invoice_number, total_amount, status]);

  // Prevent modal from closing with Escape key
  React.useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          console.log('🚫 Escape key blocked - user must choose an action');
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleDownloadPDF = async () => {
    if (!invoice_id) {
      alert('❌ Invoice ID not available');
      return;
    }

    try {
      setLoading(true);
      await invoicesApi.downloadPDF(invoice_id);
    } catch (error) {
      console.error('Download error:', error);
      alert(`❌ Failed to download: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = (type) => {
    console.log('�🚨 HandleSendInvoice called with type:', type);
    console.log('�🚨 Current showSendModal state:', showSendModal);
    console.log('🚨🚨 Available data:', {
      invoice_id,
      customerData,
      customerPhone: customerData.phone || customerData.Phone || customerData.MobilePhone,
      customerEmail: customerData.email || customerData.Email
    });
    
    console.log('🚨🚨 Setting sendType to:', type);
    setSendType(type);
    
    console.log('🚨🚨 Setting showSendModal to true');
    setShowSendModal(true);
    
    console.log('�🚨 Send modal should now be open with type:', type);
    
    // Force a re-render to debug
    setTimeout(() => {
      console.log('🚨🚨 After timeout - showSendModal:', showSendModal, 'sendType:', sendType);
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="modal-overlay" 
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
          backdropFilter: 'blur(4px)',
          zIndex: 9999
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="modal-content checkout-success-modal" 
          style={{
            maxWidth: '500px',  // Reduced from 600px
            minHeight: '300px', // Reduced from 400px
            border: '3px solid #22c55e',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            maxHeight: '90vh',  // Limit height to viewport
            overflowY: 'auto'   // Allow scrolling if needed
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <CheckCircle size={48} className="text-green-500" />
            <div style={{textAlign: 'center', marginTop: '10px'}}>
              <strong style={{color: '#22c55e', fontSize: '14px'}}>
                🎉 TRANSACTION COMPLETE 🎉
              </strong>
            </div>
            
            {/* Add close button for easy access */}
            <button 
              className="modal-close-btn"
              onClick={onNewTransaction || onClose}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
              title="Back to Catalog"
            >
              ✕
            </button>
          </div>

          <div className="success-content">
            <h2 className="success-title">✅ Payment Successful!</h2>
            
            <div className="invoice-summary">
              <h3>Invoice #{invoice_number || invoice_id || 'N/A'}</h3>
              <p className="amount">Total: ₹{total_amount?.toLocaleString() || '0'}</p>
              <p className="status">Status: {status}</p>
              {invoice_id && (
                <div className="invoice-details">
                  <p><strong>Invoice ID:</strong> {invoice_id}</p>
                  <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {customerData && (customerData.name || customerData["Contact Name"] || customerData["Display Name"]) && (
              <div className="customer-info">
                <p><strong>Customer:</strong> {
                  customerData.name || 
                  customerData["Contact Name"] || 
                  customerData["Display Name"] || 
                  customerData["Company Name"] || 
                  "Unknown Customer"
                }</p>
                {(customerData.phone || customerData.Phone || customerData.MobilePhone) && (
                  <p><strong>Phone:</strong> {customerData.phone || customerData.Phone || customerData.MobilePhone}</p>
                )}
                {(customerData.email || customerData.Email) && (
                  <p><strong>Email:</strong> {customerData.email || customerData.Email}</p>
                )}
              </div>
            )}

            <div className="invoice-actions">
              {!invoice_id && (
                <div className="warning-message" style={{background: '#fff3cd', border: '1px solid #ffeaa7', padding: '10px', marginBottom: '15px', borderRadius: '4px'}}>
                  ⚠️ <strong>Warning:</strong> Invoice ID not found in checkout response. Some actions may be unavailable.
                </div>
              )}
              
              <button 
                className="btn-primary"
                onClick={handleDownloadPDF}
                disabled={loading || !invoice_id}
              >
                <Download size={18} />
                {loading ? 'Downloading...' : 'Download PDF'}
              </button>

              <button 
                className="btn-secondary"
                onClick={async (e) => {
                  console.log('🚨 WhatsApp button clicked!', { 
                    hasInvoiceId: !!invoice_id, 
                    invoiceId: invoice_id,
                    event: e 
                  });
                  
                  if (!invoice_id) {
                    console.log('🚨 No invoice_id, showing alert');
                    alert('❌ Invoice ID not available. Cannot send WhatsApp message.');
                    return;
                  }
                  
                  // Get phone number from customer data
                  const phone = customerData.phone || customerData.Phone || customerData.MobilePhone;
                  
                  if (!phone) {
                    console.log('🚨 No phone number, opening modal');
                    handleSendInvoice('whatsapp');
                    return;
                  }
                  
                  // Direct send if phone number is available
                  try {
                    console.log('🚨 DIRECT SEND - Sending WhatsApp to:', phone);
                    
                    // Format phone number
                    let formattedPhone = phone.trim();
                    if (!formattedPhone.startsWith('+')) {
                      if (formattedPhone.startsWith('91')) {
                        formattedPhone = '+' + formattedPhone;
                      } else if (formattedPhone.length === 10) {
                        formattedPhone = '+91' + formattedPhone;
                      } else {
                        formattedPhone = '+91' + formattedPhone;
                      }
                    }
                    
                    console.log('📱 CALLING API - sendWhatsApp with:', {
                      invoiceId: invoice_id,
                      phone: formattedPhone
                    });
                    
                    const result = await invoicesApi.sendWhatsApp(invoice_id, formattedPhone);
                    
                    console.log('📱 API RESULT:', result);
                    alert('✅ WhatsApp message sent successfully!');
                    
                  } catch (error) {
                    console.error('� DIRECT SEND ERROR:', error);
                    alert(`❌ Failed to send WhatsApp: ${error.message}`);
                    // Fallback to modal
                    handleSendInvoice('whatsapp');
                  }
                }}
                disabled={!invoice_id}
                title={!invoice_id ? 'Invoice ID required for WhatsApp' : 'Send invoice via WhatsApp'}
              >
                <Send size={18} />
                Send to WhatsApp
              </button>

              <button 
                className="btn-secondary"
                onClick={async (e) => {
                  console.log('🚨 Email button clicked!', { 
                    hasInvoiceId: !!invoice_id, 
                    invoiceId: invoice_id,
                    event: e 
                  });
                  
                  if (!invoice_id) {
                    console.log('🚨 No invoice_id, showing alert');
                    alert('❌ Invoice ID not available. Cannot send email.');
                    return;
                  }
                  
                  // Get email from customer data
                  const email = customerData.email || customerData.Email;
                  
                  if (!email) {
                    console.log('🚨 No email address, opening modal');
                    handleSendInvoice('email');
                    return;
                  }
                  
                  // Direct send if email is available
                  try {
                    console.log('🚨 DIRECT SEND - Sending Email to:', email);
                    
                    console.log('📧 CALLING API - sendEmail with:', {
                      invoiceId: invoice_id,
                      email: email.trim(),
                      subject: 'Invoice from Minaki Billing System'
                    });
                    
                    const result = await invoicesApi.sendEmail(
                      invoice_id, 
                      email.trim(), 
                      'Invoice from Minaki Billing System'
                    );
                    
                    console.log('📧 API RESULT:', result);
                    alert('✅ Email sent successfully!');
                    
                  } catch (error) {
                    console.error('� DIRECT SEND ERROR:', error);
                    alert(`❌ Failed to send email: ${error.message}`);
                    // Fallback to modal
                    handleSendInvoice('email');
                  }
                }}
                disabled={!invoice_id}
                title={!invoice_id ? 'Invoice ID required for email' : 'Send invoice via email'}
              >
                <Mail size={18} />
                Email Invoice
              </button>
            </div>

            <div className="modal-actions">
              {/* Prominent Back to Catalog Button */}
              <button 
                className="btn-primary btn-full" 
                onClick={onNewTransaction || onClose}
                style={{
                  backgroundColor: '#22c55e',
                  color: 'white',
                  fontSize: '16px',
                  padding: '12px 24px',
                  marginBottom: '15px'
                }}
              >
                🛒 Back to Catalog - Start New Sale
              </button>
              
              {/* Secondary Actions */}
              <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                {onViewInvoices && (
                  <button className="btn-secondary" onClick={onViewInvoices} style={{flex: 1}}>
                    📄 View Invoices
                  </button>
                )}
                <button className="btn-outline" onClick={onClose} style={{flex: 1}}>
                  ⏸️ Keep Open
                </button>
              </div>
              
              <div style={{textAlign: 'center', fontSize: '12px', color: '#64748b'}}>
                💡 Invoice saved successfully! Choose your next action above.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send Invoice Modal */}
      {console.log('🚨🚨 Main modal render check - showSendModal:', showSendModal)}
      {showSendModal && (
        <SendInvoiceModal
          isOpen={showSendModal}
          onClose={() => {
            console.log('🚨🚨 SendInvoiceModal onClose called');
            setShowSendModal(false);
          }}
          invoiceId={invoice_id}
          sendType={sendType}
          customerData={customerData}
        />
      )}
    </>
  );
};

/**
 * SendInvoiceModal Component
 * Modal for sending invoice via WhatsApp or Email
 */
const SendInvoiceModal = ({ 
  isOpen, 
  onClose, 
  invoiceId, 
  sendType, 
  customerData = {} 
}) => {
  const [loading, setLoading] = useState(false);
  
  // Better customer data extraction with multiple fallbacks
  const customerPhone = customerData.phone || customerData.Phone || customerData.MobilePhone || '';
  const customerEmail = customerData.email || customerData.Email || '';
  
  const [phoneNumber, setPhoneNumber] = useState(customerPhone);
  const [email, setEmail] = useState(customerEmail);
  const [subject, setSubject] = useState('Invoice from Minaki Billing System');
  const [message, setMessage] = useState('');

  // Update state when customer data changes
  React.useEffect(() => {
    setPhoneNumber(customerPhone);
    setEmail(customerEmail);
  }, [customerPhone, customerEmail]);

  // Debug log
  React.useEffect(() => {
    console.log('📱 SendInvoiceModal - Debug Info:', {
      sendType,
      invoiceId,
      customerData,
      extractedPhone: customerPhone,
      extractedEmail: customerEmail,
      currentPhoneState: phoneNumber,
      currentEmailState: email
    });
  }, [sendType, invoiceId, customerData, customerPhone, customerEmail, phoneNumber, email]);

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!invoiceId) {
      alert('❌ Invoice ID not available');
      return;
    }

    try {
      setLoading(true);
      let result;

      console.log(`📤 Attempting to send invoice ${invoiceId} via ${sendType}`);

      if (sendType === 'whatsapp') {
        if (!phoneNumber.trim()) {
          alert('❌ Please enter a phone number');
          return;
        }
        
        // Format phone number - ensure it has country code
        let formattedPhone = phoneNumber.trim();
        if (!formattedPhone.startsWith('+')) {
          // If no country code, assume India (+91)
          if (formattedPhone.startsWith('91')) {
            formattedPhone = '+' + formattedPhone;
          } else if (formattedPhone.length === 10) {
            formattedPhone = '+91' + formattedPhone;
          } else {
            formattedPhone = '+91' + formattedPhone;
          }
        }
        
        console.log('📱 Sending WhatsApp to:', formattedPhone, 'Original:', phoneNumber.trim());
        result = await invoicesApi.sendWhatsApp(
          invoiceId, 
          formattedPhone, 
          message.trim() || null
        );
      } else if (sendType === 'email') {
        if (!email.trim()) {
          alert('❌ Please enter an email address');
          return;
        }
        
        console.log('📧 Sending Email to:', email.trim());
        result = await invoicesApi.sendEmail(
          invoiceId, 
          email.trim(), 
          subject.trim() || null, 
          message.trim() || null
        );
      }

      console.log(`📤 Send ${sendType} result:`, result);

      // Handle different response formats
      if (result && (result.success === true || result.status === 'success' || result.message)) {
        alert(`✅ Invoice sent via ${sendType.toUpperCase()} successfully!`);
        onClose();
      } else if (result && result.error) {
        alert(`❌ Failed to send: ${result.error}`);
      } else {
        // If no clear success/error indication, assume it worked if no exception was thrown
        alert(`✅ Invoice sent via ${sendType.toUpperCase()}!`);
        onClose();
      }
    } catch (error) {
      console.error(`📤 Send ${sendType} error:`, error);
      alert(`❌ Failed to send: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    console.log('🚨🚨 SendInvoiceModal - NOT OPEN, returning null. isOpen:', isOpen);
    return null;
  }

  console.log('🚨🚨 SendInvoiceModal - IS OPEN, rendering modal for sendType:', sendType);

  return (
    <div 
      className="modal-overlay" 
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.9)', 
        backdropFilter: 'blur(4px)',
        zIndex: 99999,  // Higher z-index to ensure it's on top
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div 
        className="modal-content send-invoice-modal"
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          border: '2px solid #3b82f6',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          zIndex: 100000
        }}
      >
        <div className="modal-header">
          <h3>
            {sendType === 'whatsapp' ? (
              <>
                <Send size={20} />
                Send to WhatsApp
              </>
            ) : (
              <>
                <Mail size={20} />
                Email Invoice
              </>
            )}
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSend}>
          <div className="modal-body">
            {sendType === 'whatsapp' ? (
              <div className="form-group">
                <label className="form-label">
                  <Phone size={16} />
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+91 9876543210 or 9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
                <small style={{color: '#64748b', fontSize: '12px'}}>
                  💡 Will automatically add +91 if no country code provided
                </small>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">
                    <Mail size={16} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="customer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Invoice from Minaki Billing System"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Custom Message (Optional)</label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder={sendType === 'whatsapp' 
                  ? "Hi! Please find your invoice attached. Thank you for your purchase!" 
                  : "Dear Customer, Please find your invoice attached. Thank you for your business!"
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Sending...' : `Send Invoice`}
            </button>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};