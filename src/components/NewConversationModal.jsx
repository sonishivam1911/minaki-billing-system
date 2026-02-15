import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  InputAdornment,
  CircularProgress,
  Typography,
  Box,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { X, Search, User, Phone, Mail, FileText } from 'lucide-react';
import { customersApi } from '../services/api';
import { getCustomerDisplay, getCustomerKey } from '../utils/customerFields';
import { isValidPhone, formatPhoneForWhatsApp, formatPhoneForDisplay } from '../utils/phoneValidation';
import { TemplateSelector } from './TemplateSelector';

/**
 * Modal to start a new WhatsApp conversation.
 * User can search/select a customer or enter phone manually.
 */
export const NewConversationModal = ({ open, onClose, onSuccess }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [useManualPhone, setUseManualPhone] = useState(false);
  const [manualPhone, setManualPhone] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('template');
  const [templateName, setTemplateName] = useState('');
  const [templateLanguage, setTemplateLanguage] = useState('en');
  const [templateVars, setTemplateVars] = useState('');
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');
  const [templateComponents, setTemplateComponents] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const fetchTemplates = useCallback(
    () => import('../services/whatsappCrmApi').then((m) => m.whatsappCrmApi.getTemplates()),
    []
  );

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const q = searchQuery.trim();
      let data;
      if (q) {
        // Backend search: pass one param. Use name for text, phone for digits
        const isNumeric = /^\d+$/.test(q.replace(/\D/g, ''));
        data = isNumeric ? await customersApi.search({ phone: q }) : await customersApi.search({ name: q });
      } else {
        data = await customersApi.getAll();
      }
      setCustomers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(fetchCustomers, 300);
      return () => clearTimeout(timer);
    }
  }, [open, fetchCustomers]);


  const reset = () => {
    setSearchQuery('');
    setUseManualPhone(false);
    setManualPhone('');
    setSelectedCustomer(null);
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

  const getPhone = () => {
    if (selectedCustomer) {
      const { phone } = getCustomerDisplay(selectedCustomer);
      return formatPhoneForWhatsApp(phone || '');
    }
    if (useManualPhone && manualPhone.trim()) {
      return formatPhoneForWhatsApp(manualPhone);
    }
    return '';
  };

  const getDisplayInfo = () => {
    if (selectedCustomer) {
      const { name, phone, email } = getCustomerDisplay(selectedCustomer);
      return { name: name || 'Unknown', phone, email };
    }
    if (useManualPhone && manualPhone.trim()) {
      return { name: 'Manual entry', phone: manualPhone, email: null };
    }
    return null;
  };

  const canSend = () => {
    const phone = getPhone();
    if (!phone || !isValidPhone(phone)) return false;
    if (messageType === 'text') return !!message.trim();
    if (messageType === 'template') return !!templateName.trim();
    return false;
  };

  const handleSend = async () => {
    setError('');
    const phone = getPhone();
    if (!isValidPhone(phone)) {
      setError('Please enter a valid phone number (at least 10 digits)');
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
    setSending(true);
    try {
      const { whatsappCrmApi } = await import('../services/whatsappCrmApi');
      const payload =
        messageType === 'template'
          ? {
              to_phone: phone,
              message_type: 'template',
              template_name: templateName.trim(),
              template_language: templateLanguage,
              template_components: templateComponents,
            }
          : {
              to_phone: phone,
              message_type: 'text',
              body: message.trim(),
            };
      await whatsappCrmApi.sendMessage(payload);
      handleClose();
      onSuccess?.(phone);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to send message');
    } finally {
      setSending(false);
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

  const info = getDisplayInfo();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">New conversation</Typography>
        <Button size="small" onClick={handleClose} sx={{ minWidth: 'auto', p: 0.5 }}>
          <X size={24} />
        </Button>
      </DialogTitle>
      <DialogContent dividers>
        {!useManualPhone ? (
          <>
            <TextField
              size="small"
              fullWidth
              placeholder="Search customers by name, phone, or email..."
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
            <Button
              size="small"
              variant="text"
              onClick={() => {
                setUseManualPhone(true);
                setSelectedCustomer(null);
              }}
              sx={{ mb: 1 }}
            >
              Or enter phone number manually
            </Button>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                {filteredCustomers.map((customer, idx) => {
                  const { name, phone, email } = getCustomerDisplay(customer);
                  const isSelected = selectedCustomer && getCustomerKey(selectedCustomer) === getCustomerKey(customer);
                  return (
                    <ListItemButton
                      key={getCustomerKey(customer) || `c-${idx}`}
                      selected={!!isSelected}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setUseManualPhone(false);
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {(name || phone || '?').toString().slice(0, 1).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={name || 'Unknown'}
                        secondary={
                          <>
                            {phone && (
                              <span>
                                <Phone size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                {formatPhoneForDisplay(phone)}
                              </span>
                            )}
                            {email && (
                              <span style={{ marginLeft: 8 }}>
                                <Mail size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                {email}
                              </span>
                            )}
                          </>
                        }
                        primaryTypographyProps={{ noWrap: true }}
                        secondaryTypographyProps={{ noWrap: true }}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            )}
          </>
        ) : (
          <Box>
            <TextField
              size="small"
              fullWidth
              label="Phone number"
              placeholder="+91 98765 43210"
              value={manualPhone}
              onChange={(e) => setManualPhone(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>+91</Typography>
                  </InputAdornment>
                ),
              }}
              error={manualPhone.trim() && !isValidPhone(manualPhone)}
              helperText={
                manualPhone.trim() && !isValidPhone(manualPhone)
                  ? 'Enter at least 10 digits (international format supported)'
                  : ''
              }
              sx={{ mb: 1 }}
            />
            <Button size="small" variant="text" onClick={() => setUseManualPhone(false)}>
              ← Back to customer list
            </Button>
          </Box>
        )}

        {info && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
              Sending to
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Avatar sx={{ bgcolor: 'grey.400', width: 32, height: 32 }}>
                <User size={18} />
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {info.name}
                </Typography>
                {info.phone && (
                  <Typography variant="caption" color="text.secondary">
                    {formatPhoneForDisplay(info.phone)}
                  </Typography>
                )}
              </Box>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
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
                placeholder="Type your message... (only works if they messaged you in last 24h)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sending}
              />
            )}
          </>
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
          {sending ? <CircularProgress size={20} /> : 'Send'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
