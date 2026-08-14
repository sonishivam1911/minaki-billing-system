import { DollarSign, FileText, Package, TrendingUp } from 'lucide-react';
import { BillingScreen } from '../../ui/BillingScreen';
import {
  REPORT_ID_INVOICE_PRODUCT_SALES,
  ZAKYA_BRANCH_OPTIONS,
  ZAKYA_INVOICE_STATUS_OPTIONS,
} from './zakyaReportOptions';

export class InvoiceProductSalesScreen extends BillingScreen {
  constructor() {
    super({
      id: REPORT_ID_INVOICE_PRODUCT_SALES,
      title: 'Zakya Product Sales',
      description: 'SKU sales from Zakya invoice lines. Quantity, rupees, and invoice count.',
    });
  }

  filterFields() {
    return [
      { key: 'date_range', type: 'date_range', label: 'Date range' },
      {
        key: 'branch_name',
        type: 'select',
        label: 'Branch',
        options: ZAKYA_BRANCH_OPTIONS,
      },
      {
        key: 'status',
        type: 'select',
        label: 'Status',
        options: ZAKYA_INVOICE_STATUS_OPTIONS,
      },
      { key: 'sku', type: 'text', label: 'SKU' },
      { key: 'product_name', type: 'text', label: 'Product name' },
    ];
  }

  columns() {
    return [
      { key: 'sku', label: 'SKU', sortable: true },
      { key: 'item_name', label: 'Product', sortable: true },
      { key: 'quantity_sold', label: 'Qty sold', sortable: true, format: 'number' },
      { key: 'average_rate', label: 'Avg rate', sortable: true, format: 'currency' },
      { key: 'sum_amount', label: 'Amount', sortable: true, format: 'currency' },
      { key: 'invoice_count', label: 'Invoices', sortable: true, format: 'number' },
    ];
  }

  summaryCards(summary) {
    if (!summary) return [];
    return [
      { title: 'Products', value: summary.product_count || 0, format: 'number', color: 'primary', icon: Package },
      { title: 'Qty sold', value: summary.quantity_sold || 0, format: 'number', color: 'info', icon: TrendingUp },
      { title: 'Amount', value: summary.sum_amount || 0, format: 'currency', color: 'success', icon: DollarSign },
      { title: 'Invoices', value: summary.invoice_count || 0, format: 'number', color: 'default', icon: FileText },
    ];
  }

  emptyMessage() {
    return 'No invoice product sales for these filters.';
  }
}
