import { BarChart3, CheckCircle, DollarSign, FileText } from 'lucide-react';
import { BillingScreen } from '../../ui/BillingScreen';
import {
  REPORT_ID_INVOICE_MONTHLY,
  ZAKYA_BRANCH_OPTIONS,
  ZAKYA_INVOICE_STATUS_OPTIONS,
} from './zakyaReportOptions';

export class InvoiceMonthlyRevenueScreen extends BillingScreen {
  constructor() {
    super({
      id: REPORT_ID_INVOICE_MONTHLY,
      title: 'Zakya Invoice Revenue by Month',
      description: 'Invoice count and rupees grouped by month.',
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
      { key: 'period', label: 'Month', sortable: false },
      { key: 'document_count', label: 'Invoices', sortable: false, format: 'number' },
      { key: 'paid_count', label: 'Paid', sortable: false, format: 'number' },
      { key: 'sum_total', label: 'Total', sortable: false, format: 'currency' },
    ];
  }

  summaryCards(summary) {
    if (!summary) return [];
    return [
      { title: 'Months', value: summary.period_count || 0, format: 'number', color: 'primary', icon: BarChart3 },
      { title: 'Invoices', value: summary.document_count || 0, format: 'number', color: 'info', icon: FileText },
      { title: 'Revenue', value: summary.sum_total || 0, format: 'currency', color: 'success', icon: DollarSign },
      { title: 'Paid invoices', value: summary.paid_count || 0, format: 'number', color: 'default', icon: CheckCircle },
    ];
  }

  chartConfig(rows) {
    if (!rows || rows.length === 0) return null;
    const chronologicalRows = [...rows].reverse();
    return {
      type: 'bar',
      data: chronologicalRows,
      config: {
        xKey: 'period',
        yKey: 'sum_total',
        bars: [{ key: 'sum_total', name: 'Revenue', color: '#8b6f47' }],
      },
      title: 'Invoice revenue by month',
    };
  }

  emptyMessage() {
    return 'No monthly invoice totals for these filters.';
  }
}
