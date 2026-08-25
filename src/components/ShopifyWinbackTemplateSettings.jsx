import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Collapse, Grid, Paper, Stack, TextField, Typography } from '@mui/material';
import { Settings } from 'lucide-react';
import { shopifyWinbackApi } from '../services/shopifyWinbackApi';

/**
 * WhatsApp template name/language for the winback offer + reminder sends -
 * editable here instead of needing a redeploy (services/shopify/winback_service.py
 * ::get_template_config() in minaki-api reads this same shopify_winback_config
 * row, falling back to WHATSAPP_TEMPLATE_WINBACK_OFFER/REMINDER env vars until
 * someone saves a value here).
 *
 * Offer template is fixed in send order - header: static image, body: {{1}}
 * first name, {{2}} product name, {{3}} discount code, button 0: dynamic
 * checkout URL (discount pre-applied), button 1: copy-code - so the approved
 * Meta template's structure has to match that order; this panel only
 * configures which template name/language/header image gets used, not the
 * variable mapping. offer_template_id is Business Manager's numeric ID, kept
 * only as a cross-reference - sending is always by template *name*.
 */
export const ShopifyWinbackTemplateSettings = () => {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { severity, message }

  const load = async () => {
    setLoading(true);
    try {
      const data = await shopifyWinbackApi.getTemplateConfig();
      setConfig(data);
    } catch (err) {
      setStatus({ severity: 'error', message: err.message || 'Failed to load template settings' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && !config) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleChange = (field) => (event) => {
    setConfig((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const updated = await shopifyWinbackApi.updateTemplateConfig(config);
      setConfig(updated);
      setStatus({ severity: 'success', message: 'Saved.' });
    } catch (err) {
      setStatus({ severity: 'error', message: err.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setOpen((v) => !v)}
      >
        <Settings size={18} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          WhatsApp template settings
        </Typography>
      </Stack>
      <Collapse in={open}>
        <Box sx={{ mt: 2 }}>
          {status ? (
            <Alert severity={status.severity} sx={{ mb: 2 }} onClose={() => setStatus(null)}>
              {status.message}
            </Alert>
          ) : null}
          {loading || !config ? (
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          ) : (
            <>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Offer template name"
                    value={config.offer_template_name || ''}
                    onChange={handleChange('offer_template_name')}
                    helperText="Body vars in order: first name, product name, discount code"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Offer template language"
                    value={config.offer_template_language || 'en'}
                    onChange={handleChange('offer_template_language')}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Offer template ID (reference only)"
                    value={config.offer_template_id || ''}
                    onChange={handleChange('offer_template_id')}
                    helperText="Business Manager ID - not used to send, name is"
                  />
                </Grid>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Offer template header image URL"
                    value={config.offer_template_header_image_url || ''}
                    onChange={handleChange('offer_template_header_image_url')}
                    helperText="Public HTTPS image URL for the template header"
                  />
                </Grid>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Reminder template name"
                    value={config.reminder_template_name || ''}
                    onChange={handleChange('reminder_template_name')}
                    helperText="Body vars in order: discount code"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Reminder template language"
                    value={config.reminder_template_language || 'en'}
                    onChange={handleChange('reminder_template_language')}
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" size="small" disabled={saving} onClick={handleSave}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ShopifyWinbackTemplateSettings;
