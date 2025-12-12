import React, { useState, useEffect } from 'react';
import { Search, FileText, Calendar, User, IndianRupee } from 'lucide-react';
import { customersApi } from '../services/api';
import { useInvoices } from '../hooks';
import { LoadingSpinner, ErrorMessage, Pagination, InvoiceActions } from '../components';

/**
 * InvoicesPage Component
 * Display and manage invoices with search and filtering
 */
export const InvoicesPage = () => {
  const { 
    invoices, 
    loading, 
    error, 
    loadInvoices, 
    getInvoiceStats,
    clearError 
  } = useInvoices();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [customers, setCustomers] = useState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load invoices on component mount
  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Load customer data when invoices change
  useEffect(() => {
    if (invoices.length > 0) {
      const customerIds = [...new Set(invoices.map(inv => inv.customer_id).filter(Boolean))];
      loadCustomerData(customerIds);
    }
  }, [invoices]);

  const loadCustomerData = async (customerIds) => {
    const customerData = {};
    
    for (const customerId of customerIds) {
      try {
        const customer = await customersApi.getById(customerId);
        customerData[customerId] = customer;
      } catch (error) {
        console.warn(`Failed to load customer ${customerId}:`, error);
        customerData[customerId] = { name: 'Unknown Customer', id: customerId };
      }
    }
    
    setCustomers(customerData);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    // Could open a detailed modal here
    console.log('View invoice details:', invoice);
  };

  // Filter invoices based on search term
  const filteredInvoices = invoices.filter(invoice => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const customer = customers[invoice.customer_id];
    const customerName = customer?.name || customer?.full_name || '';
    
    return (
      invoice.invoice_number?.toLowerCase().includes(searchLower) ||
      customerName.toLowerCase().includes(searchLower) ||
      invoice.status?.toLowerCase().includes(searchLower) ||
      invoice.total_amount?.toString().includes(searchTerm)
    );
  });

  // Paginate filtered results
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);
  const totalFilteredPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  // Get invoice statistics
  const stats = getInvoiceStats();

  if (loading) {
    return (
      <div className="screen-container">
        <LoadingSpinner message="Loading invoices..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen-container">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">
            <FileText size={24} />
            Invoices
          </h1>
          <p className="screen-subtitle">
            Manage and send invoices to customers
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search invoices by number, customer, or amount..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>

      {/* Invoice Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Invoices</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            ₹{stats.totalAmount.toLocaleString()}
          </div>
          <div className="stat-label">Total Amount</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.paid}</div>
          <div className="stat-label">Paid Invoices</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending Invoices</div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="content-section">
        {filteredInvoices.length === 0 ? (
          <div className="empty-state">
            <FileText size={64} />
            <h3>No invoices found</h3>
            <p>
              {searchTerm 
                ? 'Try adjusting your search criteria'
                : 'Invoices will appear here after completing sales'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoices.map((invoice) => {
                    const customer = customers[invoice.customer_id] || {};
                    const customerName = customer.name || customer.full_name || 'Walk-in Customer';
                    
                    return (
                      <tr key={invoice.id || invoice.invoice_id}>
                        <td>
                          <div className="invoice-number">
                            {invoice.invoice_number || `#${invoice.id}`}
                          </div>
                        </td>
                        <td>
                          <div className="customer-info">
                            <User size={16} />
                            <span>{customerName}</span>
                          </div>
                        </td>
                        <td>
                          <div className="date-info">
                            <Calendar size={16} />
                            <span>
                              {invoice.created_at 
                                ? new Date(invoice.created_at).toLocaleDateString()
                                : 'N/A'
                              }
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="amount-info">
                            <IndianRupee size={16} />
                            <strong>₹{(invoice.total_amount || 0).toLocaleString()}</strong>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${invoice.status?.toLowerCase()}`}>
                            {invoice.status || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          <InvoiceActions
                            invoice={invoice}
                            customer={customer}
                            compact={true}
                            showViewButton={true}
                            onView={handleViewInvoice}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalFilteredPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalFilteredPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};