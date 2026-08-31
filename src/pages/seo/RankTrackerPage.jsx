import React, { useCallback, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Collapse,
  Stack,
  IconButton,
} from '@mui/material';
import { Download, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { seoApi } from '../../services/seoApi';
import { SeoSubnav } from '../../components/seo/SeoSubnav';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { ErrorMessage } from '../../components';
import { usePolling } from '../../hooks/usePolling';
import { downloadCsv } from '../../utils/csv';

const BRAND_COLOR = '#8b6f47';
// checkRankTracker is a FastAPI BackgroundTask, not an RQ job — no status
// endpoint to poll, unlike the site-crawl pipelines. Results just get
// reloaded once after a short delay, same idiom SiteCrawlPage uses for
// its own no-status-endpoint actions (extractAllKeywords/checkAllSchema).
const CHECK_RESULT_DELAY_MS = 4000;

export const RankTrackerPage = () => {
  const [trackers, setTrackers] = useState([]);
  const [trackersLoading, setTrackersLoading] = useState(false);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [targetDomain, setTargetDomain] = useState('minaki.shop');
  const [keywordsText, setKeywordsText] = useState('');
  const [device, setDevice] = useState('mobile');
  const [creating, setCreating] = useState(false);

  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const [expandedKeyword, setExpandedKeyword] = useState(null);
  const [fullSerp, setFullSerp] = useState(null);
  const [fullSerpLoading, setFullSerpLoading] = useState(false);

  const loadTrackers = useCallback(async () => {
    setTrackersLoading(true);
    try {
      const res = await seoApi.listRankTrackers({ limit: 50 });
      setTrackers(res.items || res || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setTrackersLoading(false);
    }
  }, []);
  usePolling(loadTrackers);

  const loadResults = useCallback(async (tracker) => {
    if (!tracker) return;
    setResultsLoading(true);
    try {
      const res = await seoApi.getRankTrackerResults(tracker.id, { limit: 200 });
      setResults(res.items || res || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setResultsLoading(false);
    }
  }, []);

  const createTracker = async () => {
    const keywords = keywordsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!name.trim() || !targetDomain.trim() || !keywords.length) {
      setError('Name, target domain, and at least one keyword are required');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await seoApi.createRankTracker({
        name: name.trim(),
        target_domain: targetDomain.trim(),
        keywords,
        device,
      });
      setName('');
      setKeywordsText('');
      await loadTrackers();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const openTracker = (tracker) => {
    setSelected(tracker);
    setResults([]);
    setExpandedKeyword(null);
    setFullSerp(null);
    loadResults(tracker);
  };

  const runCheck = async () => {
    if (!selected) return;
    setChecking(true);
    setError(null);
    try {
      await seoApi.checkRankTracker(selected.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setChecking(false);
      setTimeout(() => loadResults(selected), CHECK_RESULT_DELAY_MS);
    }
  };

  const toggleFullSerp = async (keyword) => {
    if (expandedKeyword === keyword) {
      setExpandedKeyword(null);
      setFullSerp(null);
      return;
    }
    setExpandedKeyword(keyword);
    setFullSerp(null);
    setFullSerpLoading(true);
    try {
      // Cache-first, persisted SERP store — same one the site-crawl
      // SERP-lookup pass writes to, deliberately kept separate from this
      // page's own configs/results model (a manually-configured recurring
      // watchlist, not the crawl-driven final-keyword validation).
      setFullSerp(await seoApi.getSerpSnapshot({ keyword, device: selected?.device || 'mobile' }));
    } catch (e) {
      setFullSerp(null);
    } finally {
      setFullSerpLoading(false);
    }
  };

  return (
    <div className="screen-container agents-page">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">Rank Tracker</h1>
          <p className="screen-subtitle">Track keyword rankings over time (DataForSEO SERP)</p>
        </div>
      </div>
      <SeoSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.rankTracker} />
      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
            New tracker
          </Typography>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                size="small"
                label="Tracker name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ minWidth: 220 }}
              />
              <TextField
                size="small"
                label="Target domain"
                placeholder="minaki.shop"
                value={targetDomain}
                onChange={(e) => setTargetDomain(e.target.value)}
                sx={{ minWidth: 220 }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Device</InputLabel>
                <Select label="Device" value={device} onChange={(e) => setDevice(e.target.value)}>
                  <MenuItem value="mobile">Mobile</MenuItem>
                  <MenuItem value="desktop">Desktop</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <TextField
              multiline
              minRows={3}
              placeholder="One keyword per line"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
            />
            <Box>
              <Button
                variant="contained"
                sx={{ bgcolor: BRAND_COLOR, '&:hover': { bgcolor: BRAND_COLOR } }}
                onClick={createTracker}
                disabled={creating}
              >
                {creating ? 'Creating…' : 'Create tracker'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Trackers
            </Typography>
            <IconButton onClick={loadTrackers} title="Refresh">
              <RefreshCw size={18} />
            </IconButton>
          </Stack>
          {trackersLoading && !selected ? (
            <LinearProgress />
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Domain</TableCell>
                    <TableCell>Keywords</TableCell>
                    <TableCell>Device</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trackers.map((t) => (
                    <TableRow key={t.id} hover selected={selected?.id === t.id}>
                      <TableCell>{t.name}</TableCell>
                      <TableCell>{t.target_domain}</TableCell>
                      <TableCell>{(t.keywords || []).length}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{t.device}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => openTracker(t)}>
                          {selected?.id === t.id ? 'Selected' : 'Open'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {trackers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>
                        No trackers yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {selected && (
        <Card variant="outlined">
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1} sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {selected.name} — results
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  sx={{ bgcolor: BRAND_COLOR, '&:hover': { bgcolor: BRAND_COLOR } }}
                  onClick={runCheck}
                  disabled={checking}
                >
                  {checking ? 'Checking…' : 'Check now'}
                </Button>
                <Button size="small" variant="outlined" startIcon={<RefreshCw size={16} />} onClick={() => loadResults(selected)}>
                  Refresh
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Download size={16} />}
                  onClick={() =>
                    downloadCsv(`${selected.name}-rank-results.csv`, results, [
                      { label: 'Keyword', value: (r) => r.keyword },
                      { label: 'Rank', value: (r) => r.rank },
                      { label: 'Checked at', value: (r) => r.checked_at },
                      { label: 'Error', value: (r) => r.error },
                    ])
                  }
                  disabled={!results.length}
                >
                  Export
                </Button>
              </Stack>
            </Stack>

            {resultsLoading ? (
              <LinearProgress />
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Keyword</TableCell>
                      <TableCell>Rank</TableCell>
                      <TableCell>Checked at</TableCell>
                      <TableCell>Error</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((r, i) => (
                      <React.Fragment key={r.id || i}>
                        <TableRow hover>
                          <TableCell>{r.keyword}</TableCell>
                          <TableCell>
                            {r.rank != null ? (
                              <Chip size="small" color={r.rank <= 10 ? 'success' : 'default'} label={`#${r.rank}`} />
                            ) : (
                              <Chip size="small" variant="outlined" label="Not in top results" />
                            )}
                          </TableCell>
                          <TableCell>{r.checked_at ? new Date(r.checked_at).toLocaleString() : '—'}</TableCell>
                          <TableCell>{r.error || '—'}</TableCell>
                          <TableCell align="right">
                            <Button size="small" onClick={() => toggleFullSerp(r.keyword)}>
                              Full SERP {expandedKeyword === r.keyword ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                            <Collapse in={expandedKeyword === r.keyword}>
                              <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                                {fullSerpLoading ? (
                                  <LinearProgress />
                                ) : fullSerp ? (
                                  <Stack spacing={1}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Typography variant="caption" color="text.secondary">
                                        {fullSerp.cache_hit ? `Cached${fullSerp.stale ? ' (stale)' : ''}` : 'Freshly fetched'}
                                      </Typography>
                                    </Stack>
                                    <Typography variant="body2" fontWeight={700}>Top organic results</Typography>
                                    {(fullSerp.organic || []).slice(0, 10).map((o, idx) => (
                                      <Typography key={idx} variant="body2" color="text.secondary">
                                        #{o.rank_group} — {o.domain} — {o.title}
                                      </Typography>
                                    ))}
                                    {!fullSerp.organic?.length && (
                                      <Typography variant="body2" color="text.secondary">No organic results.</Typography>
                                    )}
                                  </Stack>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">Unavailable.</Typography>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                    {results.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>
                          No results yet — run a check.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
