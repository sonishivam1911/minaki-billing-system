import React, { useCallback, useEffect, useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
import { AgentsModeSelect } from '../../components/agents/AgentsModeSelect';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { LoadingSpinner } from '../../components';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Pagination } from '../../components/ui/pagination';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_MAX_PER_SEED = 40;
const SIMILAR_KEYWORD_COUNT = 40;
const SEARCH_DEBOUNCE_MS = 300;

export const KeywordsPage = () => {
  const [tab, setTab] = useState('discover');
  const [seedsText, setSeedsText] = useState('');
  const [maxPerSeed, setMaxPerSeed] = useState(DEFAULT_MAX_PER_SEED);
  const [keywords, setKeywords] = useState([]);
  const [total, setTotal] = useState(0);
  const [keywordPage, setKeywordPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filterSeed, setFilterSeed] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [debouncedSearchQ, setDebouncedSearchQ] = useState('');
  const [debouncedFilterSeed, setDebouncedFilterSeed] = useState('');
  const [similarFor, setSimilarFor] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandResult, setExpandResult] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQ(searchQ), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQ]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilterSeed(filterSeed), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filterSeed]);

  useEffect(() => {
    setKeywordPage(0);
  }, [tab, debouncedSearchQ, debouncedFilterSeed, pageSize]);

  const loadKeywords = useCallback(async () => {
    if (tab === 'similar') {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const offset = keywordPage * pageSize;
      const res = await agentsApi.listKeywords({
        q: debouncedSearchQ || undefined,
        source: tab === 'discover' ? 'dataforseo_expand' : undefined,
        seed: debouncedFilterSeed || undefined,
        limit: pageSize,
        offset,
      });
      setKeywords(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab, debouncedSearchQ, debouncedFilterSeed, keywordPage, pageSize]);

  useEffect(() => {
    loadKeywords();
  }, [loadKeywords]);

  const runExpand = async () => {
    const seeds = seedsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!seeds.length) {
      setError('Enter at least one seed keyword');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const perSeed = Math.max(1, Math.min(200, Number(maxPerSeed) || DEFAULT_MAX_PER_SEED));
      const res = await agentsApi.expandKeywordSeeds({
        seeds,
        max_per_seed: perSeed,
        run_embed: true,
      });
      setExpandResult(res);
      setTab('discover');
      setKeywordPage(0);
      await loadKeywords();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const showSimilar = async (row) => {
    setSimilarFor(row);
    setLoading(true);
    try {
      const res = await agentsApi.similarKeywords(row.id, SIMILAR_KEYWORD_COUNT);
      setSimilar(res.similar || []);
      setTab('similar');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reloadSimilar = async () => {
    if (!similarFor?.id) {
      return;
    }
    await showSimilar(similarFor);
  };

  const refreshTable = () => {
    if (tab === 'similar') {
      reloadSimilar();
      return;
    }
    loadKeywords();
  };

  const tableRows = tab === 'similar' ? similar : keywords;
  const tableTotal = tab === 'similar' ? similar.length : total;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="minaki-ui mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold sm:text-3xl">Keywords</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Discover similar keywords via DataForSEO and browse your warehouse
        </p>
      </header>
      <AgentsSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.keywords} />
      {error && (
        <Alert variant="destructive" title="Something went wrong" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Seed keywords</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            rows={4}
            placeholder="crystal choker, bridal jhumka, kundan necklace set"
            value={seedsText}
            onChange={(e) => setSeedsText(e.target.value)}
          />
          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="max-per-seed">Top K results per seed</Label>
            <Input
              id="max-per-seed"
              type="number"
              min={1}
              max={200}
              value={maxPerSeed}
              onChange={(e) => setMaxPerSeed(e.target.value)}
            />
          </div>
          <Button onClick={runExpand} disabled={loading}>
            Fetch and save
          </Button>
          {expandResult && (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Fetched {expandResult.keywords_fetched} keywords, upserted {expandResult.keywords_upserted} from{' '}
              {expandResult.seeds?.length} seed(s) (top{' '}
              {Math.max(1, Math.min(200, Number(maxPerSeed) || DEFAULT_MAX_PER_SEED))} per seed)
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <AgentsModeSelect
            label="Keyword view"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'discover', label: 'DataForSEO results' },
              { value: 'bank', label: 'All in warehouse' },
              ...(tab === 'similar'
                ? [{ value: 'similar', label: `Similar to ${similarFor?.keyword || 'keyword'}` }]
                : []),
            ]}
          />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Filter keywords…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              disabled={tab === 'similar'}
              className="sm:max-w-xs"
            />
            <Input
              placeholder="Filter by seed…"
              value={filterSeed}
              onChange={(e) => setFilterSeed(e.target.value)}
              disabled={tab === 'similar'}
              className="sm:max-w-xs"
            />
            <Button variant="outline" onClick={refreshTable} className="sm:ml-auto">
              Refresh
            </Button>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading keywords…" />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {tab === 'similar'
                  ? `${tableTotal} similar keyword(s)`
                  : `${tableTotal} keyword(s) total`}
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Seed</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Competition</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((row) => (
                    <TableRow key={row.id || row.keyword_id || row.keyword}>
                      <TableCell className="font-medium">{row.keyword}</TableCell>
                      <TableCell>{row.seed_keyword || '—'}</TableCell>
                      <TableCell className="tabular-nums">{row.avg_monthly_searches ?? '—'}</TableCell>
                      <TableCell className="tabular-nums">{row.competition ?? '—'}</TableCell>
                      <TableCell>
                        {tab !== 'similar' && row.id && (
                          <Button variant="link" size="sm" className="h-auto p-0" onClick={() => showSimilar(row)}>
                            Similar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {tab !== 'similar' && (
                <Pagination
                  page={keywordPage + 1}
                  pageCount={pageCount}
                  pageSize={pageSize}
                  onPageChange={(page) => setKeywordPage(page - 1)}
                  onPageSizeChange={setPageSize}
                  totalItems={total}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
