import { useState, useEffect, useCallback } from 'react';
import { invoicesApi } from '../services/api';

/**
 * useInvoices Hook
 * Manages invoice operations and state
 */
export const useInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all invoices
  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoicesApi.getAll();
      
      // Handle different response formats
      let invoiceList = [];
      if (Array.isArray(result)) {
        invoiceList = result;
      } else if (result.invoices && Array.isArray(result.invoices)) {
        invoiceList = result.invoices;
      } else if (result.data && Array.isArray(result.data)) {
        invoiceList = result.data;
      }

      setInvoices(invoiceList);
      return invoiceList;
    } catch (err) {
      const errorMessage = err.message || 'Failed to load invoices';
      setError(errorMessage);
      console.error('Failed to load invoices:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get invoice by ID
  const getInvoice = useCallback(async (invoiceId) => {
    try {
      setLoading(true);
      setError(null);
      const invoice = await invoicesApi.getById(invoiceId);
      return invoice;
    } catch (err) {
      const errorMessage = err.message || 'Failed to load invoice';
      setError(errorMessage);
      console.error('Failed to load invoice:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Download PDF
  const downloadPDF = useCallback(async (invoiceId) => {
    try {
      setLoading(true);
      setError(null);
      await invoicesApi.downloadPDF(invoiceId);
      return { success: true, message: 'PDF downloaded successfully' };
    } catch (err) {
      const errorMessage = err.message || 'Failed to download PDF';
      setError(errorMessage);
      console.error('Failed to download PDF:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Send via WhatsApp
  const sendWhatsApp = useCallback(async (invoiceId, phoneNumber, message = null) => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoicesApi.sendWhatsApp(invoiceId, phoneNumber, message);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to send WhatsApp';
      setError(errorMessage);
      console.error('Failed to send WhatsApp:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Send via Email
  const sendEmail = useCallback(async (invoiceId, email, subject = null, message = null) => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoicesApi.sendEmail(invoiceId, email, subject, message);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to send email';
      setError(errorMessage);
      console.error('Failed to send email:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-send options
  const autoSendInvoice = useCallback(async (invoiceId, customer, preferences = {}) => {
    const results = [];
    
    try {
      // Send via WhatsApp if customer has phone and preference is enabled
      if (preferences.autoSendWhatsApp && customer?.phone) {
        try {
          const whatsappResult = await sendWhatsApp(invoiceId, customer.phone);
          results.push({ method: 'whatsapp', success: true, result: whatsappResult });
        } catch (error) {
          results.push({ method: 'whatsapp', success: false, error: error.message });
        }
      }

      // Send via Email if customer has email and preference is enabled
      if (preferences.autoSendEmail && customer?.email) {
        try {
          const emailResult = await sendEmail(invoiceId, customer.email);
          results.push({ method: 'email', success: true, result: emailResult });
        } catch (error) {
          results.push({ method: 'email', success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('Auto-send error:', error);
      return results;
    }
  }, [sendWhatsApp, sendEmail]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Helper functions
  const getInvoiceStats = useCallback(() => {
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const paidInvoices = invoices.filter(inv => inv.status === 'Paid').length;
    const pendingInvoices = invoices.filter(inv => inv.status === 'Pending').length;

    return {
      total: invoices.length,
      totalAmount,
      paid: paidInvoices,
      pending: pendingInvoices,
      averageAmount: invoices.length > 0 ? totalAmount / invoices.length : 0
    };
  }, [invoices]);

  return {
    // State
    invoices,
    loading,
    error,

    // Actions
    loadInvoices,
    getInvoice,
    downloadPDF,
    sendWhatsApp,
    sendEmail,
    autoSendInvoice,
    clearError,

    // Utilities
    getInvoiceStats
  };
};