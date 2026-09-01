import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { ExternalLink, DollarSign, Activity, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { billingUiBuilder } from '../ui/BillingUiBuilder';
import { useAuth } from '../context/AuthContext';
import { financeApi } from '../services/financeApi';
import { INFRA_LINKS } from '../config/infraLinks';
import { ReportSummaryCards } from '../components/reports/ReportSummaryCards';
import { LoadingSpinner, ErrorMessage } from '../components';

const formatUsd = (value) => {
  const n = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(n)) return '$0.00';
  return `$${n.toFixed(2)}`;
};

const todayIso = () => new Date().toISOString().slice(0, 10);
const monthStartIso = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

export const InfraPage = () => {
  const { isAdmin, userInfo, loading: authLoading } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAdmin()) return;
    let cancelled = false;
    setLoading(true);
    financeApi
      .getSpendSummary({ fromDate: monthStartIso() })
      .then((res) => {
        if (!cancelled) setRows(res.rows || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load spend summary');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = todayIso();

  const { todayCost, todayCalls, monthCost, componentsToday, chartData } = useMemo(() => {
    let tCost = 0;
    let tCalls = 0;
    let mCost = 0;
    const componentSet = new Set();
    const byComponentToday = {};

    for (const row of rows) {
      const day = (row.day || '').slice(0, 10);
      const cost = row.cost_usd || 0;
      mCost += cost;
      if (day === today) {
        tCost += cost;
        tCalls += row.call_count || 0;
        componentSet.add(row.component);
        byComponentToday[row.component] = (byComponentToday[row.component] || 0) + cost;
      }
    }

    const chart = Object.entries(byComponentToday)
      .map(([component, cost]) => ({ component, cost: Number(cost.toFixed(4)) }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    return {
      todayCost: tCost,
      todayCalls: tCalls,
      monthCost: mCost,
      componentsToday: componentSet.size,
      chartData: chart,
    };
  }, [rows, today]);

  if (authLoading) {
    return <LoadingSpinner message="Checking permissions..." />;
  }

  if (!isAdmin()) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <ErrorMessage message={`Access denied. Admin privileges required. Your current role: ${userInfo?.role || 'not set'}`} />
      </Container>
    );
  }

  return billingUiBuilder.page({
    title: 'Infra',
    description: 'AI/tool spend tracking and quick access to infra dashboards.',
    children: (
      <Box>
        {loading && <LoadingSpinner message="Loading spend data..." />}
        {error && <ErrorMessage message={error} />}

        {!loading && !error && (
          <>
            <ReportSummaryCards
              cards={[
                { title: "Today's spend", value: formatUsd(todayCost), color: 'primary', icon: DollarSign },
                { title: "Today's LLM calls", value: todayCalls, format: 'number', color: 'info', icon: Activity },
                { title: 'Components active today', value: componentsToday, format: 'number', color: 'success', icon: Layers },
                { title: 'Month-to-date spend', value: formatUsd(monthCost), color: 'warning', icon: DollarSign },
              ]}
            />

            {chartData.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Today's spend by component
                  </Typography>
                  <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 40)}>
                    <BarChart data={chartData} layout="vertical" margin={{ left: 24, right: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                      <YAxis type="category" dataKey="component" width={160} />
                      <Tooltip formatter={(value) => formatUsd(value)} />
                      <Bar dataKey="cost" fill="#8b6f47" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Spend by day / component / operation (this month)
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 480 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Day</TableCell>
                        <TableCell>Component</TableCell>
                        <TableCell>Operation</TableCell>
                        <TableCell>Model</TableCell>
                        <TableCell align="right">Calls</TableCell>
                        <TableCell align="right">Tokens</TableCell>
                        <TableCell align="right">Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ color: '#6b7280', py: 3 }}>
                            No spend logged yet this month.
                          </TableCell>
                        </TableRow>
                      )}
                      {rows.map((row, i) => (
                        <TableRow key={`${row.day}-${row.component}-${row.operation}-${row.model}-${i}`}>
                          <TableCell>{(row.day || '').slice(0, 10)}</TableCell>
                          <TableCell>{row.component}</TableCell>
                          <TableCell>{row.operation}</TableCell>
                          <TableCell>{row.model}</TableCell>
                          <TableCell align="right">{row.call_count}</TableCell>
                          <TableCell align="right">{row.total_tokens ?? '—'}</TableCell>
                          <TableCell align="right">{formatUsd(row.cost_usd)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </>
        )}

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Infra quick links
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          {INFRA_LINKS.map((link) => (
            <Card key={link.key} sx={{ height: '100%' }}>
              <CardActionArea
                component="a"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {link.label}
                  </Typography>
                  <ExternalLink size={16} color="#6b7280" />
                </Box>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  {link.description}
                </Typography>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Box>
    ),
  });
};
