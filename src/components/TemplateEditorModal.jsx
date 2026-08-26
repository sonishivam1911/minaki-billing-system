import React, { useMemo, useState } from 'react';
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
  Divider,
  IconButton,
} from '@mui/material';
import { X, Plus, Trash2 } from 'lucide-react';

const CATEGORIES = ['MARKETING', 'UTILITY', 'AUTHENTICATION'];
const HEADER_TYPES = ['NONE', 'TEXT', 'IMAGE'];
const BUTTON_TYPES = ['URL', 'COPY_CODE', 'QUICK_REPLY'];

const VAR_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

/** Named vars in body text, in first-seen order, deduped - "{{first_name}}" -> "first_name". */
const extractNamedVars = (text) => {
  const seen = [];
  let match;
  VAR_PATTERN.lastIndex = 0;
  while ((match = VAR_PATTERN.exec(text || '')) !== null) {
    if (!seen.includes(match[1])) seen.push(match[1]);
  }
  return seen;
};

/**
 * Authors a new WhatsApp template's Meta components JSON from a form -
 * nothing existing does this (TemplateSelector.jsx only selects/previews an
 * already-approved template). Body vars use named placeholders ({{var_name}})
 * matching this codebase's convention (winback_service.py's templates), with
 * one example-value field per detected var - Meta requires examples for
 * template approval.
 */
export const TemplateEditorModal = ({ open, onClose, onSubmit, submitting, error }) => {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en');
  const [category, setCategory] = useState('MARKETING');
  const [headerType, setHeaderType] = useState('NONE');
  const [headerText, setHeaderText] = useState('');
  const [headerExampleUrl, setHeaderExampleUrl] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [varExamples, setVarExamples] = useState({});
  const [buttons, setButtons] = useState([]);

  const bodyVars = useMemo(() => extractNamedVars(bodyText), [bodyText]);

  const handleAddButton = () => setButtons((b) => [...b, { type: 'URL', text: '', url: '' }]);
  const handleRemoveButton = (idx) => setButtons((b) => b.filter((_, i) => i !== idx));
  const handleButtonChange = (idx, field, value) =>
    setButtons((b) => b.map((btn, i) => (i === idx ? { ...btn, [field]: value } : btn)));

  const buildComponents = () => {
    const components = [];

    if (headerType === 'TEXT' && headerText.trim()) {
      components.push({ type: 'HEADER', format: 'TEXT', text: headerText.trim() });
    } else if (headerType === 'IMAGE') {
      components.push({
        type: 'HEADER',
        format: 'IMAGE',
        example: headerExampleUrl.trim() ? { header_handle: [headerExampleUrl.trim()] } : undefined,
      });
    }

    const bodyComponent = { type: 'BODY', text: bodyText };
    if (bodyVars.length > 0) {
      bodyComponent.example = {
        body_text_named_params: bodyVars.map((v) => ({ param_name: v, example: varExamples[v] || v })),
      };
    }
    components.push(bodyComponent);

    if (footerText.trim()) {
      components.push({ type: 'FOOTER', text: footerText.trim() });
    }

    if (buttons.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: buttons.map((btn) =>
          btn.type === 'URL'
            ? { type: 'URL', text: btn.text, url: btn.url }
            : { type: btn.type, text: btn.text },
        ),
      });
    }

    return components;
  };

  const handleSubmit = () => {
    onSubmit({ name: name.trim(), language, category, components: buildComponents() });
  };

  const canSubmit = name.trim() && bodyText.trim() && !submitting;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        New WhatsApp Template
        <IconButton onClick={onClose} size="small">
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="Template name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            helperText="Lowercase, numbers, underscores only - matches Meta's naming rule"
            fullWidth
          />
          <Stack direction="row" spacing={2}>
            <TextField label="Language code" value={language} onChange={(e) => setLanguage(e.target.value)} sx={{ flex: 1 }} />
            <TextField select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} sx={{ flex: 1 }}>
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Divider />
          <Typography variant="subtitle2">Header (optional)</Typography>
          <TextField select label="Header type" value={headerType} onChange={(e) => setHeaderType(e.target.value)}>
            {HEADER_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
          {headerType === 'TEXT' ? (
            <TextField label="Header text" value={headerText} onChange={(e) => setHeaderText(e.target.value)} fullWidth />
          ) : null}
          {headerType === 'IMAGE' ? (
            <TextField
              label="Example image URL"
              value={headerExampleUrl}
              onChange={(e) => setHeaderExampleUrl(e.target.value)}
              helperText="A real, public image URL Meta can fetch for review"
              fullWidth
            />
          ) : null}

          <Divider />
          <Typography variant="subtitle2">Body</Typography>
          <TextField
            label="Body text"
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            helperText="Use {{var_name}} for dynamic values, e.g. {{first_name}}"
            multiline
            minRows={4}
            fullWidth
          />
          {bodyVars.length > 0 ? (
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary">
                Example values (required by Meta for approval)
              </Typography>
              {bodyVars.map((v) => (
                <TextField
                  key={v}
                  label={`Example for {{${v}}}`}
                  value={varExamples[v] || ''}
                  onChange={(e) => setVarExamples((prev) => ({ ...prev, [v]: e.target.value }))}
                  size="small"
                  fullWidth
                />
              ))}
            </Stack>
          ) : null}

          <TextField label="Footer text (optional)" value={footerText} onChange={(e) => setFooterText(e.target.value)} fullWidth />

          <Divider />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2">Buttons (optional)</Typography>
            <Button size="small" startIcon={<Plus size={16} />} onClick={handleAddButton}>
              Add button
            </Button>
          </Stack>
          {buttons.map((btn, idx) => (
            <Stack direction="row" spacing={1} alignItems="center" key={idx}>
              <TextField
                select
                label="Type"
                value={btn.type}
                onChange={(e) => handleButtonChange(idx, 'type', e.target.value)}
                sx={{ width: 160 }}
                size="small"
              >
                {BUTTON_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Button text"
                value={btn.text}
                onChange={(e) => handleButtonChange(idx, 'text', e.target.value)}
                size="small"
                sx={{ flex: 1 }}
              />
              {btn.type === 'URL' ? (
                <TextField
                  label="URL (use {{1}} for the dynamic suffix)"
                  value={btn.url}
                  onChange={(e) => handleButtonChange(idx, 'url', e.target.value)}
                  size="small"
                  sx={{ flex: 1 }}
                />
              ) : null}
              <IconButton size="small" onClick={() => handleRemoveButton(idx)}>
                <Trash2 size={16} />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? 'Creating...' : 'Create Template'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateEditorModal;
