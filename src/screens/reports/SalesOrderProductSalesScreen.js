import { DollarSign, FileText, Package, TrendingUp } from 'lucide-react';
import { BillingScreen } from '../../ui/BillingScreen';
import {
  REPORT_ID_SALES_ORDER_PRODUCT_SALES,
  ZAKYA_BRANCH_OPTIONS,
  ZAKYA_PRODUCT_ATTRIBUTE_FILTER_FIELDS,
  ZAKYA_SALES_ORDER_STATUS_OPTIONS,
} from './zakyaReportOptions';

export class SalesOrderProductSalesScreen extends BillingScreen {
  constructor() {
    super({
      id: REPORT_ID_SALES_ORDER_PRODUCT_SALES,
      title: 'Zakya Products on Sales Orders',
      description: 'SKU quantities on Zakya sales orders. Order book, not invoiced sales.',
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
        options: ZAKYA_SALES_ORDER_STATUS_OPTIONS,
      },
      { key: 'sku', type: 'text', label: 'SKU' },
      { key: 'product_name', type: 'text', label: 'Product name' },
      ...ZAKYA_PRODUCT_ATTRIBUTE_FILTER_FIELDS,
    ];
  }

  columns() {
    return [
      { key: 'sku', label: 'SKU', sortable: true },
      { key: 'item_name', label: 'Product', sortable: true },
      { key: 'category_name', label: 'Category', sortable: true },
      { key: 'group_name', label: 'Group', sortable: true },
      { key: 'quantity_sold', label: 'Qty ordered', sortable: true, format: 'number' },
      { key: 'average_rate', label: 'Avg rate', sortable: true, format: 'currency' },
      { key: 'sum_amount', label: 'Amount', sortable: true, format: 'currency' },
      { key: 'invoice_count', label: 'Orders', sortable: true, format: 'number' },
    ];
  }

  summaryCards(summary) {
    if (!summary) return [];
    return [
      { title: 'Products', value: summary.product_count || 0, format: 'number', color: 'primary', icon: Package },
      { title: 'Qty ordered', value: summary.quantity_sold || 0, format: 'number', color: 'info', icon: TrendingUp },
      { title: 'Amount', value: summary.sum_amount || 0, format: 'currency', color: 'success', icon: DollarSign },
      { title: 'Sales orders', value: summary.invoice_count || 0, format: 'number', color: 'default', icon: FileText },
    ];
  }

  emptyMessage() {
    return 'No sales-order product lines for these filters.';
  }
}
