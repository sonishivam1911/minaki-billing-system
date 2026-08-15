import { CheckCircle, DollarSign, FileText, MapPin } from 'lucide-react';
import { BillingScreen } from '../../ui/BillingScreen';
import {
  REPORT_ID_SALES_ORDER_REGISTER,
  ZAKYA_BRANCH_OPTIONS,
  ZAKYA_SALES_ORDER_STATUS_OPTIONS,
} from './zakyaReportOptions';

export class SalesOrderRegisterScreen extends BillingScreen {
  constructor() {
    super({
      id: REPORT_ID_SALES_ORDER_REGISTER,
      title: 'Zakya Sales Order Register',
      description: 'One row per Zakya sales order. Filter by date, customer, branch, and status.',
    });
  }

  filterFields() {
    return [
      { key: 'date_range', type: 'date_range', label: 'Date range' },
      { key: 'customer_name', type: 'text', label: 'Customer name' },
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
    ];
  }

  columns() {
    return [
      { key: 'salesorder_number', label: 'Sales order #', sortable: true },
      { key: 'date', label: 'Date', sortable: true },
      { key: 'customer_name', label: 'Customer', sortable: true },
      { key: 'customer_email', label: 'Email', sortable: true },
      { key: 'customer_phone', label: 'Phone', sortable: true },
      { key: 'branch_name', label: 'Branch', sortable: true },
      { key: 'sales_channel', label: 'Channel', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
      { key: 'order_status', label: 'Order status', sortable: true },
      { key: 'invoiced_status', label: 'Invoiced', sortable: true },
      { key: 'paid_status', label: 'Paid', sortable: true },
      { key: 'total', label: 'Total', sortable: true, format: 'currency' },
      { key: 'balance', label: 'Balance', sortable: true, format: 'currency' },
    ];
  }

  summaryCards(summary) {
    if (!summary) return [];
    return [
      { title: 'Sales orders', value: summary.document_count || 0, format: 'number', color: 'primary', icon: FileText },
      { title: 'Total', value: summary.sum_total || 0, format: 'currency', color: 'success', icon: DollarSign },
      { title: 'Balance', value: summary.sum_balance || 0, format: 'currency', color: 'warning', icon: MapPin },
      { title: 'Open orders', value: summary.paid_count || 0, format: 'number', color: 'info', icon: CheckCircle },
    ];
  }

  emptyMessage() {
    return 'No Zakya sales orders for these filters.';
  }
}
