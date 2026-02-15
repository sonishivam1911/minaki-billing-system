import React, { useState, useEffect } from 'react';
import { ShoppingBag, Mail, Smartphone, Printer, Download } from 'lucide-react';
import { invoicesApi } from '../services/api';

/**
 * Masks email for display: first char + *** + last char before @ + @domain
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const trimmed = email.trim();
  const at = trimmed.indexOf('@');
  if (at <= 0) return trimmed;
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at);
  if (local.length <= 2) return local[0] + '***' + domain;
  return local[0] + '***' + local[local.length - 1] + domain;
}

/**
 * Masks phone for display: ***XXXX (last 4 digits)
 */
function maskPhone(phone) {
  if (!phone) return '';
  const s = String(phone).replace(/\D/g, '');
  if (s.length < 4) return '***';
  return '***' + s.slice(-4);
}

/**
 * PaymentApprovedReceiptOptions
 * Shown immediately after payment is recorded. Matches the "Payment approved" / Receipt options design.
 * On "Send receipt" or "I don't want a receipt", calls onDone() so the app can show invoice sharing.
 */
export const PaymentApprovedReceiptOptions = ({
  isOpen,
  onDone,
  invoiceId,
  customerData = {},
}) => {
  const email = customerData?.email || customerData?.Email || '';
  const phone = customerData?.phone || customerData?.Phone || customerData?.MobilePhone || '';
  const maskedEmail = maskEmail(email);
  const maskedPhone = maskPhone(phone);

  // Default: if user has email → email, else if number → text (WhatsApp), else → download
  const getDefaultChannels = () => {
    const hasEmail = !!email?.trim();
    const hasPhone = !!phone?.trim();
    return {
      shopApp: false,
      email: hasEmail,
      text: !hasEmail && hasPhone,
      download: !hasEmail && !hasPhone,
      print: false,
    };
  };

  const [selectedChannels, setSelectedChannels] = useState(getDefaultChannels);
  const [signUpForOffers, setSignUpForOffers] = useState(true);
  const [sending, setSending] = useState(false);

  // Reset default selection when modal opens or customer data changes (email else phone else download)
  useEffect(() => {
    if (isOpen) {
      const hasEmail = !!email?.trim();
      const hasPhone = !!phone?.trim();
      setSelectedChannels({
        shopApp: false,
        email: hasEmail,
        text: !hasEmail && hasPhone,
        download: !hasEmail && !hasPhone,
        print: false,
      });
    }
  }, [isOpen, email, phone]);

  const toggleChannel = (key) => {
    setSelectedChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSendReceipt = async () => {
    setSending(true);
    try {
      if (invoiceId) {
        if (selectedChannels.email && email?.trim()) {
          await invoicesApi.sendEmail(invoiceId, email.trim(), 'Your receipt from MINAKI', null);
        }
        if (selectedChannels.text && phone) {
          let formattedPhone = String(phone).trim();
          if (!formattedPhone.startsWith('+')) {
            if (formattedPhone.startsWith('91')) formattedPhone = '+' + formattedPhone;
            else if (formattedPhone.length === 10) formattedPhone = '+91' + formattedPhone;
            else formattedPhone = '+91' + formattedPhone;
          }
          await invoicesApi.sendWhatsApp(invoiceId, formattedPhone, null);
        }
        if (selectedChannels.download) {
          await invoicesApi.downloadPDF(invoiceId);
        }
      }
      if (selectedChannels.print) {
        window.print();
      }
    } catch (err) {
      console.error('Send receipt error:', err);
    } finally {
      setSending(false);
      onDone?.();
    }
  };

  const handleNoReceipt = () => {
    onDone?.();
  };

  if (!isOpen) return null;

  return (
    <div
      className="payment-approved-overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="payment-approved-card">
        <h1 className="payment-approved-title">Payment approved,</h1>
        <p className="payment-approved-subtitle">Receipt options</p>

        <div className="receipt-options-grid">
          <button
            type="button"
            className={`receipt-option ${selectedChannels.shopApp ? 'selected' : ''}`}
            onClick={() => toggleChannel('shopApp')}
          >
            <div className="receipt-option-icon receipt-option-icon-shop">
              <ShoppingBag size={24} />
            </div>
            <span className="receipt-option-label">Send to Shop app</span>
            <span className="receipt-option-detail">
              Shop account: {maskedEmail || '—'}
            </span>
          </button>

          <button
            type="button"
            className={`receipt-option ${!email?.trim() ? 'disabled' : ''} ${selectedChannels.email ? 'selected' : ''}`}
            onClick={() => email?.trim() && toggleChannel('email')}
            disabled={!email?.trim()}
          >
            <div className="receipt-option-icon">
              <Mail size={24} />
            </div>
            <span className="receipt-option-label">Email receipt</span>
            <span className="receipt-option-detail">{maskedEmail || '—'}</span>
          </button>

          <button
            type="button"
            className={`receipt-option ${!phone ? 'disabled' : ''} ${selectedChannels.text ? 'selected' : ''}`}
            onClick={() => phone && toggleChannel('text')}
            disabled={!phone}
          >
            <div className="receipt-option-icon">
              <Smartphone size={24} />
            </div>
            <span className="receipt-option-label">Text receipt</span>
            <span className="receipt-option-detail">{maskedPhone || '—'}</span>
          </button>

          <button
            type="button"
            className={`receipt-option ${selectedChannels.download ? 'selected' : ''}`}
            onClick={() => toggleChannel('download')}
          >
            <div className="receipt-option-icon">
              <Download size={24} />
            </div>
            <span className="receipt-option-label">Download PDF</span>
            <span className="receipt-option-detail">Save to device</span>
          </button>

          <button
            type="button"
            className={`receipt-option ${selectedChannels.print ? 'selected' : ''}`}
            onClick={() => toggleChannel('print')}
          >
            <div className="receipt-option-icon">
              <Printer size={24} />
            </div>
            <span className="receipt-option-label">Print receipt</span>
            <span className="receipt-option-detail">Print</span>
          </button>
        </div>

        <button type="button" className="receipt-no-receipt-link" onClick={handleNoReceipt}>
          I don&apos;t want a receipt
        </button>

        <label className="receipt-signup-checkbox">
          <input
            type="checkbox"
            checked={signUpForOffers}
            onChange={(e) => setSignUpForOffers(e.target.checked)}
          />
          <span>Sign up to receive exclusive offers</span>
        </label>

        <button
          type="button"
          className="receipt-send-btn"
          onClick={handleSendReceipt}
          disabled={sending || !invoiceId}
        >
          {sending ? 'Sending...' : 'Send receipt'}
        </button>

        <p className="receipt-disclaimer">
          By selecting a digital receipt, your email will be shared with MINAKI.
        </p>
      </div>
    </div>
  );
};
