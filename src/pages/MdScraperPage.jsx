import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  TextField,
  InputAdornment,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Search, X, ImageOff, AlertCircle } from 'lucide-react';
import { mdScraperApi } from '../services/mdScraperApi';
import { LoadingSpinner, ErrorMessage } from '../components';

const METAL_LABELS = { whitegold: 'White Gold', yellowgold: 'Yellow Gold', rosegold: 'Rose Gold' };
const PAGE_SIZE = 24;

/**
 * MdScraperPage
 * Browses what the Miadonna reference-catalog scraper (Fine by MINAKI
 * diamond line) has found so far — scraped designs/shapes with their
 * mirrored Contabo images, and scrape run history/status. Read-only:
 * triggering an actual scrape is deliberately not a button here, it's
 * n8n's cron hitting the internal sync-key endpoint (see md_scraper_
 * controller.py's docstring for why).
 */
export const MdScraperPage = () => {
  const [tab, setTab] = useState('designs');

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>Fine by MINAKI — Scraped Designs</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Designs discovered from Miadonna's catalog. Each shape shown here becomes a Fine by
        MINAKI product once the gold/diamond breakdown is filled in — that intake step isn't
        built yet, this is scrape visibility only.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="designs" label="Designs" />
        <Tab value="runs" label="Scrape Runs" />
      </Tabs>

      {tab === 'designs' ? <DesignsTab /> : <RunsTab />}
    </Container>
  );
};

function DesignsTab() {
  const [designs, setDesigns] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [productType, setProductType] = useState('');
  const [shape, setShape] = useState('');
  const [filterOptions, setFilterOptions] = useState({ product_types: [], shapes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    mdScraperApi.getFilterOptions()
      .then((result) => setFilterOptions({ product_types: result.product_types || [], shapes: result.shapes || [] }))
      .catch(() => {}); // filters are a convenience, not worth failing the page over
  }, []);

  const load = useCallback(async (pageNum, searchTerm, productTypeFilter, shapeFilter) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mdScraperApi.listDesigns({
        limit: PAGE_SIZE,
        offset: (pageNum - 1) * PAGE_SIZE,
        search: searchTerm,
        productType: productTypeFilter,
        shape: shapeFilter,
      });
      setDesigns(result.designs || []);
      setTotal(result.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load scraped designs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(page, search, productType, shape), search ? 400 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, productType, shape]);

  useEffect(() => {
    setPage(1);
  }, [search, productType, shape]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <TextField
          placeholder="Search by title or handle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 280, flexGrow: 1, maxWidth: 480 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="product-type-filter-label">Product Type</InputLabel>
          <Select
            labelId="product-type-filter-label"
            label="Product Type"
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
          >
            <MenuItem value=""><em>All types</em></MenuItem>
            {filterOptions.product_types.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel id="shape-filter-label">Shape</InputLabel>
          <Select
            labelId="shape-filter-label"
            label="Shape"
            value={shape}
            onChange={(e) => setShape(e.target.value)}
          >
            <MenuItem value=""><em>All shapes</em></MenuItem>
            {filterOptions.shapes.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && designs.length === 0 && (
        <Typography color="text.secondary">
          No scraped designs found{(search || productType || shape) ? ' for that search/filter' : ''}.
        </Typography>
      )}

      {!loading && !error && designs.length > 0 && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {total.toLocaleString()} design shape{total === 1 ? '' : 's'} found
          </Typography>
          <Grid container spacing={2}>
            {designs.map((d) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={d.shape_id}>
                <DesignCard design={d} onClick={() => setDetail(d)} />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination count={pageCount} page={page} onChange={(_, v) => setPage(v)} color="primary" />
          </Box>
        </>
      )}

      <DesignDetailDialog design={detail} onClose={() => setDetail(null)} />
    </Box>
  );
}

function DesignCard({ design, onClick }) {
  const assets = design.assets || {};
  const firstMetal = Object.keys(assets)[0];
  const thumb = firstMetal ? assets[firstMetal]?.images?.[0] : null;

  return (
    <Card sx={{ cursor: 'pointer', height: '100%' }} onClick={onClick}>
      {thumb ? (
        <CardMedia component="img" height="200" image={thumb} alt={design.title || design.design_handle} sx={{ objectFit: 'cover' }} />
      ) : (
        <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover' }}>
          <ImageOff size={32} color="#999" />
        </Box>
      )}
      <CardContent>
        <Typography variant="subtitle2" noWrap title={design.title}>
          {design.title || design.design_handle}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
          <Chip size="small" label={design.shape_label} />
          {design.product_type && <Chip size="small" variant="outlined" label={design.product_type} />}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {Object.keys(assets).length} metal color{Object.keys(assets).length === 1 ? '' : 's'} mirrored
        </Typography>
      </CardContent>
    </Card>
  );
}

function DesignDetailDialog({ design, onClose }) {
  if (!design) return null;
  const assets = design.assets || {};

  return (
    <Dialog open={!!design} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {design.title || design.design_handle}
        <IconButton onClick={onClose} size="small"><X size={18} /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Shape: <strong>{design.shape_label}</strong> · Handle: {design.design_handle}
          {design.url && (
            <> · <a href={design.url} target="_blank" rel="noreferrer">Miadonna source</a></>
          )}
        </Typography>

        {Object.keys(assets).length === 0 && (
          <Typography color="text.secondary">No assets mirrored for this shape.</Typography>
        )}

        {Object.entries(assets).map(([metal, data]) => (
          <Box key={metal} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>{METAL_LABELS[metal] || metal}</Typography>
            <Grid container spacing={1}>
              {(data.images || []).map((url, i) => (
                <Grid item xs={4} sm={3} key={i}>
                  <img src={url} alt={`${metal} ${i}`} style={{ width: '100%', borderRadius: 4 }} />
                </Grid>
              ))}
            </Grid>
            {data.video && (
              <Box sx={{ mt: 1 }}>
                <video src={data.video} controls style={{ maxWidth: '100%', maxHeight: 240 }} />
              </Box>
            )}
          </Box>
        ))}
      </DialogContent>
    </Dialog>
  );
}

function RunsTab() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [failuresFor, setFailuresFor] = useState(null);
  const [failures, setFailures] = useState([]);
  const [failuresLoading, setFailuresLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const result = await mdScraperApi.listRuns({ limit: 20 });
        if (!cancelled) setRuns(result.runs || []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load scrape runs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    // Runs can be long-lived (hours) — light polling so the page reflects
    // progress without the user needing to refresh manually.
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const openFailures = async (runId) => {
    setFailuresFor(runId);
    setFailuresLoading(true);
    try {
      const result = await mdScraperApi.getRunFailures(runId);
      setFailures(result.failures || []);
    } catch (err) {
      setFailures([]);
    } finally {
      setFailuresLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (runs.length === 0) return <Typography color="text.secondary">No scrape runs yet.</Typography>;

  return (
    <Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Started</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Discovered</TableCell>
            <TableCell align="right">New</TableCell>
            <TableCell align="right">Scraped</TableCell>
            <TableCell align="right">Failed</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {runs.map((run) => (
            <TableRow key={run.id} hover>
              <TableCell>{run.started_at ? new Date(run.started_at).toLocaleString() : '—'}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={run.status}
                  color={run.status === 'completed' ? 'success' : run.status === 'failed' ? 'error' : 'default'}
                />
              </TableCell>
              <TableCell align="right">{run.total_designs_discovered ?? '—'}</TableCell>
              <TableCell align="right">{run.new_designs ?? '—'}</TableCell>
              <TableCell align="right">{run.designs_scraped ?? 0}</TableCell>
              <TableCell align="right">
                {run.designs_failed > 0 ? (
                  <Chip
                    size="small"
                    icon={<AlertCircle size={14} />}
                    label={run.designs_failed}
                    color="warning"
                    onClick={() => openFailures(run.id)}
                    sx={{ cursor: 'pointer' }}
                  />
                ) : (
                  0
                )}
              </TableCell>
              <TableCell>
                {run.error_message && (
                  <Typography variant="caption" color="error">{run.error_message}</Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!failuresFor} onClose={() => setFailuresFor(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Failures for run {failuresFor}
          <IconButton onClick={() => setFailuresFor(null)} size="small"><X size={18} /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {failuresLoading ? (
            <LoadingSpinner />
          ) : failures.length === 0 ? (
            <Typography color="text.secondary">No failure detail recorded for this run.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Design</TableCell>
                  <TableCell>Stage</TableCell>
                  <TableCell>Error</TableCell>
                  <TableCell>When</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {failures.map((f, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <a href={f.design_url} target="_blank" rel="noreferrer">{f.design_handle}</a>
                    </TableCell>
                    <TableCell><Chip size="small" label={f.stage} /></TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Typography variant="caption" sx={{ wordBreak: 'break-word' }}>{f.error_message}</Typography>
                    </TableCell>
                    <TableCell>{f.occurred_at ? new Date(f.occurred_at).toLocaleTimeString() : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default MdScraperPage;
