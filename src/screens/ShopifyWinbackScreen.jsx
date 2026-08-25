import React from 'react';
import { Button, Chip } from '@mui/material';
import { BillingScreen } from '../ui/BillingScreen';

const STATUS_CHIP = {
  converted: { label: 'Converted', color: 'success' },
  expired: { label: 'Expired', color: 'default' },
  reminder_sent: { label: 'Reminder sent', color: 'info' },
  offer_sent: { label: 'Offer sent', color: 'warning' },
  not_started: { label: 'Not started', color: 'default' },
};

const automationStatusKey = (automation) => {
  if (!automation) return 'not_started';
  if (automation.converted_at) return 'converted';
  if (automation.expired_at) return 'expired';
  if (automation.reminder_sent_at) return 'reminder_sent';
  if (automation.offer_sent_at) return 'offer_sent';
  return 'not_started';
};

const formatMoney = (value, currency) => {
  if (value === null || value === undefined) return 'N/A';
  const amount = parseFloat(value);
  if (Number.isNaN(amount)) return 'N/A';
  return `${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ''}`.trim();
};

/**
 * Shows every abandoned checkout Shopify has on file (not just ones tracked since
 * the winback automation launched), with per-row automation status and a manual
 * "Send Now" trigger - for cold-start backfill on checkouts that predate the
 * automation. Data + trigger action come from shopifyWinbackApi.js; pagination is
 * Shopify's own cursor (page_info), handled by ShopifyWinbackPage.jsx via the
 * `extra` slot rather than the page-number Pagination widget.
 */
export class ShopifyWinbackScreen extends BillingScreen {
  constructor({ onTrigger, triggeringToken } = {}) {
    super({
      id: 'shopify-winback',
      title: 'Abandoned Checkout Winback',
      description: 'Shopify abandoned checkouts, WhatsApp winback status, and manual send.',
    });
    this.onTrigger = onTrigger;
    this.triggeringToken = triggeringToken;
  }

  filterFields() {
    return [
      {
        key: 'status',
        type: 'select',
        label: 'Checkout status',
        options: [
          { value: 'open', label: 'Open (still abandoned)' },
          { value: 'closed', label: 'Closed (converted or expired)' },
        ],
      },
    ];
  }

  defaultFilters() {
    return { status: 'open' };
  }

  columns() {
    return [
      { key: 'name', label: 'Checkout', sortable: false },
      {
        key: 'contact',
        label: 'Contact',
        sortable: false,
        render: (_value, row) => [row.customer?.first_name, row.customer?.last_name].filter(Boolean).join(' ') || row.email || row.phone || 'N/A',
      },
      { key: 'phone', label: 'Phone', sortable: false },
      { key: 'email', label: 'Email', sortable: false },
      {
        key: 'total_price',
        label: 'Cart total',
        sortable: false,
        render: (_value, row) => formatMoney(row.total_price, row.currency),
      },
      { key: 'created_at', label: 'Abandoned at', sortable: false, format: 'datetime' },
      {
        key: 'automation_status',
        label: 'Winback status',
        sortable: false,
        render: (_value, row) => {
          const key = automationStatusKey(row.automation);
          const chip = STATUS_CHIP[key];
          return <Chip size="small" label={chip.label} color={chip.color} />;
        },
      },
      {
        key: 'discount_code',
        label: 'Discount code',
        sortable: false,
        render: (_value, row) => row.automation?.discount_code || 'N/A',
      },
      {
        key: 'actions',
        label: 'Actions',
        sortable: false,
        align: 'right',
        render: (_value, row) => {
          const converted = Boolean(row.automation?.converted_at);
          const isTriggering = this.triggeringToken === row.checkout_token;
          return (
            <Button
              size="small"
              variant="outlined"
              disabled={converted || !row.phone || isTriggering}
              onClick={() => this.onTrigger && this.onTrigger(row)}
            >
              {isTriggering ? 'Sending...' : converted ? 'Converted' : row.automation?.offer_sent_at ? 'Resend' : 'Send Now'}
            </Button>
          );
        },
      },
    ];
  }

  emptyMessage() {
    return 'No abandoned checkouts for this filter.';
  }
}
