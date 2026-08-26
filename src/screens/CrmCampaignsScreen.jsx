import React from 'react';
import { Button, Chip, Stack } from '@mui/material';
import { BillingScreen } from '../ui/BillingScreen';

const STATUS_COLOR = {
  draft: 'default',
  scheduled: 'info',
  sending: 'warning',
  completed: 'success',
  failed: 'error',
  cancelled: 'default',
};

const formatStats = (stats) => {
  if (!stats || typeof stats !== 'object') return 'N/A';
  const { sent = 0, delivered = 0, read = 0, failed = 0, total = 0 } = stats;
  if (!total) return 'N/A';
  return `${sent} sent / ${delivered} delivered / ${read} read / ${failed} failed`;
};

/**
 * Campaigns list (crm_campaigns) - each row's recipient list was frozen at
 * start time from a segment snapshot, sent directly via Meta in RQ-batched
 * chunks (see crm_campaign_service.py). Actions are constructor-injected
 * callbacks, same pattern as ShopifyWinbackScreen's onTrigger.
 */
export class CrmCampaignsScreen extends BillingScreen {
  constructor({ onStart, onCancel, onViewSends, actingCampaignId } = {}) {
    super({
      id: 'crm-campaigns',
      title: 'Campaigns',
      description: 'WhatsApp campaigns sent directly via Meta against saved CRM segments.',
    });
    this.onStart = onStart;
    this.onCancel = onCancel;
    this.onViewSends = onViewSends;
    this.actingCampaignId = actingCampaignId;
  }

  filterFields() {
    return [
      {
        key: 'status',
        type: 'select',
        label: 'Status',
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'scheduled', label: 'Scheduled' },
          { value: 'sending', label: 'Sending' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
        ],
      },
    ];
  }

  defaultFilters() {
    return {};
  }

  columns() {
    return [
      { key: 'name', label: 'Name' },
      {
        key: 'status',
        label: 'Status',
        render: (value) => <Chip size="small" label={value} color={STATUS_COLOR[value] || 'default'} />,
      },
      { key: 'template_name', label: 'Template' },
      { key: 'scheduled_at', label: 'Scheduled', format: 'datetime' },
      { key: 'stats', label: 'Stats', render: (value) => formatStats(value) },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        render: (_value, row) => {
          const acting = this.actingCampaignId === row.id;
          return (
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button size="small" onClick={() => this.onViewSends && this.onViewSends(row)}>
                Sends
              </Button>
              {row.status === 'draft' || row.status === 'scheduled' ? (
                <Button size="small" disabled={acting} onClick={() => this.onStart && this.onStart(row)}>
                  {acting ? 'Starting...' : 'Start Now'}
                </Button>
              ) : null}
              {['draft', 'scheduled', 'sending'].includes(row.status) ? (
                <Button size="small" color="error" disabled={acting} onClick={() => this.onCancel && this.onCancel(row)}>
                  Cancel
                </Button>
              ) : null}
            </Stack>
          );
        },
      },
    ];
  }

  emptyMessage() {
    return 'No campaigns yet - click "New Campaign" to build one.';
  }
}
