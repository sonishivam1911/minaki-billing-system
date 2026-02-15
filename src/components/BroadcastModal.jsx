import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  InputAdornment,
  CircularProgress,
  Typography,
  Box,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { X, Search, Megaphone, FileText } from 'lucide-react';
import { customersApi } from '../services/api';
import { getCustomerDisplay, getCustomerKey } from '../utils/customerFields';
import { isValidPhone, formatPhoneForWhatsApp, formatPhoneForDisplay } from '../utils/phoneValidation';
import { TemplateSelector } from './TemplateSelector';

/**
 * Modal to broadcast a message to multiple customers.
 */
export const BroadcastModal = ({ open, onClose, onSuccess }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('template');
  const [templateName, setTemplateName] = useState('');
  const [templateLanguage, setTemplateLanguage] = useState('en');
  const [templateVars, setTemplateVars] = useState('');
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');
  const [templateComponents, setTemplateComponents] = useState([]);
  const [sending, setSending] = useState(false);
  const fetchTemplates = useCallback(
    () => import('../services/whatsappCrmApi').then((m) => m.whatsappCrmApi.getTemplates()),
    []
  );
  const [error, setError] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await customersApi.getAll();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchCustomers();
  }, [open, fetchCustomers]);


  const reset = () => {
    setSearchQuery('');
    setSelectedIds(new Set());
    setMessage('');
    setMessageType('template');
    setTemplateName('');
    setTemplateLanguage('en');
    setTemplateVars('');
    setHeaderMediaUrl('');
    setTemplateComponents([]);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleCustomer = (customer) => {
    const key = getCustomerKey(customer);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    const allSelected = validRecipientKeys.length > 0 && validRecipientKeys.every((k) => selectedIds.has(k));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(validRecipientKeys));
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const { name = '', phone = '', email = '' } = getCustomerDisplay(c);
    const q = searchQuery.toLowerCase();
    return (
      (name && String(name).toLowerCase().includes(q)) ||
      (phone && String(phone).toLowerCase().includes(q)) ||
      (email && String(email).toLowerCase().includes(q))
    );
  });

  const validRecipientKeys = filteredCustomers
    .filter((c) => isValidPhone(getCustomerDisplay(c).phone))
    .map((c) => getCustomerKey(c))
    .filter(Boolean);

  const validRecipients = filteredCustomers
    .filter((c) => selectedIds.has(getCustomerKey(c)))
    .map((c) => formatPhoneForWhatsApp(getCustomerDisplay(c).phone))
    .filter((p) => p && isValidPhone(p));

  const canSend = () => {
    if (validRecipients.length === 0) return false;
    if (messageType === 'text') return !!message.trim();
    if (messageType === 'template') return !!templateName.trim();
    return false;
  };

  const handleSend = async () => {
    setError('');
    if (validRecipients.length === 0) {
      setError('Select at least one customer with a valid phone number');
      return;
    }
    if (messageType === 'text' && !message.trim()) {
      setError('Please enter a message');
      return;
    }
    if (messageType === 'template' && !templateName.trim()) {
      setError('Please select or enter a template name');
      return;
    }
    const confirmed = window.confirm(
      `You are about to send this message to ${validRecipients.length} recipient(s). Continue?`
    );
    if (!confirmed) return;

    setSending(true);
    try {
      const { whatsappCrmApi } = await import('../services/whatsappCrmApi');
      const payload =
        messageType === 'template'
          ? {
              recipients: validRecipients,
              message_type: 'template',
              template_name: templateName.trim(),
              template_language: templateLanguage,
              template_components: templateComponents,
            }
          : {
              recipients: validRecipients,
              message_type: 'text',
              body: message.trim(),
            };
      const result = await whatsappCrmApi.broadcast(payload);
      handleClose();
      onSuccess?.(result);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Broadcast failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Megaphone size={24} />
          <Typography variant="h6">Broadcast message</Typography>
        </Box>
        <Button size="small" onClick={handleClose} sx={{ minWidth: 'auto', p: 0.5 }}>
          <X size={24} />
        </Button>
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          size="small"
          fullWidth
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} />
              </InputAdornment>
            ),
          }}
        />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Select recipients (checkboxes). Only customers with valid phone numbers are eligible.
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List sx={{ maxHeight: 200, overflow: 'auto' }}>
            {filteredCustomers.length > 0 && (
              <ListItem disablePadding>
                <ListItemButton onClick={toggleAll} dense>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={validRecipientKeys.length > 0 && validRecipientKeys.every((k) => selectedIds.has(k))}
                      indeterminate={
                        (() => {
                          const n = validRecipientKeys.filter((k) => selectedIds.has(k)).length;
                          return n > 0 && n < validRecipientKeys.length;
                        })()
                      }
                    />
                  </ListItemIcon>
                  <ListItemText primary="Select all" />
                </ListItemButton>
              </ListItem>
            )}
            {filteredCustomers.map((customer, idx) => {
              const { name, phone, email } = getCustomerDisplay(customer);
              const key = getCustomerKey(customer);
              const hasValidPhone = isValidPhone(phone);
              const isSelected = selectedIds.has(key);
              return (
                <ListItem key={key || `c-${idx}`} disablePadding>
                  <ListItemButton
                    onClick={() => hasValidPhone && toggleCustomer(customer)}
                    disabled={!hasValidPhone}
                    dense
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={isSelected}
                        disabled={!hasValidPhone}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={name || 'Unknown'}
                      secondary={
                        <>
                          {phone && (
                            <span style={{ color: hasValidPhone ? undefined : 'var(--mui-palette-error-main)' }}>
                              {formatPhoneForDisplay(phone)}
                              {!hasValidPhone && ' (invalid)'}
                            </span>
                          )}
                          {email && <span style={{ marginLeft: 8 }}>{email}</span>}
                        </>
                      }
                      primaryTypographyProps={{ noWrap: true }}
                      secondaryTypographyProps={{ noWrap: true }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, mb: 1 }}>
          Use <strong>Template</strong> for new contacts (required by WhatsApp). Use <strong>Text</strong> only if they messaged you in the last 24 hours.
        </Typography>
        <ToggleButtonGroup
          value={messageType}
          exclusive
          onChange={(_, v) => v && setMessageType(v)}
          size="small"
          sx={{ mb: 1 }}
        >
          <ToggleButton value="template">
            <FileText size={16} style={{ marginRight: 4 }} />
            Template
          </ToggleButton>
          <ToggleButton value="text">Text</ToggleButton>
        </ToggleButtonGroup>

        {messageType === 'template' ? (
          <TemplateSelector
            value={templateName}
            onChange={setTemplateName}
            templateLanguage={templateLanguage}
            onLanguageChange={setTemplateLanguage}
            templateVars={templateVars}
            onTemplateVarsChange={setTemplateVars}
            headerMediaUrl={headerMediaUrl}
            onHeaderMediaUrlChange={setHeaderMediaUrl}
            onComponentsChange={setTemplateComponents}
            fetchTemplates={fetchTemplates}
            disabled={sending}
          />
        ) : (
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Type your broadcast message... (only works if they messaged you in last 24h)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
          />
        )}

        {validRecipients.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Sending to {validRecipients.length} recipient(s)
          </Typography>
        )}

        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSend} disabled={!canSend() || sending}>
          {sending ? <CircularProgress size={20} /> : 'Send broadcast'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
