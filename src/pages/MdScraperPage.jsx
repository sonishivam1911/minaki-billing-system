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
  Button,
  Divider,
  Stack,
  Alert,
} from '@mui/material';
import { Search, X, ImageOff, AlertCircle, Gem } from 'lucide-react';
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
        MINAKI product once the gold/diamond breakdown is filled in — click a design, then
        "Add Gold/Diamond Info" to fill it in.
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
          {design.intake_status && (
            <Chip
              size="small"
              icon={<Gem size={12} />}
              label={design.intake_status}
              color={design.intake_status === 'ready' || design.intake_status === 'pushed' ? 'success' : 'info'}
            />
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {Object.keys(assets).length} metal color{Object.keys(assets).length === 1 ? '' : 's'} mirrored
        </Typography>
      </CardContent>
    </Card>
  );
}

function DesignDetailDialog({ design, onClose }) {
  const [intakeOpen, setIntakeOpen] = useState(false);
  if (!design) return null;
  const assets = design.assets || {};

  return (
    <Dialog open={!!design} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {design.title || design.design_handle}
        <IconButton onClick={onClose} size="small"><X size={18} /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Shape: <strong>{design.shape_label}</strong> · Handle: {design.design_handle}
          {design.url && (
            <> · <a href={design.url} target="_blank" rel="noreferrer">Miadonna source</a></>
          )}
        </Typography>

        <Button
          variant="outlined"
          size="small"
          startIcon={<Gem size={16} />}
          onClick={() => setIntakeOpen(true)}
          sx={{ mb: 2 }}
        >
          {design.intake_status ? 'Edit Gold/Diamond Info' : 'Add Gold/Diamond Info'}
        </Button>
        <GoldDiamondIntakeDialog
          open={intakeOpen}
          onClose={() => setIntakeOpen(false)}
          designHandle={design.design_handle}
          shapeKey={design.shape_key}
          shapeLabel={design.shape_label}
        />

        {(design.min_carat != null || design.max_carat != null || (design.available_carats || []).length > 0) && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {(design.min_carat != null && design.max_carat != null) && (
              <Chip
                size="small"
                variant="outlined"
                label={`Carat range: ${design.min_carat}–${design.max_carat}ct`}
              />
            )}
            {(design.available_carats || []).length > 0 && (
              <Chip
                size="small"
                variant="outlined"
                label={`This shape: ${design.available_carats.join(', ')}ct`}
              />
            )}
          </Box>
        )}

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

const EMPTY_INTAKE = {
  gold_karat: '', gold_color: '', gold_weight_grams: '',
  diamond_shape: '', diamond_carat: '', diamond_color: '', diamond_clarity: '',
  diamond_certification: '', diamond_count: '', price_override: '', notes: '', status: 'draft',
};

/**
 * GoldDiamondIntakeDialog
 * Ops' manual gold/diamond breakdown for one (design, shape) — this is what
 * actually turns a mirrored Miadonna design into a sellable Fine by MINAKI
 * product; nothing here is scraped. The variant reference panel shows what
 * Miadonna itself exposed (metal karat, stone color/clarity/certification)
 * per variant, purely so ops isn't re-typing values already visible on the
 * source page — filling the form doesn't require picking from it.
 */
function GoldDiamondIntakeDialog({ open, onClose, designHandle, shapeKey, shapeLabel }) {
  const [form, setForm] = useState(EMPTY_INTAKE);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open || !designHandle || !shapeKey) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSaved(false);
    Promise.all([
      mdScraperApi.getGoldDiamondIntake(designHandle, shapeKey),
      mdScraperApi.getDesignVariants(designHandle),
    ])
      .then(([intakeResult, variantsResult]) => {
        if (cancelled) return;
        const existing = intakeResult.intake;
        setForm(existing
          ? { ...EMPTY_INTAKE, ...existing, ...Object.fromEntries(
              Object.entries(existing).map(([k, v]) => [k, v == null ? '' : v])
            ) }
          : { ...EMPTY_INTAKE, diamond_shape: shapeLabel || '' });
        setVariants(variantsResult.variants || []);
      })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load intake data'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, designHandle, shapeKey, shapeLabel]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async (status) => {
    setSaving(true);
    setError(null);
    try {
      const numeric = ['gold_weight_grams', 'diamond_carat', 'diamond_count', 'price_override'];
      const payload = { ...form, status };
      for (const key of numeric) {
        payload[key] = form[key] === '' ? null : Number(form[key]);
      }
      Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null; });
      await mdScraperApi.saveGoldDiamondIntake(designHandle, shapeKey, payload);
      setForm((f) => ({ ...f, status }));
      setSaved(true);
    } catch (err) {
      setError(err.message || 'Failed to save gold/diamond info');
    } finally {
      setSaving(false);
    }
  };

  // Distinct metal karat / stone grade combos Miadonna actually offers for
  // this design — a compact reference, not every raw variant row.
  const referenceOptions = React.useMemo(() => {
    const seen = new Set();
    const rows = [];
    for (const v of variants) {
      if (!v.metal_type && !v.stone_color) continue;
      const key = `${v.metal_type}|${v.metal_color}|${v.stone_color}|${v.stone_clarity}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(v);
    }
    return rows;
  }, [variants]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Gold/Diamond Info — {shapeLabel}
        <IconButton onClick={onClose} size="small"><X size={18} /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            {saved && <Alert severity="success">Saved.</Alert>}

            {referenceOptions.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Miadonna offers this design in:
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                  {referenceOptions.slice(0, 12).map((v) => (
                    <Chip
                      key={v.variant_id}
                      size="small"
                      variant="outlined"
                      label={[v.metal_type, v.stone_color, v.stone_clarity].filter(Boolean).join(' · ')}
                    />
                  ))}
                </Box>
              </Box>
            )}

            <Divider />

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="gold-karat-label">Gold Karat</InputLabel>
                <Select labelId="gold-karat-label" label="Gold Karat" value={form.gold_karat} onChange={setField('gold_karat')}>
                  <MenuItem value=""><em>Not set</em></MenuItem>
                  <MenuItem value="14K">14K</MenuItem>
                  <MenuItem value="18K">18K</MenuItem>
                  <MenuItem value="Platinum">Platinum</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel id="gold-color-label">Gold Color</InputLabel>
                <Select labelId="gold-color-label" label="Gold Color" value={form.gold_color} onChange={setField('gold_color')}>
                  <MenuItem value=""><em>Not set</em></MenuItem>
                  <MenuItem value="White">White</MenuItem>
                  <MenuItem value="Yellow">Yellow</MenuItem>
                  <MenuItem value="Rose">Rose</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <TextField
              label="Gold Weight (grams)" type="number" size="small" fullWidth
              value={form.gold_weight_grams} onChange={setField('gold_weight_grams')}
            />

            <Divider />

            <TextField
              label="Diamond Shape" size="small" fullWidth
              value={form.diamond_shape} onChange={setField('diamond_shape')}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Diamond Carat" type="number" size="small" fullWidth
                value={form.diamond_carat} onChange={setField('diamond_carat')}
              />
              <TextField
                label="Diamond Count" type="number" size="small" fullWidth
                value={form.diamond_count} onChange={setField('diamond_count')}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Diamond Color" size="small" fullWidth
                value={form.diamond_color} onChange={setField('diamond_color')}
              />
              <TextField
                label="Diamond Clarity" size="small" fullWidth
                value={form.diamond_clarity} onChange={setField('diamond_clarity')}
              />
            </Stack>
            <TextField
              label="Diamond Certification" size="small" fullWidth
              value={form.diamond_certification} onChange={setField('diamond_certification')}
            />

            <Divider />

            <TextField
              label="Price Override (optional)" type="number" size="small" fullWidth
              value={form.price_override} onChange={setField('price_override')}
              helperText="Leave blank to price from the gold/diamond breakdown later"
            />
            <TextField
              label="Notes" size="small" fullWidth multiline minRows={2}
              value={form.notes} onChange={setField('notes')}
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" disabled={saving} onClick={() => handleSave('draft')}>
                Save Draft
              </Button>
              <Button variant="contained" disabled={saving} onClick={() => handleSave('ready')}>
                Mark Ready
              </Button>
            </Stack>
          </Stack>
        )}
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
