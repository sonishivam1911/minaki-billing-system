import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  CircularProgress,
  Chip,
} from '@mui/material';
import { FileText } from 'lucide-react';

/**
 * Extract template body variables count from text like "Hello {{1}}, your order {{2}}"
 */
const getBodyVariableCount = (text) => {
  if (!text) return 0;
  const matches = text.match(/\{\{(\d+)\}\}/g);
  return matches ? new Set(matches).size : 0;
};

/**
 * Get body text from template components
 */
const getTemplateBody = (template) => {
  const comps = template?.components || [];
  const body = comps.find((c) => (c.type || '').toUpperCase() === 'BODY');
  return body?.text || '';
};

/**
 * Get header text from template components
 */
const getTemplateHeader = (template) => {
  const comps = template?.components || [];
  const header = comps.find((c) => (c.type || '').toUpperCase() === 'HEADER');
  if (header?.format === 'TEXT' && header?.text) return header.text;
  return null;
};

/**
 * Get footer text from template components
 */
const getTemplateFooter = (template) => {
  const comps = template?.components || [];
  const footer = comps.find((c) => (c.type || '').toUpperCase() === 'FOOTER');
  return footer?.text || null;
};

/**
 * Get button texts from template components
 */
const getTemplateButtons = (template) => {
  const comps = template?.components || [];
  const buttons = comps.find((c) => (c.type || '').toUpperCase() === 'BUTTONS');
  return (buttons?.buttons || []).map((b) => b.text).filter(Boolean);
};

/**
 * TemplateSelector with preview - dropdown of WhatsApp templates + preview card
 */
export const TemplateSelector = ({
  value,
  onChange,
  templateLanguage,
  onLanguageChange,
  templateVars,
  onTemplateVarsChange,
  fetchTemplates,
  disabled,
  compact = false,
}) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fetchTemplates) return;
    setLoading(true);
    Promise.resolve(fetchTemplates())
      .then((list) => setTemplates(Array.isArray(list) ? list : []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, [fetchTemplates]);

  const selectedTemplate = templates.find((t) => (t.name || t.id) === value) || (value ? { name: value } : null);
  const bodyText = selectedTemplate ? getTemplateBody(selectedTemplate) : '';
  const headerText = selectedTemplate ? getTemplateHeader(selectedTemplate) : null;
  const footerText = selectedTemplate ? getTemplateFooter(selectedTemplate) : null;
  const buttonTexts = selectedTemplate ? getTemplateButtons(selectedTemplate) : [];
  const varCount = getBodyVariableCount(bodyText);
  const varsArray = templateVars.split('\n').map((v) => v.trim()).filter(Boolean);

  return (
    <Box sx={{ width: '100%' }}>
      <FormControl fullWidth size="small" disabled={disabled} sx={{ mb: 1 }}>
        <InputLabel>Template</InputLabel>
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          label="Template"
          renderValue={(v) => v || 'Select a template'}
          MenuProps={{
            PaperProps: {
              sx: { maxHeight: 320 },
            },
          }}
        >
          <MenuItem value="">
            <em>— Select or type below —</em>
          </MenuItem>
          {templates.map((t) => (
            <MenuItem key={`${t.name}-${t.language}`} value={t.name || t.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileText size={16} />
                <span>{t.name || t.id}</span>
                {t.language && (
                  <Chip label={t.language} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        size="small"
        fullWidth
        label="Template name"
        placeholder="e.g. hello_world (type if not in list above)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        sx={{ mb: 1 }}
      />

      <TextField
        size="small"
        fullWidth
        label="Template language"
        value={templateLanguage}
        onChange={(e) => onLanguageChange?.(e.target.value)}
        placeholder="en"
        disabled={disabled}
        sx={{ mb: 1 }}
      />

      {/* Preview card */}
      {selectedTemplate && (bodyText || headerText || footerText || buttonTexts.length > 0) && (
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            mb: 1,
            bgcolor: 'grey.50',
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
            Preview
          </Typography>
          {headerText && (
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {headerText}
            </Typography>
          )}
          {bodyText && (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {varsArray.length > 0
                ? bodyText.replace(/\{\{(\d+)\}\}/g, (_, n) => varsArray[parseInt(n, 10) - 1] || `{{${n}}}`)
                : bodyText}
            </Typography>
          )}
          {footerText && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {footerText}
            </Typography>
          )}
          {buttonTexts.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {buttonTexts.map((btn, i) => (
                <Chip key={i} label={btn} size="small" variant="outlined" />
              ))}
            </Box>
          )}
        </Paper>
      )}

      {varCount > 0 && (
        <TextField
          fullWidth
          multiline
          rows={Math.min(varCount, 4)}
          label={`Template variables (one per line for {{1}}, {{2}}, ...) — ${varCount} needed`}
          placeholder={Array.from({ length: varCount }, (_, i) => `Value for {{${i + 1}}}`).join('\n')}
          value={templateVars}
          onChange={(e) => onTemplateVarsChange?.(e.target.value)}
          disabled={disabled}
        />
      )}
    </Box>
  );
};
