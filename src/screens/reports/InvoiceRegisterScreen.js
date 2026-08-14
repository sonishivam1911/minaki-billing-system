import { CheckCircle, DollarSign, FileText, TrendingUp } from 'lucide-react';
import { BillingScreen } from '../../ui/BillingScreen';
import {
  REPORT_ID_INVOICE_REGISTER,
  ZAKYA_BRANCH_OPTIONS,
  ZAKYA_INVOICE_STATUS_OPTIONS,
} from './zakyaReportOptions';

export class InvoiceRegisterScreen extends BillingScreen {
  constructor() {
    super({
      id: REPORT_ID_INVOICE_REGISTER,
      title: 'Zakya Invoice Register',
      description: 'One row per Zakya invoice. Filter by date, branch, and status.',
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
    ];
  }

  columns() {
    return [
      { key: 'invoice_number', label: 'Invoice #', sortable: true },
      { key: 'date', label: 'Date', sortable: true },
      { key: 'customer_name', label: 'Customer', sortable: true },
      { key: 'branch_name', label: 'Branch', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
      { key: 'total', label: 'Total', sortable: true, format: 'currency' },
      { key: 'balance', label: 'Balance', sortable: true, format: 'currency' },
    ];
  }

  summaryCards(summary) {
    if (!summary) return [];
    return [
      { title: 'Invoices', value: summary.document_count || 0, format: 'number', color: 'primary', icon: FileText },
      { title: 'Total', value: summary.sum_total || 0, format: 'currency', color: 'success', icon: DollarSign },
      { title: 'Balance due', value: summary.sum_balance || 0, format: 'currency', color: 'warning', icon: TrendingUp },
      { title: 'Paid invoices', value: summary.paid_count || 0, format: 'number', color: 'info', icon: CheckCircle },
    ];
  }

  emptyMessage() {
    return 'No Zakya invoices for these filters.';
  }
}
