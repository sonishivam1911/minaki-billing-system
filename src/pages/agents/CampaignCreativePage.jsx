import React, { useEffect, useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { AgentsPagedTable } from '../../components/agents/AgentsPagedTable';
import { LoadingSpinner } from '../../components';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select';
import {
  collectHttpImageUrls,
  normalizeCampaignRunForDisplay,
} from './campaignCreativeRun';

const RECENT_RUNS_LIMIT = 15;
const POSTS_PER_WEEK_OPTIONS = [3, 5, 7, 14];

const RECENT_RUNS_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'brand_kit_id', label: 'Kit', render: (row) => row.brand_kit_id || '—' },
  { key: 'status', label: 'Status' },
  {
    key: 'created_at',
    label: 'Created',
    render: (row) => (row.created_at ? String(row.created_at).slice(0, 19) : '—'),
  },
];

const approvalBadgeVariant = (status) => {
  switch (status) {
    case 'approved':
      return 'success';
    case 'rejected':
      return 'destructive';
    case 'needs_review':
      return 'warning';
    default:
      return 'default';
  }
};

export const CampaignCreativePage = () => {
  const [brandKits, setBrandKits] = useState([]);
  const [brandKitId, setBrandKitId] = useState('modern');
  const [campaignGoal, setCampaignGoal] = useState('awareness');
  const [postsPerWeek, setPostsPerWeek] = useState(5);
  const [horizonDays, setHorizonDays] = useState(14);
  const [notifyEmails, setNotifyEmails] = useState('');
  const [schemaReady, setSchemaReady] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeRun, setActiveRun] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);
  const [recentRunsTotal, setRecentRunsTotal] = useState(0);
  const [recentRunsLoading, setRecentRunsLoading] = useState(false);
  const [regenerateHint, setRegenerateHint] = useState('');

  const loadBrandKits = async () => {
    try {
      const response = await agentsApi.listCampaignBrandKits();
      setBrandKits(response.kits || []);
      setSchemaReady(response.schema_ready !== false);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const loadRecentRuns = async () => {
    setRecentRunsLoading(true);
    try {
      const response = await agentsApi.listCampaignRuns({ limit: RECENT_RUNS_LIMIT });
      setRecentRuns(response.items || []);
      setRecentRunsTotal(response.total || 0);
      setSchemaReady(response.schema_ready !== false);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setRecentRunsLoading(false);
    }
  };

  useEffect(() => {
    loadBrandKits();
    loadRecentRuns();
  }, []);

  const createCampaignRun = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.createCampaignRun({
        brand_kit_id: brandKitId,
        campaign_goal: campaignGoal.trim() || 'awareness',
        posts_per_week: postsPerWeek,
        horizon_days: horizonDays,
        notify_emails: notifyEmails
          .split(',')
          .map((email) => email.trim())
          .filter(Boolean),
      });
      setActiveRun(normalizeCampaignRunForDisplay(response));
      await loadRecentRuns();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewRunDetails = async (runId) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const runRow = await agentsApi.getCampaignRun(runId);
      setActiveRun(normalizeCampaignRunForDisplay(runRow));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const approveTheme = async (themeKey, approvalStatus) => {
    if (!activeRun?.runId) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.approveCampaignTheme(activeRun.runId, themeKey, {
        approval_status: approvalStatus,
      });
      setActiveRun(normalizeCampaignRunForDisplay(response));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const regenerateTheme = async (themeKey) => {
    if (!activeRun?.runId) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.regenerateCampaignTheme(activeRun.runId, themeKey, {
        hint: regenerateHint,
      });
      setActiveRun(normalizeCampaignRunForDisplay(response));
      setRegenerateHint('');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const produceTheme = async (themeKey) => {
    if (!activeRun?.runId) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.produceCampaignTheme(activeRun.runId, themeKey);
      setActiveRun(normalizeCampaignRunForDisplay(response));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const produceAllApproved = async () => {
    if (!activeRun?.runId) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.produceAllApprovedCampaignThemes(activeRun.runId);
      setActiveRun(normalizeCampaignRunForDisplay(response));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const approveAsset = async (themeKey, assetId, approvalStatus) => {
    if (!activeRun?.runId) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.approveCampaignAsset(activeRun.runId, themeKey, {
        asset_id: assetId,
        approval_status: approvalStatus,
      });
      setActiveRun(normalizeCampaignRunForDisplay(response));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalizeCampaign = async () => {
    if (!activeRun?.runId) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.finalizeCampaignRun(activeRun.runId, {
        notify_emails: notifyEmails
          .split(',')
          .map((email) => email.trim())
          .filter(Boolean),
      });
      setActiveRun(normalizeCampaignRunForDisplay(response));
      await loadRecentRuns();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const themes = activeRun?.themes || [];

  return (
    <div className="minaki-ui mx-auto max-w-6xl px-4 py-6 pb-16 sm:px-6">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold sm:text-3xl">Campaign Creative</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Plan Instagram UGC campaigns, approve themes, produce assets, and download ZIP packs
        </p>
      </header>
      <AgentsSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.campaign} />
      {errorMessage && (
        <Alert variant="destructive" title="Something went wrong" className="mb-4">
          {errorMessage}
        </Alert>
      )}

      {!schemaReady && (
        <Alert variant="warning" title="Campaign creative runs table is missing" className="mb-4">
          Apply <code>homelab-contabo/scripts/migrations/minaki_agents_campaign_creative_pod.sql</code> on
          Postgres.
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>New campaign run</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Brand kit</Label>
              <Select value={brandKitId} onValueChange={setBrandKitId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {brandKits.map((kit) => (
                    <SelectItem key={kit.id} value={kit.id}>
                      {kit.label} — {kit.description}
                    </SelectItem>
                  ))}
                  {!brandKits.length && (
                    <>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="traditional">Traditional</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="campaign-goal">Campaign goal</Label>
              <Input
                id="campaign-goal"
                value={campaignGoal}
                onChange={(event) => setCampaignGoal(event.target.value)}
                placeholder="e.g. awareness, gifting season, everyday wear"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Posts per week</Label>
              <Select
                value={String(postsPerWeek)}
                onValueChange={(value) => setPostsPerWeek(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSTS_PER_WEEK_OPTIONS.map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="horizon-days">Horizon (days)</Label>
              <Input
                id="horizon-days"
                type="number"
                min={7}
                max={28}
                value={horizonDays}
                onChange={(event) => setHorizonDays(Number(event.target.value))}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notify-emails">Notify emails (comma-separated)</Label>
              <Input
                id="notify-emails"
                value={notifyEmails}
                onChange={(event) => setNotifyEmails(event.target.value)}
                placeholder="you@minaki.com, team@minaki.com"
              />
            </div>
          </div>

          <Button onClick={createCampaignRun} disabled={isSubmitting || !schemaReady}>
            {isSubmitting ? 'Generating plan…' : 'Create campaign plan'}
          </Button>
          {isSubmitting && (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              LLM is building your 2-week theme calendar. Keep this tab open.
            </p>
          )}
        </CardContent>
      </Card>

      {activeRun && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              Run #{activeRun.runId} — {activeRun.status}
            </CardTitle>
            {activeRun.strategySummary && <CardDescription>{activeRun.strategySummary}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            {activeRun.errorMessage && <Alert variant="destructive">{activeRun.errorMessage}</Alert>}

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={produceAllApproved} disabled={isSubmitting}>
                Produce all approved themes
              </Button>
              <Button onClick={finalizeCampaign} disabled={isSubmitting}>
                Finalize &amp; email ZIP
              </Button>
              {activeRun.zipUrl && (
                <Button variant="secondary" asChild>
                  <a href={activeRun.zipUrl} target="_blank" rel="noreferrer">
                    Download ZIP
                  </a>
                </Button>
              )}
            </div>

            <div className="max-w-md space-y-1.5">
              <Label htmlFor="regenerate-hint">Regenerate hint (optional, applies to next theme regen)</Label>
              <Input
                id="regenerate-hint"
                value={regenerateHint}
                onChange={(event) => setRegenerateHint(event.target.value)}
                placeholder="e.g. more gifting angle, less product-forward"
              />
            </div>

            <div className="space-y-4">
              {themes.map((theme) => {
                const frameUrls = collectHttpImageUrls(theme.ugc_package?.frames || []);
                return (
                  <Card key={theme.theme_key}>
                    <CardHeader>
                      <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                        {theme.name || theme.theme_key}
                        <Badge variant={approvalBadgeVariant(theme.approval_status)}>
                          {theme.approval_status || 'pending'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {theme.scheduled_date} · {theme.angle}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {theme.hook && (
                        <p className="text-sm">
                          <strong className="font-semibold">Hook:</strong> {theme.hook}
                        </p>
                      )}
                      {theme.caption_draft && <p className="text-sm italic">{theme.caption_draft}</p>}
                      {(theme.qc_issues || []).length > 0 && (
                        <Alert variant="warning" title="QC">
                          {theme.qc_issues.join('; ')}
                        </Alert>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => approveTheme(theme.theme_key, 'approved')}
                          disabled={isSubmitting}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => approveTheme(theme.theme_key, 'rejected')}
                          disabled={isSubmitting}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => regenerateTheme(theme.theme_key)}
                          disabled={isSubmitting}
                        >
                          Regenerate
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => produceTheme(theme.theme_key)}
                          disabled={isSubmitting || theme.approval_status !== 'approved'}
                        >
                          Produce UGC
                        </Button>
                      </div>

                      {frameUrls.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                          {frameUrls.map((imageUrl) => (
                            <a
                              key={imageUrl}
                              href={imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block overflow-hidden rounded-md border border-[var(--color-border)]"
                            >
                              <img src={imageUrl} alt="UGC frame" loading="lazy" className="h-full w-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}

                      {theme.ugc_package && (
                        <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
                          <h4 className="text-sm font-semibold">Asset review</h4>
                          {theme.ugc_package.caption && (
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={approvalBadgeVariant(theme.ugc_package.caption.approval_status)}>
                                Caption ({theme.ugc_package.caption.approval_status || 'pending'})
                              </Badge>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => approveAsset(theme.theme_key, 'caption', 'approved')}
                                disabled={isSubmitting}
                              >
                                Approve caption
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => approveAsset(theme.theme_key, 'caption', 'rejected')}
                                disabled={isSubmitting}
                              >
                                Reject caption
                              </Button>
                            </div>
                          )}
                          {(theme.ugc_package.frames || []).map((frame) => (
                            <div key={frame.asset_id} className="flex flex-wrap items-center gap-2">
                              <Badge variant={approvalBadgeVariant(frame.approval_status)}>
                                {frame.asset_id} ({frame.approval_status || 'pending'})
                              </Badge>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => approveAsset(theme.theme_key, frame.asset_id, 'approved')}
                                disabled={isSubmitting}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => approveAsset(theme.theme_key, frame.asset_id, 'rejected')}
                                disabled={isSubmitting}
                              >
                                Reject
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent runs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={loadRecentRuns} disabled={recentRunsLoading}>
              Refresh
            </Button>
            <p className="text-sm text-[var(--color-muted-foreground)]">{recentRunsTotal} total runs</p>
          </div>
          {recentRunsLoading ? (
            <LoadingSpinner message="Loading runs…" />
          ) : (
            <AgentsPagedTable
              columns={[
                ...RECENT_RUNS_COLUMNS,
                {
                  key: 'view',
                  label: '',
                  render: (row) => (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => viewRunDetails(row.id)}
                    >
                      View
                    </Button>
                  ),
                },
              ]}
              rows={recentRuns}
              getRowId={(row) => row.id}
              emptyLabel="No campaign runs yet."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
