import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Tooltip,
} from '@mui/material';
import {
  Search, X, ImageOff, AlertCircle, Gem, RefreshCw, ChevronLeft, ChevronRight,
  Plus, Trash2, ExternalLink, CheckCircle2, Loader2,
} from 'lucide-react';
import { mdScraperApi } from '../services/mdScraperApi';
import { LoadingSpinner, ErrorMessage } from '../components';

const METAL_COLORS = ['whitegold', 'yellowgold', 'rosegold'];
const METAL_LABELS = { whitegold: 'White Gold', yellowgold: 'Yellow Gold', rosegold: 'Rose Gold' };
const METAL_SWATCH = { whitegold: '#d9d9d9', yellowgold: '#d4af37', rosegold: '#e0a89a' };
const PAGE_SIZE = 24;

const PUSH_STATUS_COLOR = { queued: 'info', running: 'info', succeeded: 'success', failed: 'error' };

/**
 * MdScraperPage — "Fine by MINAKI" hub section.
 * Browses every design discovered for the diamond line — images, shapes,
 * gold/diamond intake, and Shopify push status. The source these designs
 * are discovered from is never surfaced here or anywhere downstream —
 * this page shows only Fine by MINAKI's own data.
 */
export const MdScraperPage = () => {
  const [tab, setTab] = useState('discovered');

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>Fine by MINAKI — Discovered</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Each shape shown here becomes a Fine by MINAKI product once the gold/diamond
        breakdown is filled in — click a design, fill in the form, and push it to Shopify.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="discovered" label="Discovered" />
        <Tab value="runs" label="Runs" />
      </Tabs>

      {tab === 'discovered' ? <DiscoveredTab /> : <RunsTab />}
    </Container>
  );
};

function DiscoveredTab() {
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
      setError(err.message || 'Failed to load designs');
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

  const refreshOne = async (shapeId, designHandle, shapeKey) => {
    try {
      const result = await mdScraperApi.getGoldDiamondIntake(designHandle, shapeKey);
      const intake = result.intake;
      setDesigns((prev) => prev.map((d) => (d.shape_id === shapeId
        ? {
          ...d,
          intake_status: intake?.status || d.intake_status,
          push_status: intake?.push_status ?? d.push_status,
          shopify_product_url: intake?.shopify_product_url ?? d.shopify_product_url,
        }
        : d)));
    } catch {
      // a failed refresh just leaves the stale badge — not worth surfacing an error for
    }
  };

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
          <InputLabel id="product-type-filter-label">Category</InputLabel>
          <Select
            labelId="product-type-filter-label"
            label="Category"
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
          >
            <MenuItem value=""><em>All categories</em></MenuItem>
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
          Nothing discovered{(search || productType || shape) ? ' for that search/filter' : ''} yet.
        </Typography>
      )}

      {!loading && !error && designs.length > 0 && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {total.toLocaleString()} design{total === 1 ? '' : 's'} found
          </Typography>
          <Grid container spacing={2}>
            {designs.map((d) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={d.shape_id}>
                <DesignCard
                  design={d}
                  onClick={() => setDetail(d)}
                  onRefresh={() => refreshOne(d.shape_id, d.design_handle, d.shape_key)}
                />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination count={pageCount} page={page} onChange={(_, v) => setPage(v)} color="primary" />
          </Box>
        </>
      )}

      <DesignWorkspaceDialog design={detail} onClose={() => setDetail(null)} />
    </Box>
  );
}

function DesignCard({ design, onClick, onRefresh }) {
  const assets = design.assets || {};
  const firstMetal = METAL_COLORS.find((m) => assets[m]) || Object.keys(assets)[0];
  const thumb = firstMetal ? assets[firstMetal]?.images?.[0] : null;

  return (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <Box sx={{ cursor: 'pointer' }} onClick={onClick}>
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
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
            {design.intake_status && (
              <Chip
                size="small"
                icon={<Gem size={12} />}
                label={design.intake_status}
                color={design.intake_status === 'ready' ? 'success' : 'default'}
              />
            )}
            {design.push_status && (
              <Chip
                size="small"
                icon={design.push_status === 'succeeded' ? <CheckCircle2 size={12} /> : <Loader2 size={12} />}
                label={design.push_status}
                color={PUSH_STATUS_COLOR[design.push_status] || 'default'}
              />
            )}
          </Box>
        </CardContent>
      </Box>
      <Tooltip title="Refresh status">
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); onRefresh(); }}
          sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.paper' } }}
        >
          <RefreshCw size={14} />
        </IconButton>
      </Tooltip>
    </Card>
  );
}

const EMPTY_STONE = { position: 'Main', shape: '', carat: '', color: '', clarity: '', certification: '', stone_count: 1 };
const EMPTY_FORM = {
  gold_weight_grams: '', product_title: '', product_description: '',
  price_override: '', notes: '', status: 'draft',
};

/**
 * DesignWorkspaceDialog
 * One popup, two panels — images/color picker on the left, everything
 * needed to push this design_shape to Shopify on the right. Replaces the
 * old two-dialog (detail -> nested intake) flow with a single screen.
 */
function DesignWorkspaceDialog({ design, onClose }) {
  const [activeMetal, setActiveMetal] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [stones, setStones] = useState([{ ...EMPTY_STONE }]);
  const [variants, setVariants] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [pricingError, setPricingError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [pushStatus, setPushStatus] = useState(null);
  const [pushUrl, setPushUrl] = useState(null);
  const touchStartX = useRef(null);

  const assets = design?.assets || {};
  const availableMetals = METAL_COLORS.filter((m) => assets[m]);

  useEffect(() => {
    if (!design) return;
    setActiveMetal(availableMetals[0] || null);
    setActiveImage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design?.shape_id]);

  useEffect(() => {
    if (!design) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSaved(false);
    Promise.all([
      mdScraperApi.getGoldDiamondIntake(design.design_handle, design.shape_key),
      mdScraperApi.getDesignVariants(design.design_handle),
    ])
      .then(([intakeResult, variantsResult]) => {
        if (cancelled) return;
        const existing = intakeResult.intake;
        if (existing) {
          setForm({
            gold_weight_grams: existing.gold_weight_grams ?? '',
            product_title: existing.product_title ?? '',
            product_description: existing.product_description ?? '',
            price_override: existing.price_override ?? '',
            notes: existing.notes ?? '',
            status: existing.status || 'draft',
          });
          setStones(existing.stones?.length ? existing.stones : [{ ...EMPTY_STONE, shape: design.shape_label || '' }]);
          setPushStatus(existing.push_status || null);
          setPushUrl(existing.shopify_product_url || null);
        } else {
          setForm(EMPTY_FORM);
          setStones([{ ...EMPTY_STONE, shape: design.shape_label || '' }]);
          setPushStatus(null);
          setPushUrl(null);
        }
        setVariants(variantsResult.variants || []);
      })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load intake data'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [design]);

  // Live price preview — recomputes whenever gold weight or the stone
  // table actually has enough to price (every stone needs shape/carat/
  // color/clarity), debounced so it doesn't fire on every keystroke.
  useEffect(() => {
    const ready = form.gold_weight_grams
      && stones.length > 0
      && stones.every((s) => s.shape && s.carat && s.color && s.clarity);
    if (!ready) {
      setPricing(null);
      setPricingError(null);
      return;
    }
    const timer = setTimeout(() => {
      mdScraperApi.previewPricing({
        gold_weight_14k_grams: Number(form.gold_weight_grams),
        stones: stones.map((s) => ({ ...s, carat: Number(s.carat), stone_count: Number(s.stone_count) || 1 })),
      })
        .then((result) => { setPricing(result.variants); setPricingError(null); })
        .catch((err) => { setPricing(null); setPricingError(err.message || 'Pricing failed'); });
    }, 500);
    return () => clearTimeout(timer);
  }, [form.gold_weight_grams, stones]);

  // Distinct metal karat / stone grade combos this design is already
  // known to come in — reference only, not required to fill the form.
  // Computed above the early return below: it's a hook (useMemo), and
  // hooks can never run conditionally — the design==null early return
  // was skipping this hook on some renders but not others, which is
  // exactly React error #310 ("rendered more hooks than previous render").
  const referenceOptions = useMemo(() => {
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

  if (!design) return null;

  const currentImages = activeMetal ? (assets[activeMetal]?.images || []) : [];
  const currentVideo = activeMetal ? assets[activeMetal]?.video : null;

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const setStoneField = (index, field) => (e) => {
    const value = e.target.value;
    setStones((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const addStone = () => setStones((prev) => [...prev, { ...EMPTY_STONE, position: 'Side Stone' }]);
  const removeStone = (index) => setStones((prev) => prev.filter((_, i) => i !== index));

  const SWIPE_THRESHOLD_PX = 40;
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current == null || currentImages.length < 2) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > SWIPE_THRESHOLD_PX) {
      setActiveImage((i) => (delta < 0
        ? (i + 1) % currentImages.length
        : (i - 1 + currentImages.length) % currentImages.length));
    }
    touchStartX.current = null;
  };

  const handleSave = async (status) => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        status,
        gold_weight_grams: form.gold_weight_grams === '' ? null : Number(form.gold_weight_grams),
        price_override: form.price_override === '' ? null : Number(form.price_override),
        stones: stones
          .filter((s) => s.shape && s.carat && s.color && s.clarity)
          .map((s) => ({ ...s, carat: Number(s.carat), stone_count: Number(s.stone_count) || 1 })),
      };
      await mdScraperApi.saveGoldDiamondIntake(design.design_handle, design.shape_key, payload);
      setForm((f) => ({ ...f, status }));
      setSaved(true);
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePush = async () => {
    setPushing(true);
    setError(null);
    try {
      await handleSave('ready');
      await mdScraperApi.pushDesign(design.design_handle, design.shape_key);
      setPushStatus('queued');
    } catch (err) {
      setError(err.message || 'Failed to start push');
    } finally {
      setPushing(false);
    }
  };

  return (
    <Dialog open={!!design} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {design.shape_label} · {design.product_type}
        <IconButton onClick={onClose} size="small"><X size={18} /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? <LoadingSpinner /> : (
          <Grid container spacing={3}>
            {/* LEFT — color picker + gallery */}
            <Grid item xs={12} md={5}>
              <Typography variant="caption" color="text.secondary">Metal color</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2, mt: 0.5 }}>
                {availableMetals.map((m) => (
                  <Tooltip key={m} title={METAL_LABELS[m]}>
                    <Box
                      onClick={() => { setActiveMetal(m); setActiveImage(0); }}
                      sx={{
                        width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
                        bgcolor: METAL_SWATCH[m],
                        border: activeMetal === m ? '3px solid' : '1px solid',
                        borderColor: activeMetal === m ? 'primary.main' : 'divider',
                      }}
                    />
                  </Tooltip>
                ))}
                {availableMetals.length === 0 && (
                  <Typography variant="caption" color="text.secondary">No images mirrored yet.</Typography>
                )}
              </Stack>

              {currentImages.length > 0 && (
                <>
                  <Box
                    sx={{ position: 'relative', mb: 1 }}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    <img
                      src={currentImages[activeImage]}
                      alt={`${activeMetal} ${activeImage}`}
                      style={{ width: '100%', borderRadius: 8, maxHeight: 360, objectFit: 'contain', background: '#f5f5f5' }}
                    />
                    {currentImages.length > 1 && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => setActiveImage((i) => (i - 1 + currentImages.length) % currentImages.length)}
                          sx={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', bgcolor: 'background.paper' }}
                        >
                          <ChevronLeft size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => setActiveImage((i) => (i + 1) % currentImages.length)}
                          sx={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', bgcolor: 'background.paper' }}
                        >
                          <ChevronRight size={18} />
                        </IconButton>
                      </>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {currentImages.map((url, i) => (
                      <Box
                        key={url}
                        component="img"
                        src={url}
                        onClick={() => setActiveImage(i)}
                        sx={{
                          width: 48, height: 48, objectFit: 'cover', borderRadius: 1, cursor: 'pointer',
                          border: i === activeImage ? '2px solid' : '1px solid',
                          borderColor: i === activeImage ? 'primary.main' : 'divider',
                        }}
                      />
                    ))}
                  </Stack>
                  {currentVideo && (
                    <Box sx={{ mt: 2 }}>
                      <video src={currentVideo} controls style={{ width: '100%', maxHeight: 240, borderRadius: 8 }} />
                    </Box>
                  )}
                </>
              )}

              {(design.min_carat != null || (design.available_carats || []).length > 0) && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                  {design.min_carat != null && design.max_carat != null && (
                    <Chip size="small" variant="outlined" label={`Carat range: ${design.min_carat}–${design.max_carat}ct`} />
                  )}
                  {(design.available_carats || []).length > 0 && (
                    <Chip size="small" variant="outlined" label={`Offered in: ${design.available_carats.join(', ')}ct`} />
                  )}
                </Box>
              )}
            </Grid>

            {/* RIGHT — category info + editable form */}
            <Grid item xs={12} md={7}>
              <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}
                {saved && !error && <Alert severity="success">Saved.</Alert>}
                {pushStatus && (
                  <Alert
                    severity={pushStatus === 'succeeded' ? 'success' : pushStatus === 'failed' ? 'error' : 'info'}
                    action={pushUrl && (
                      <Button size="small" href={pushUrl} target="_blank" endIcon={<ExternalLink size={14} />}>
                        View in Shopify
                      </Button>
                    )}
                  >
                    Push status: {pushStatus}
                  </Alert>
                )}

                <Box>
                  <Typography variant="caption" color="text.secondary">Category / Shape</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                    <Chip size="small" label={design.product_type} />
                    <Chip size="small" label={design.shape_label} />
                  </Box>
                </Box>

                {referenceOptions.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Already known in:</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                      {referenceOptions.slice(0, 8).map((v) => (
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

                <TextField
                  label="Gold Weight — 14K (grams)" type="number" size="small" fullWidth required
                  value={form.gold_weight_grams} onChange={setField('gold_weight_grams')}
                  helperText="18K weight and all 6 metal/karat variants are computed automatically"
                />

                <Divider />

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">Stones</Typography>
                    <Button size="small" startIcon={<Plus size={14} />} onClick={addStone}>Add side stone</Button>
                  </Box>
                  <Stack spacing={1.5}>
                    {stones.map((stone, i) => (
                      <Box key={i} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Chip size="small" label={stone.position} color={stone.position === 'Main' ? 'primary' : 'default'} />
                          {stones.length > 1 && (
                            <IconButton size="small" onClick={() => removeStone(i)}><Trash2 size={14} /></IconButton>
                          )}
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                          <TextField label="Shape" size="small" fullWidth value={stone.shape} onChange={setStoneField(i, 'shape')} />
                          <TextField label="Carat" type="number" size="small" fullWidth value={stone.carat} onChange={setStoneField(i, 'carat')} />
                          <TextField label="Count" type="number" size="small" sx={{ minWidth: 90 }} value={stone.stone_count} onChange={setStoneField(i, 'stone_count')} />
                        </Stack>
                        <Stack direction="row" spacing={1}>
                          <TextField label="Color" size="small" fullWidth value={stone.color} onChange={setStoneField(i, 'color')} placeholder="e.g. E" />
                          <TextField label="Clarity" size="small" fullWidth value={stone.clarity} onChange={setStoneField(i, 'clarity')} placeholder="e.g. VS1" />
                          <TextField label="Certification" size="small" fullWidth value={stone.certification} onChange={setStoneField(i, 'certification')} />
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                {pricingError && <Alert severity="warning">{pricingError}</Alert>}
                {pricing && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Price preview</Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Karat</TableCell>
                          <TableCell>Color</TableCell>
                          <TableCell align="right">Final Price (₹)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pricing.map((v) => (
                          <TableRow key={`${v.karat}-${v.color}`}>
                            <TableCell>{v.karat}</TableCell>
                            <TableCell>{v.color}</TableCell>
                            <TableCell align="right">{v.final_price.toLocaleString('en-IN')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}

                <Divider />

                <TextField
                  label="Product Title (optional)" size="small" fullWidth
                  value={form.product_title} onChange={setField('product_title')}
                  helperText="Leave blank for a plain default title"
                />
                <TextField
                  label="Product Description (optional)" size="small" fullWidth multiline minRows={2}
                  value={form.product_description} onChange={setField('product_description')}
                />
                <TextField
                  label="Price Override (optional)" type="number" size="small" fullWidth
                  value={form.price_override} onChange={setField('price_override')}
                />
                <TextField
                  label="Notes" size="small" fullWidth multiline minRows={2}
                  value={form.notes} onChange={setField('notes')}
                />

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button variant="outlined" disabled={saving || pushing} onClick={() => handleSave('draft')}>
                    Save Draft
                  </Button>
                  <Button
                    variant="contained"
                    disabled={saving || pushing || !pricing}
                    onClick={handlePush}
                  >
                    {pushing ? 'Starting…' : 'Push to Shopify'}
                  </Button>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
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
        if (!cancelled) setError(err.message || 'Failed to load runs');
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
  if (runs.length === 0) return <Typography color="text.secondary">No runs yet.</Typography>;

  return (
    <Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Started</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Discovered</TableCell>
            <TableCell align="right">New</TableCell>
            <TableCell align="right">Processed</TableCell>
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
                    <TableCell>{f.design_handle}</TableCell>
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
