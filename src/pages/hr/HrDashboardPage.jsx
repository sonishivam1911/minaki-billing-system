import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  IconButton,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  LayoutDashboard,
  Users,
  Clock,
  Download,
  UserPlus,
  Filter,
  Eye,
  Send,
} from 'lucide-react';
import { useHrDashboard } from '../../hooks/useHrDashboard';
import { usersApi } from '../../services/usersApi';
import hrApi from '../../services/hrApi';

const CARD_STYLE = {
  minHeight: 120,
  borderRadius: 2,
  boxShadow: 1,
  border: '1px solid',
  borderColor: 'divider',
};

function MetricCard({ icon: Icon, title, value, subValue, badge, badgeColor }) {
  return (
    <Card sx={CARD_STYLE}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Icon size={20} color="#8b6f47" />
          <Typography variant="overline" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h5" fontWeight={700}>
          {value}
        </Typography>
        {(subValue || badge) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            {subValue && (
              <Typography variant="caption" color="success.main">
                {subValue}
              </Typography>
            )}
            {badge && (
              <Chip
                label={badge}
                size="small"
                sx={{
                  backgroundColor: badgeColor === 'error' ? 'error.light' : badgeColor === 'warning' ? 'warning.light' : 'grey.200',
                  color: badgeColor === 'error' ? 'error.contrastText' : 'text.primary',
                  fontWeight: 600,
                }}
              />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export function HrDashboardPage() {
  const [statusTab, setStatusTab] = useState('all');
  const [page, setPage] = useState(1);
  const [sendingOnboarding, setSendingOnboarding] = useState(null);

  const pageSize = 10;
  const { metrics, workforce, loading, error, fetchWorkforce, refetch } = useHrDashboard({
    autoFetch: true,
    statusFilter: statusTab,
    page,
    pageSize,
  });

  const handleTabChange = useCallback((_, v) => {
    setStatusTab(v);
    setPage(1);
  }, []);

  const handleExport = useCallback(async () => {
    try {
      await hrApi.exportDownloadCsv();
    } catch (e) {
      alert(e?.message || 'Export failed.');
    }
  }, []);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    departmentId: '',
  });
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState('');

  useEffect(() => {
    if (registerOpen) {
      hrApi.getDepartments().then(setDepartments).catch(() => setDepartments([]));
      setRegisterForm({ firstName: '', lastName: '', email: '', password: '', departmentId: '' });
      setRegisterError('');
    }
  }, [registerOpen]);

  const handleRegisterPersonnel = useCallback(() => setRegisterOpen(true), []);

  const handleRegisterClose = useCallback(() => {
    if (!registerSubmitting) setRegisterOpen(false);
  }, [registerSubmitting]);

  const handleRegisterSubmit = useCallback(async () => {
    const { firstName, lastName, email, password, departmentId } = registerForm;
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      setRegisterError('First name, last name, and email are required.');
      return;
    }
    setRegisterError('');
    setRegisterSubmitting(true);
    try {
      const userPayload = {
        email: email.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        role: 'staff',
        sendWelcomeEmail: true,
      };
      if (password?.trim()) userPayload.password = password.trim();
      const user = await usersApi.create(userPayload);
      const userId = user?.id ?? user?.user_id;
      if (!userId) throw new Error('User created but no ID returned');
      await hrApi.createEmployee({
        user_id: userId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        personal_email: email.trim(),
        department_id: departmentId ? Number(departmentId) : null,
        status: 'onboarding',
      });
      setRegisterOpen(false);
      refetch();
    } catch (e) {
      setRegisterError(e?.message || 'Failed to register personnel.');
    } finally {
      setRegisterSubmitting(false);
    }
  }, [registerForm, refetch]);

  const handleStartOnboarding = useCallback(async (employeeId) => {
    const { hrApi } = await import('../../services/hrApi');
    setSendingOnboarding(employeeId);
    try {
      await hrApi.startOnboarding(employeeId);
      refetch();
    } catch (e) {
      alert(e?.message || 'Failed to send onboarding email');
    } finally {
      setSendingOnboarding(null);
    }
  }, [refetch]);

  const totalPages = workforce.total ? Math.ceil(workforce.total / pageSize) : 0;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LayoutDashboard size={28} color="#8b6f47" />
          <Typography variant="h5" fontWeight={600} color="#2c2416">
            HR Management Dashboard
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Download size={18} />}
            onClick={handleExport}
            sx={{ color: '#8b6f47', borderColor: '#8b6f47' }}
          >
            Export Data
          </Button>
          <Button
            variant="contained"
            startIcon={<UserPlus size={18} />}
            onClick={handleRegisterPersonnel}
            sx={{ backgroundColor: '#8b6f47', '&:hover': { backgroundColor: '#7a6340' } }}
          >
            Register Personnel
          </Button>
        </Box>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Simple metric cards: total employees, on shift now */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, mb: 3 }}>
        <MetricCard
          icon={Users}
          title="TOTAL EMPLOYEES"
          value={metrics ? metrics.total_employees : '–'}
        />
        <MetricCard
          icon={Clock}
          title="ON SHIFT NOW"
          value={metrics ? metrics.on_shift_now : '–'}
        />
      </Box>

      {/* Workforce Register */}
      <Card sx={{ ...CARD_STYLE, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Workforce Register
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Comprehensive list of all luxury consulting staff and management.
          </Typography>
          <Tabs value={statusTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tab label="ALL STAFF" value="all" />
            <Tab label="ONBOARDING" value="onboarding" />
            <Tab label="REMOTE" value="remote" />
            <IconButton size="small" sx={{ ml: 1 }} title="Filters">
              <Filter size={18} />
            </IconButton>
          </Tabs>
          {loading ? (
            <LinearProgress sx={{ mb: 2 }} />
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.100' }}>
                    <TableCell><strong>EXPERTISE & ID</strong></TableCell>
                    <TableCell><strong>STATUS</strong></TableCell>
                    <TableCell><strong>POSITION</strong></TableCell>
                    <TableCell><strong>DEPARTMENT</strong></TableCell>
                    <TableCell><strong>SHIFT SCHEDULE</strong></TableCell>
                    <TableCell align="right"><strong>ACTIONS</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workforce.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }} color="text.secondary">
                        No employees found. Use Register Personnel to add staff.
                      </TableCell>
                    </TableRow>
                  ) : (
                    workforce.items.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                backgroundColor: '#8b6f47',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            >
                              {(row.first_name?.[0] || '') + (row.last_name?.[0] || '')}
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {row.first_name} {row.last_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {row.employee_id}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.status?.toUpperCase() || '–'}
                            size="small"
                            sx={{
                              backgroundColor:
                                row.status === 'active' ? 'success.light' : row.status === 'onboarding' ? 'warning.light' : 'grey.300',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>{row.position_name || row.role || '–'}</TableCell>
                        <TableCell>{row.department_name || '–'}</TableCell>
                        <TableCell>–</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            startIcon={<Send size={14} />}
                            sx={{ color: '#8b6f47', mr: 0.5 }}
                            disabled={sendingOnboarding === row.id}
                            onClick={() => handleStartOnboarding(row.id)}
                          >
                            {sendingOnboarding === row.id ? 'Sending…' : 'Start onboarding'}
                          </Button>
                          <Button size="small" startIcon={<Eye size={14} />} sx={{ color: '#8b6f47' }}>
                            VIEW
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Representing {workforce.total} luxury experts
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Button size="small" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                ‹
              </Button>
              <Typography variant="body2" sx={{ px: 1 }}>{page}</Typography>
              <Button size="small" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                ›
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={registerOpen} onClose={handleRegisterClose} maxWidth="sm" fullWidth>
        <DialogTitle>Register Personnel</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="First name"
              value={registerForm.firstName}
              onChange={(e) => setRegisterForm((f) => ({ ...f, firstName: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Last name"
              value={registerForm.lastName}
              onChange={(e) => setRegisterForm((f) => ({ ...f, lastName: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Password (optional – leave blank to auto-generate)"
              type="password"
              value={registerForm.password}
              onChange={(e) => setRegisterForm((f) => ({ ...f, password: e.target.value }))}
              fullWidth
              placeholder="Auto-generated and sent by email if empty"
            />
            <TextField
              select
              label="Department"
              value={registerForm.departmentId}
              onChange={(e) => setRegisterForm((f) => ({ ...f, departmentId: e.target.value }))}
              fullWidth
            >
              <MenuItem value="">— None —</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
              ))}
            </TextField>
            {registerError && (
              <Typography color="error" variant="body2">{registerError}</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRegisterClose} disabled={registerSubmitting}>Cancel</Button>
          <Button variant="contained" onClick={handleRegisterSubmit} disabled={registerSubmitting} sx={{ backgroundColor: '#8b6f47', '&:hover': { backgroundColor: '#7a6340' } }}>
            {registerSubmitting ? 'Creating…' : 'Create user & employee'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
