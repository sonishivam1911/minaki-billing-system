import React from 'react';
import { Button, Stack } from '@mui/material';
import { BillingScreen } from '../ui/BillingScreen';

/**
 * Saved CRM segments (crm_segments), each with a materialized member count
 * (crm_segment_members, recomputed via the "Compute" action, not a live
 * query). Actions are constructor-injected callbacks, same pattern as
 * ShopifyWinbackScreen's onTrigger.
 */
export class CrmSegmentsScreen extends BillingScreen {
  constructor({ onEdit, onCompute, onDelete, actingSegmentId } = {}) {
    super({
      id: 'crm-segments',
      title: 'CRM Segments',
      description: 'Merged Shopify + Zoho customer view, with saved segments for campaign targeting.',
    });
    this.onEdit = onEdit;
    this.onCompute = onCompute;
    this.onDelete = onDelete;
    this.actingSegmentId = actingSegmentId;
  }

  filterFields() {
    return [{ key: 'name', type: 'text', label: 'Search by name' }];
  }

  defaultFilters() {
    return {};
  }

  columns() {
    return [
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'member_count', label: 'Members', align: 'right' },
      { key: 'last_computed_at', label: 'Last computed', format: 'datetime' },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        render: (_value, row) => {
          const acting = this.actingSegmentId === row.id;
          return (
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button size="small" disabled={acting} onClick={() => this.onCompute && this.onCompute(row)}>
                {acting ? 'Computing...' : 'Compute'}
              </Button>
              <Button size="small" onClick={() => this.onEdit && this.onEdit(row)}>
                Edit
              </Button>
              <Button size="small" color="error" onClick={() => this.onDelete && this.onDelete(row)}>
                Delete
              </Button>
            </Stack>
          );
        },
      },
    ];
  }

  emptyMessage() {
    return 'No segments yet - click "New Segment" to build one.';
  }
}
