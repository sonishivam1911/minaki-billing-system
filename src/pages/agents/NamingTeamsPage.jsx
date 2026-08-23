import React, { useCallback, useEffect, useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { LoadingSpinner } from '../../components';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select';

const EMPTY_TEAM_FORM = {
  display_name: '',
  description: '',
  era_myth_prompt: '',
  channel_family: '',
  naming_style_preset: 'balanced',
};

const TEAM_FORM_PLACEHOLDERS = {
  display_name: 'e.g. Moonlit Mughal',
  description: 'Short note shown on the team card (optional)',
  era_myth_prompt:
    'e.g. Greek mythology — dawn, stars, and feminine goddess names. This guides the name generator.',
  generateCategory: 'e.g. Crystal Earrings, Kundan Choker Set',
};

const NAME_BANK_PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;
const AUTO_CHANNEL_VALUE = '__auto__';
const ALL_TEAMS_VALUE = '__all__';

export const NamingTeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [teamsSchemaReady, setTeamsSchemaReady] = useState(true);
  const [nameBankSchemaReady, setNameBankSchemaReady] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [nameBankLoading, setNameBankLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [teamForm, setTeamForm] = useState(EMPTY_TEAM_FORM);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [activeGenerateTeamId, setActiveGenerateTeamId] = useState(null);
  const [generateCategory, setGenerateCategory] = useState('Crystal Earrings');
  const [generateResult, setGenerateResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameBankRows, setNameBankRows] = useState([]);
  const [nameBankTotal, setNameBankTotal] = useState(0);
  const [nameBankSearch, setNameBankSearch] = useState('');
  const [debouncedNameBankSearch, setDebouncedNameBankSearch] = useState('');
  const [nameBankCategoryFilter, setNameBankCategoryFilter] = useState('');
  const [nameBankTeamFilter, setNameBankTeamFilter] = useState('');
  const [nameBankPage, setNameBankPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedNameBankSearch(nameBankSearch), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [nameBankSearch]);

  useEffect(() => {
    setNameBankPage(0);
  }, [debouncedNameBankSearch, nameBankCategoryFilter, nameBankTeamFilter]);

  const loadTeams = () => {
    setTeamsLoading(true);
    agentsApi
      .listNamingTeams()
      .then((response) => {
        setTeams(response.teams || []);
        setTeamsSchemaReady(response.schema_ready !== false);
      })
      .catch((error) => setErrorMessage(error.message))
      .finally(() => setTeamsLoading(false));
  };

  const loadNameBank = useCallback(async () => {
    setNameBankLoading(true);
    try {
      const offset = nameBankPage * NAME_BANK_PAGE_SIZE;
      const response = await agentsApi.listNames({
        q: debouncedNameBankSearch || undefined,
        category: nameBankCategoryFilter || undefined,
        team_id: nameBankTeamFilter || undefined,
        limit: NAME_BANK_PAGE_SIZE,
        offset,
      });
      setNameBankRows(response.items || []);
      setNameBankTotal(response.total || 0);
      setNameBankSchemaReady(response.schema_ready !== false);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setNameBankLoading(false);
    }
  }, [debouncedNameBankSearch, nameBankCategoryFilter, nameBankTeamFilter, nameBankPage]);

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    loadNameBank();
  }, [loadNameBank]);

  const presetTeams = teams.filter((team) => team.is_system);
  const customTeams = teams.filter((team) => !team.is_system);
  const activeGenerateTeam = teams.find((team) => team.id === activeGenerateTeamId);

  const openGeneratePanel = (teamId) => {
    setActiveGenerateTeamId(teamId);
    setNameBankTeamFilter(String(teamId));
    setGenerateResult(null);
  };

  const saveTeam = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const payload = {
        ...teamForm,
        channel_family: teamForm.channel_family || null,
      };
      if (editingTeamId) {
        await agentsApi.updateNamingTeam(editingTeamId, payload);
      } else {
        await agentsApi.createNamingTeam(payload);
      }
      setTeamForm(EMPTY_TEAM_FORM);
      setEditingTeamId(null);
      loadTeams();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditingTeam = (team) => {
    setEditingTeamId(team.id);
    setTeamForm({
      display_name: team.display_name || '',
      description: team.description || '',
      era_myth_prompt: team.era_myth_prompt || '',
      channel_family: team.channel_family || '',
      naming_style_preset: team.naming_style_preset || 'balanced',
    });
  };

  const deleteTeam = async (teamId) => {
    if (!window.confirm('Delete this custom naming team?')) {
      return;
    }
    setIsSubmitting(true);
    try {
      await agentsApi.deleteNamingTeam(teamId);
      if (String(nameBankTeamFilter) === String(teamId)) {
        setNameBankTeamFilter('');
      }
      if (activeGenerateTeamId === teamId) {
        setActiveGenerateTeamId(null);
        setGenerateResult(null);
      }
      loadTeams();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const runNameGeneration = async () => {
    if (!activeGenerateTeamId) {
      return;
    }
    setIsSubmitting(true);
    setGenerateResult(null);
    setErrorMessage(null);
    try {
      const response = await agentsApi.generateNamesForTeam(activeGenerateTeamId, {
        category: generateCategory,
      });
      setGenerateResult(response);
      setNameBankCategoryFilter(generateCategory);
      setNameBankTeamFilter(String(activeGenerateTeamId));
      await loadNameBank();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nameBankRangeStart = nameBankTotal === 0 ? 0 : nameBankPage * NAME_BANK_PAGE_SIZE + 1;
  const nameBankRangeEnd = Math.min(nameBankPage * NAME_BANK_PAGE_SIZE + nameBankRows.length, nameBankTotal);

  if (teamsLoading && !teams.length) {
    return <LoadingSpinner message="Loading naming teams…" />;
  }

  return (
    <div className="minaki-ui mx-auto max-w-6xl px-4 py-6 pb-16 sm:px-6">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold sm:text-3xl">Naming Teams</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Preset and custom mythology / era packs for the name bank
        </p>
      </header>
      <AgentsSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.naming} />
      {errorMessage && (
        <Alert variant="destructive" title="Something went wrong" className="mb-4">
          {errorMessage}
        </Alert>
      )}

      {!teamsSchemaReady && (
        <Alert variant="warning" title="Naming teams table not set up" className="mb-4">
          Run <code>homelab-contabo/scripts/migrations/naming_theme_packs.sql</code> on Postgres.
        </Alert>
      )}

      {!nameBankSchemaReady && (
        <Alert variant="warning" title="Name bank tables missing" className="mb-4">
          Run <code>real-time-minaki-poc/api/scripts/migrations/name_warehouse_minaki_agents.sql</code> on
          Postgres before generating or browsing names.
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Preset teams</CardTitle>
        </CardHeader>
        <CardContent>
          {!presetTeams.length ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No preset teams yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {presetTeams.map((team) => (
                <Card key={team.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{team.display_name}</CardTitle>
                    <CardDescription>{team.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="secondary" size="sm" onClick={() => openGeneratePanel(team.id)}>
                      Generate names
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>My teams</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {customTeams.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {customTeams.map((team) => (
                <Card key={team.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{team.display_name}</CardTitle>
                    <CardDescription>{team.description || team.era_myth_prompt}</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => startEditingTeam(team)}>
                      Edit
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => openGeneratePanel(team.id)}>
                      Generate
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteTeam(team.id)}>
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          <div>
            <h3 className="mb-3 text-sm font-semibold">
              {editingTeamId ? 'Edit team' : 'Create custom team'}
            </h3>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="team-display-name">Display name</Label>
                  <Input
                    id="team-display-name"
                    value={teamForm.display_name}
                    placeholder={TEAM_FORM_PLACEHOLDERS.display_name}
                    onChange={(event) => setTeamForm({ ...teamForm, display_name: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="team-description">Description (optional)</Label>
                  <Input
                    id="team-description"
                    value={teamForm.description}
                    placeholder={TEAM_FORM_PLACEHOLDERS.description}
                    onChange={(event) => setTeamForm({ ...teamForm, description: event.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="team-era-myth">Naming flavor (mythology, era, mood)</Label>
                <Textarea
                  id="team-era-myth"
                  rows={3}
                  value={teamForm.era_myth_prompt}
                  placeholder={TEAM_FORM_PLACEHOLDERS.era_myth_prompt}
                  onChange={(event) => setTeamForm({ ...teamForm, era_myth_prompt: event.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Style preset</Label>
                  <Select
                    value={teamForm.naming_style_preset}
                    onValueChange={(value) => setTeamForm({ ...teamForm, naming_style_preset: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="short_elegant">Short elegant</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="grand">Grand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Product line (optional)</Label>
                  <Select
                    value={teamForm.channel_family || AUTO_CHANNEL_VALUE}
                    onValueChange={(value) =>
                      setTeamForm({
                        ...teamForm,
                        channel_family: value === AUTO_CHANNEL_VALUE ? '' : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AUTO_CHANNEL_VALUE}>Auto from category</SelectItem>
                      <SelectItem value="crystal_ad">Crystal</SelectItem>
                      <SelectItem value="kundan">Kundan</SelectItem>
                      <SelectItem value="temple">Temple</SelectItem>
                      <SelectItem value="eleganza">Eleganza</SelectItem>
                      <SelectItem value="lab_grown">Lab grown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={saveTeam} disabled={isSubmitting}>
                {editingTeamId ? 'Save changes' : 'Create team'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {activeGenerateTeamId && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Generate — {activeGenerateTeam?.display_name || 'Team'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-sm space-y-1.5">
              <Label htmlFor="generate-category">Category</Label>
              <Input
                id="generate-category"
                value={generateCategory}
                placeholder={TEAM_FORM_PLACEHOLDERS.generateCategory}
                onChange={(event) => setGenerateCategory(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={runNameGeneration} disabled={isSubmitting}>
                {isSubmitting ? 'Generating…' : 'Run once'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setActiveGenerateTeamId(null);
                  setGenerateResult(null);
                  setNameBankTeamFilter('');
                }}
              >
                Close
              </Button>
            </div>
            {generateResult && (
              <Alert variant="success">
                Saved {generateResult.names_upserted ?? 0} names
                {generateResult.generation_run_id ? ` (run #${generateResult.generation_run_id})` : ''}.
                {generateResult.search_query ? ` Search: ${generateResult.search_query}` : ''}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Name bank</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Input
              placeholder="Search name or meaning…"
              value={nameBankSearch}
              onChange={(event) => setNameBankSearch(event.target.value)}
              className="sm:max-w-xs"
            />
            <Input
              placeholder="Filter category…"
              value={nameBankCategoryFilter}
              onChange={(event) => setNameBankCategoryFilter(event.target.value)}
              className="sm:max-w-xs"
            />
            <Select
              value={nameBankTeamFilter || ALL_TEAMS_VALUE}
              onValueChange={(value) => setNameBankTeamFilter(value === ALL_TEAMS_VALUE ? '' : value)}
            >
              <SelectTrigger className="sm:max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_TEAMS_VALUE}>All teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={String(team.id)}>
                    {team.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadNameBank} className="sm:ml-auto">
              Refresh
            </Button>
          </div>

          {nameBankLoading ? (
            <LoadingSpinner message="Loading names…" />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Showing {nameBankRangeStart}–{nameBankRangeEnd} of {nameBankTotal}
              </p>
              {!nameBankRows.length ? (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  No names yet. Pick a team and run Generate above.
                </p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Meaning</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nameBankRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell>{row.meaning}</TableCell>
                          <TableCell>{row.category || '—'}</TableCell>
                          <TableCell>{row.status || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {nameBankTotal > NAME_BANK_PAGE_SIZE && (
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={nameBankPage === 0}
                        onClick={() => setNameBankPage((page) => page - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={(nameBankPage + 1) * NAME_BANK_PAGE_SIZE >= nameBankTotal}
                        onClick={() => setNameBankPage((page) => page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
