import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Stack,
  Typography,
  Alert,
  IconButton,
  Chip,
} from '@mui/material';
import { X, Plus, Trash2 } from 'lucide-react';
import { crmApi } from '../services/crmApi';

// Mirrors crm_segmentation_service.py's SUPPORTED_FIELDS whitelist exactly -
// AND-only structured filter rows, not a visual rule builder (v1 decision).
const FIELD_DEFS = {
  total_spend: { label: 'Total spend', type: 'numeric', ops: ['gt', 'gte', 'lt', 'lte', 'eq'] },
  order_count: { label: 'Order count', type: 'numeric', ops: ['gt', 'gte', 'lt', 'lte', 'eq'] },
  last_order_at: { label: 'Last order', type: 'date', ops: ['before_days', 'after_days'] },
  city: { label: 'City', type: 'text', ops: ['eq', 'contains'] },
  state: { label: 'State', type: 'text', ops: ['eq', 'contains'] },
  country: { label: 'Country', type: 'text', ops: ['eq', 'contains'] },
  tags: { label: 'Tags', type: 'json_array', ops: ['contains'] },
  source_providers: { label: 'Source', type: 'json_array', ops: ['contains'] },
};

const OP_LABELS = {
  gt: '>', gte: '>=', lt: '<', lte: '<=', eq: '=',
  before_days: 'more than N days ago', after_days: 'within last N days',
  contains: 'contains', between: 'between',
};

const emptyRule = () => ({ field: 'total_spend', op: 'gt', value: '' });

/**
 * Creates/edits a saved segment - structured filter rows (AND-only), a live
 * "N customers match" preview powered by POST /crm/segments/preview, Save.
 */
export const SegmentBuilderModal = ({ open, onClose, onSaved, initialSegment }) => {
  const isEdit = Boolean(initialSegment);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState([emptyRule()]);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (initialSegment) {
        setName(initialSegment.name || '');
        setDescription(initialSegment.description || '');
        const existingRules = initialSegment.filter_definition?.rules;
        setRules(existingRules && existingRules.length > 0 ? existingRules : [emptyRule()]);
      } else {
        setName('');
        setDescription('');
        setRules([emptyRule()]);
      }
      setPreview(null);
      setError('');
    }
  }, [open, initialSegment]);

  const filterDefinition = useMemo(() => ({ match: 'all', rules: rules.filter((r) => r.value !== '') }), [rules]);

  const handleAddRule = () => setRules((r) => [...r, emptyRule()]);
  const handleRemoveRule = (idx) => setRules((r) => r.filter((_, i) => i !== idx));
  const handleRuleChange = (idx, field, value) =>
    setRules((r) =>
      r.map((rule, i) => {
        if (i !== idx) return rule;
        if (field === 'field') {
          const def = FIELD_DEFS[value];
          return { field: value, op: def.ops[0], value: '' };
        }
        return { ...rule, [field]: value };
      }),
    );

  const handlePreview = async () => {
    setPreviewLoading(true);
    setError('');
    try {
      const result = await crmApi.previewSegment(filterDefinition, 10);
      setPreview(result);
    } catch (err) {
      setError(err.message || 'Preview failed');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await crmApi.updateSegment(initialSegment.id, { name, description, filter_definition: filterDefinition });
      } else {
        await crmApi.createSegment({ name, description, filter_definition: filterDefinition });
      }
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to save segment');
    } finally {
      setSaving(false);
    }
  };

  const canSave = name.trim() && rules.some((r) => r.value !== '') && !saving;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isEdit ? 'Edit Segment' : 'New Segment'}
        <IconButton onClick={onClose} size="small">
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField label="Segment name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth />

          <Typography variant="subtitle2">Rules (all must match)</Typography>
          {rules.map((rule, idx) => {
            const def = FIELD_DEFS[rule.field];
            return (
              <Stack direction="row" spacing={1} alignItems="center" key={idx}>
                <TextField
                  select
                  label="Field"
                  value={rule.field}
                  onChange={(e) => handleRuleChange(idx, 'field', e.target.value)}
                  size="small"
                  sx={{ width: 160 }}
                >
                  {Object.entries(FIELD_DEFS).map(([key, d]) => (
                    <MenuItem key={key} value={key}>
                      {d.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Operator"
                  value={rule.op}
                  onChange={(e) => handleRuleChange(idx, 'op', e.target.value)}
                  size="small"
                  sx={{ width: 160 }}
                >
                  {def.ops.map((op) => (
                    <MenuItem key={op} value={op}>
                      {OP_LABELS[op] || op}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Value"
                  value={rule.value}
                  onChange={(e) => handleRuleChange(idx, 'value', e.target.value)}
                  size="small"
                  sx={{ flex: 1 }}
                  type={def.type === 'numeric' || rule.op === 'before_days' || rule.op === 'after_days' ? 'number' : 'text'}
                />
                <IconButton size="small" onClick={() => handleRemoveRule(idx)} disabled={rules.length === 1}>
                  <Trash2 size={16} />
                </IconButton>
              </Stack>
            );
          })}
          <Button size="small" startIcon={<Plus size={16} />} onClick={handleAddRule} sx={{ alignSelf: 'flex-start' }}>
            Add rule
          </Button>

          <Stack direction="row" spacing={2} alignItems="center">
            <Button variant="outlined" size="small" onClick={handlePreview} disabled={previewLoading}>
              {previewLoading ? 'Checking...' : 'Preview'}
            </Button>
            {preview ? <Chip label={`${preview.count} customers match`} color="primary" size="small" /> : null}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!canSave} onClick={handleSave}>
          {saving ? 'Saving...' : 'Save Segment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SegmentBuilderModal;
