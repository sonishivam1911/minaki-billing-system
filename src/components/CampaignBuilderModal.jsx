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
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Chip,
} from '@mui/material';
import { X } from 'lucide-react';
import { crmApi } from '../services/crmApi';
import { whatsappTemplatesApi } from '../services/whatsappTemplatesApi';
import { crmCampaignsApi } from '../services/crmCampaignsApi';

const CRM_FIELDS = [
  'first_name', 'last_name', 'display_name', 'primary_phone', 'primary_email',
  'city', 'state', 'country', 'total_spend', 'order_count',
];

const VAR_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
const extractNamedVars = (text) => {
  const seen = [];
  let match;
  VAR_PATTERN.lastIndex = 0;
  while ((match = VAR_PATTERN.exec(text || '')) !== null) {
    if (!seen.includes(match[1])) seen.push(match[1]);
  }
  return seen;
};

const findComponent = (components, type) => (components || []).find((c) => (c.type || '').toUpperCase() === type);

/**
 * Builds and sends a campaign against a segment + template. Does NOT reuse
 * TemplateSelector.jsx: that component's variable detection is positional
 * ({{1}}, {{2}}) with one shared value for every recipient, but this
 * codebase's templates use NAMED params ({{first_name}}) and campaigns need
 * per-recipient personalization (map each var to a CRM field, not a single
 * static value) - a self-contained picker + mapping UI here is more correct
 * than forcing that mismatch. Button values (URL suffix / copy_code) are
 * still campaign-wide static values, matching crm_campaign_service.py's
 * button_config being sent as-is per campaign, not resolved per recipient.
 */
export const CampaignBuilderModal = ({ open, onClose, onCreated }) => {
  const [segments, setSegments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [name, setName] = useState('');
  const [segmentId, setSegmentId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [varMapping, setVarMapping] = useState({}); // { varName: { mode: 'crm'|'literal', value: '' } }
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');
  const [urlButtonSuffix, setUrlButtonSuffix] = useState('');
  const [copyCode, setCopyCode] = useState('');
  const [sendMode, setSendMode] = useState('now'); // 'now' | 'schedule'
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoadingOptions(true);
    Promise.all([crmApi.listSegments(), whatsappTemplatesApi.list()])
      .then(([segmentList, templateList]) => {
        setSegments(Array.isArray(segmentList) ? segmentList : []);
        setTemplates((Array.isArray(templateList) ? templateList : []).filter((t) => t.status === 'APPROVED'));
      })
      .catch(() => {
        setSegments([]);
        setTemplates([]);
      })
      .finally(() => setLoadingOptions(false));

    setName('');
    setSegmentId('');
    setTemplateName('');
    setVarMapping({});
    setHeaderMediaUrl('');
    setUrlButtonSuffix('');
    setCopyCode('');
    setSendMode('now');
    setScheduledAt('');
    setError('');
  }, [open]);

  const selectedTemplate = useMemo(() => templates.find((t) => t.name === templateName), [templates, templateName]);
  const bodyComponent = useMemo(() => findComponent(selectedTemplate?.components, 'BODY'), [selectedTemplate]);
  const headerComponent = useMemo(() => findComponent(selectedTemplate?.components, 'HEADER'), [selectedTemplate]);
  const buttonsComponent = useMemo(() => findComponent(selectedTemplate?.components, 'BUTTONS'), [selectedTemplate]);
  const bodyVars = useMemo(() => extractNamedVars(bodyComponent?.text), [bodyComponent]);
  const hasUrlButton = (buttonsComponent?.buttons || []).some((b) => (b.type || '').toUpperCase() === 'URL');
  const hasCopyCodeButton = (buttonsComponent?.buttons || []).some((b) => (b.type || '').toUpperCase() === 'COPY_CODE');
  const needsHeaderImage = (headerComponent?.format || '').toUpperCase() === 'IMAGE';

  const handleVarModeChange = (varName, mode) =>
    setVarMapping((prev) => ({ ...prev, [varName]: { mode, value: prev[varName]?.value || '' } }));
  const handleVarValueChange = (varName, value) =>
    setVarMapping((prev) => ({ ...prev, [varName]: { mode: prev[varName]?.mode || 'crm', value } }));

  const buildPayload = () => {
    const variable_mapping = {};
    bodyVars.forEach((v) => {
      const entry = varMapping[v] || { mode: 'crm', value: '' };
      variable_mapping[v] = entry.mode === 'literal' ? `literal:${entry.value}` : `crm.${entry.value || v}`;
    });

    const button_config = [];
    if (hasUrlButton) button_config.push({ type: 'url', parameter: urlButtonSuffix });
    if (hasCopyCodeButton) button_config.push({ type: 'copy_code', parameter: copyCode });

    return {
      name: name.trim(),
      segment_id: Number(segmentId),
      template_id: selectedTemplate?.id || null,
      template_name: templateName,
      template_language: selectedTemplate?.language || 'en',
      variable_mapping,
      header_media_url: needsHeaderImage ? headerMediaUrl : null,
      button_config: button_config.length > 0 ? button_config : null,
    };
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const created = await crmCampaignsApi.create(buildPayload());
      if (sendMode === 'now') {
        await crmCampaignsApi.start(created.id);
      } else {
        await crmCampaignsApi.schedule(created.id, scheduledAt);
      }
      onCreated();
    } catch (err) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    name.trim() &&
    segmentId &&
    templateName &&
    (sendMode === 'now' || scheduledAt) &&
    !submitting;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        New Campaign
        <IconButton onClick={onClose} size="small">
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField label="Campaign name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />

          <TextField
            select
            label="Segment"
            value={segmentId}
            onChange={(e) => setSegmentId(e.target.value)}
            disabled={loadingOptions}
            fullWidth
          >
            {segments.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name} ({s.member_count} members)
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Template"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            disabled={loadingOptions}
            fullWidth
            helperText="Only approved templates shown"
          >
            {templates.map((t) => (
              <MenuItem key={`${t.name}-${t.language}`} value={t.name}>
                {t.name} ({t.language})
              </MenuItem>
            ))}
          </TextField>

          {selectedTemplate ? (
            <>
              <Divider />
              {needsHeaderImage ? (
                <TextField
                  label="Header image URL"
                  value={headerMediaUrl}
                  onChange={(e) => setHeaderMediaUrl(e.target.value)}
                  helperText="Same image for every recipient in this campaign"
                  fullWidth
                />
              ) : null}

              {bodyVars.length > 0 ? (
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2">Body variables</Typography>
                  {bodyVars.map((v) => {
                    const entry = varMapping[v] || { mode: 'crm', value: '' };
                    return (
                      <Stack key={v} spacing={0.5}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip label={`{{${v}}}`} size="small" />
                          <ToggleButtonGroup
                            size="small"
                            exclusive
                            value={entry.mode}
                            onChange={(_e, val) => val && handleVarModeChange(v, val)}
                          >
                            <ToggleButton value="crm">Map to CRM field</ToggleButton>
                            <ToggleButton value="literal">Literal text</ToggleButton>
                          </ToggleButtonGroup>
                        </Stack>
                        {entry.mode === 'literal' ? (
                          <TextField
                            size="small"
                            placeholder="Same value for every recipient"
                            value={entry.value}
                            onChange={(e) => handleVarValueChange(v, e.target.value)}
                            fullWidth
                          />
                        ) : (
                          <TextField
                            select
                            size="small"
                            value={entry.value || v}
                            onChange={(e) => handleVarValueChange(v, e.target.value)}
                            fullWidth
                          >
                            {CRM_FIELDS.map((f) => (
                              <MenuItem key={f} value={f}>
                                {f}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      </Stack>
                    );
                  })}
                </Stack>
              ) : null}

              {hasUrlButton ? (
                <TextField
                  label="URL button suffix"
                  value={urlButtonSuffix}
                  onChange={(e) => setUrlButtonSuffix(e.target.value)}
                  helperText="Appended to the template's URL button - same for every recipient in this campaign"
                  fullWidth
                />
              ) : null}
              {hasCopyCodeButton ? (
                <TextField
                  label="Copy-code value"
                  value={copyCode}
                  onChange={(e) => setCopyCode(e.target.value)}
                  helperText="Same code for every recipient - for per-recipient unique codes, use a dedicated automation instead"
                  fullWidth
                />
              ) : null}
            </>
          ) : null}

          <Divider />
          <ToggleButtonGroup size="small" exclusive value={sendMode} onChange={(_e, val) => val && setSendMode(val)}>
            <ToggleButton value="now">Send Now</ToggleButton>
            <ToggleButton value="schedule">Schedule</ToggleButton>
          </ToggleButtonGroup>
          {sendMode === 'schedule' ? (
            <TextField
              label="Scheduled time"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? 'Creating...' : sendMode === 'now' ? 'Create & Send' : 'Create & Schedule'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CampaignBuilderModal;
