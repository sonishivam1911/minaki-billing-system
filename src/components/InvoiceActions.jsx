import React, { useState } from 'react';
import { Download, Send, Mail, MoreHorizontal, Eye } from 'lucide-react';
import { invoicesApi } from '../services/api';

/**
 * InvoiceActions Component
 * Reusable component for invoice actions (download, send via WhatsApp/Email)
 */
export const InvoiceActions = ({ 
  invoice,
  customer = {},
  compact = false,
  showViewButton = false,
  onView = null 
}) => {
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendType, setSendType] = useState('whatsapp');

  const invoiceId = invoice?.id || invoice?.invoice_id;
  const invoiceNumber = invoice?.invoice_number || invoice?.number;

  const handleDownloadPDF = async () => {
    if (!invoiceId) {
      alert('❌ Invoice ID not available');
      return;
    }

    try {
      setLoading(true);
      await invoicesApi.downloadPDF(invoiceId);
    } catch (error) {
      console.error('Download error:', error);
      alert(`❌ Failed to download: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = (type) => {
    setSendType(type);
    setShowSendModal(true);
    setShowDropdown(false);
  };

  const handleView = () => {
    if (onView) {
      onView(invoice);
    } else {
      // Default behavior - could open invoice details modal
      console.log('View invoice:', invoiceId);
    }
    setShowDropdown(false);
  };

  if (compact) {
    return (
      <div className="invoice-actions-compact">
        <button
          className="btn-icon"
          onClick={handleDownloadPDF}
          disabled={loading || !invoiceId}
          title="Download PDF"
        >
          <Download size={16} />
        </button>

        <div className="dropdown-container">
          <button
            className="btn-icon"
            onClick={() => setShowDropdown(!showDropdown)}
            title="More actions"
          >
            <MoreHorizontal size={16} />
          </button>

          {showDropdown && (
            <div className="dropdown-menu">
              {showViewButton && (
                <button className="dropdown-item" onClick={handleView}>
                  <Eye size={16} />
                  View Details
                </button>
              )}
              <button 
                className="dropdown-item" 
                onClick={() => handleSendInvoice('whatsapp')}
                disabled={!invoiceId}
              >
                <Send size={16} />
                Send to WhatsApp
              </button>
              <button 
                className="dropdown-item" 
                onClick={() => handleSendInvoice('email')}
                disabled={!invoiceId}
              >
                <Mail size={16} />
                Email Invoice
              </button>
            </div>
          )}
        </div>

        {/* Send Modal */}
        {showSendModal && (
          <SendInvoiceModal
            isOpen={showSendModal}
            onClose={() => setShowSendModal(false)}
            invoiceId={invoiceId}
            invoiceNumber={invoiceNumber}
            sendType={sendType}
            customerData={customer}
          />
        )}
      </div>
    );
  }

  return (
    <div className="invoice-actions">
      <button
        className="btn-primary"
        onClick={handleDownloadPDF}
        disabled={loading || !invoiceId}
      >
        <Download size={18} />
        {loading ? 'Downloading...' : 'Download PDF'}
      </button>

      <button
        className="btn-secondary"
        onClick={() => handleSendInvoice('whatsapp')}
        disabled={!invoiceId}
      >
        <Send size={18} />
        Send to WhatsApp
      </button>

      <button
        className="btn-secondary"
        onClick={() => handleSendInvoice('email')}
        disabled={!invoiceId}
      >
        <Mail size={18} />
        Email Invoice
      </button>

      {showViewButton && (
        <button className="btn-outline" onClick={handleView}>
          <Eye size={18} />
          View Details
        </button>
      )}

      {/* Send Modal */}
      {showSendModal && (
        <SendInvoiceModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          invoiceId={invoiceId}
          invoiceNumber={invoiceNumber}
          sendType={sendType}
          customerData={customer}
        />
      )}
    </div>
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
  invoiceNumber,
  sendType, 
  customerData = {} 
}) => {
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(customerData.phone || '');
  const [email, setEmail] = useState(customerData.email || '');
  const [subject, setSubject] = useState(`Invoice ${invoiceNumber || invoiceId}`);
  const [message, setMessage] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!invoiceId) {
      alert('❌ Invoice ID not available');
      return;
    }

    try {
      setLoading(true);
      let result;

      if (sendType === 'whatsapp') {
        if (!phoneNumber.trim()) {
          alert('❌ Please enter a phone number');
          return;
        }
        result = await invoicesApi.sendWhatsApp(
          invoiceId, 
          phoneNumber.trim(), 
          message.trim() || null
        );
      } else {
        if (!email.trim()) {
          alert('❌ Please enter an email address');
          return;
        }
        result = await invoicesApi.sendEmail(
          invoiceId, 
          email.trim(), 
          subject.trim() || null, 
          message.trim() || null
        );
      }

      if (result.success) {
        alert(`✅ Invoice sent via ${sendType} successfully!`);
        onClose();
      } else {
        alert(`❌ Failed to send: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Send error:', error);
      alert(`❌ Failed to send: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content send-invoice-modal">
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
          <p className="modal-subtitle">
            Invoice: {invoiceNumber || invoiceId}
          </p>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSend}>
          <div className="modal-body">
            {sendType === 'whatsapp' ? (
              <div className="form-group">
                <label className="form-label">
                  WhatsApp Number (with country code)
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+91 9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
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
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Invoice for your purchase"
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
                placeholder="Add a personal message..."
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