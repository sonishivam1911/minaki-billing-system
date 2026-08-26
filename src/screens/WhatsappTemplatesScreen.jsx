import React from 'react';
import { Button, Chip, Stack } from '@mui/material';
import { BillingScreen } from '../ui/BillingScreen';

const STATUS_COLOR = {
  APPROVED: 'success',
  PENDING: 'warning',
  REJECTED: 'error',
  PAUSED: 'default',
};

/**
 * Local mirror of Meta message templates (whatsapp_templates table, kept
 * fresh via a "Sync from Meta" action in the page's extra slot) - not a live
 * Meta call on every load. Actions here are constructor-injected callbacks,
 * same pattern as ShopifyWinbackScreen's onTrigger.
 */
export class WhatsappTemplatesScreen extends BillingScreen {
  constructor({ onPause, onUnpause, onDelete, onViewMetrics, actingTemplateId } = {}) {
    super({
      id: 'whatsapp-templates',
      title: 'WhatsApp Templates',
      description: 'Message templates synced from Meta, with pause/delete/metrics actions.',
    });
    this.onPause = onPause;
    this.onUnpause = onUnpause;
    this.onDelete = onDelete;
    this.onViewMetrics = onViewMetrics;
    this.actingTemplateId = actingTemplateId;
  }

  filterFields() {
    return [
      {
        key: 'status',
        type: 'select',
        label: 'Status',
        options: [
          { value: 'APPROVED', label: 'Approved' },
          { value: 'PENDING', label: 'Pending' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'PAUSED', label: 'Paused' },
        ],
      },
      { key: 'name', type: 'text', label: 'Search by name' },
    ];
  }

  defaultFilters() {
    return {};
  }

  columns() {
    return [
      { key: 'name', label: 'Name' },
      { key: 'language', label: 'Language' },
      { key: 'category', label: 'Category' },
      {
        key: 'status',
        label: 'Status',
        render: (value) => <Chip size="small" label={value || 'UNKNOWN'} color={STATUS_COLOR[value] || 'default'} />,
      },
      { key: 'last_synced_at', label: 'Last synced', format: 'datetime' },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        render: (_value, row) => {
          const acting = this.actingTemplateId === row.id;
          const isPaused = row.status === 'PAUSED';
          return (
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button size="small" onClick={() => this.onViewMetrics && this.onViewMetrics(row)}>
                Metrics
              </Button>
              <Button
                size="small"
                disabled={acting}
                onClick={() => (isPaused ? this.onUnpause && this.onUnpause(row) : this.onPause && this.onPause(row))}
              >
                {isPaused ? 'Unpause' : 'Pause'}
              </Button>
              <Button size="small" color="error" disabled={acting} onClick={() => this.onDelete && this.onDelete(row)}>
                Delete
              </Button>
            </Stack>
          );
        },
      },
    ];
  }

  emptyMessage() {
    return 'No templates synced yet - click "Sync from Meta" to pull the current list.';
  }
}
