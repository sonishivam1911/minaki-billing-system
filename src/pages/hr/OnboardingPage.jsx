import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  MenuItem,
} from '@mui/material';
import { UserCheck } from 'lucide-react';
import hrApi from '../../services/hrApi';

const GENDER_OPTIONS = [
  { value: '', label: '— Select —' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export function OnboardingPage() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    personal_email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    residential_address: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = useCallback((field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setError('');
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!form.first_name?.trim() || !form.last_name?.trim() || !form.personal_email?.trim()) {
      setError('First name, last name, and personal email are required.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await hrApi.submitOnboarding({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        personal_email: form.personal_email.trim(),
        phone: form.phone?.trim() || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        residential_address: form.residential_address?.trim() || null,
      });
      setSuccess(true);
    } catch (e) {
      setError(e?.message || 'Failed to save onboarding details.');
    } finally {
      setSubmitting(false);
    }
  }, [form]);

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="success.main" gutterBottom>
            Onboarding complete
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your details have been saved. You can close this page or go to the app.
          </Typography>
          <Button href="/catalog" variant="contained" sx={{ mt: 2, backgroundColor: '#8b6f47', '&:hover': { backgroundColor: '#7a6340' } }}>
            Go to catalog
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <UserCheck size={28} color="#8b6f47" />
        <Typography variant="h5" fontWeight={600} color="#2c2416">
          Complete your onboarding
        </Typography>
      </Box>
      <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide your details below. Fields marked with * are required.
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="First name"
              value={form.first_name}
              onChange={handleChange('first_name')}
              required
              fullWidth
            />
            <TextField
              label="Last name"
              value={form.last_name}
              onChange={handleChange('last_name')}
              required
              fullWidth
            />
            <TextField
              label="Personal email"
              type="email"
              value={form.personal_email}
              onChange={handleChange('personal_email')}
              required
              fullWidth
            />
            <TextField
              label="Phone"
              value={form.phone}
              onChange={handleChange('phone')}
              fullWidth
            />
            <TextField
              label="Date of birth"
              type="date"
              value={form.date_of_birth}
              onChange={handleChange('date_of_birth')}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              select
              label="Gender"
              value={form.gender}
              onChange={handleChange('gender')}
              fullWidth
            >
              {GENDER_OPTIONS.map((o) => (
                <MenuItem key={o.value || 'none'} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Residential address"
              value={form.residential_address}
              onChange={handleChange('residential_address')}
              multiline
              rows={2}
              fullWidth
            />
            {error && (
              <Typography color="error" variant="body2">{error}</Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ backgroundColor: '#8b6f47', '&:hover': { backgroundColor: '#7a6340' } }}
            >
              {submitting ? 'Saving…' : 'Submit'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
