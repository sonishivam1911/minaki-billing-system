import React, { useCallback, useEffect, useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentsHowTo';
import { LoadingSpinner, ErrorMessage } from '../../components';

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
    <div className="screen-container agents-page">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">Naming Teams</h1>
          <p className="screen-subtitle">Preset and custom mythology / era packs for the name bank</p>
        </div>
      </div>
      <AgentsSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.naming} />
      {errorMessage && <ErrorMessage message={errorMessage} onRetry={() => setErrorMessage(null)} />}

      {!teamsSchemaReady && (
        <div className="agents-card agents-alert">
          <p>
            Naming teams database table is not set up yet. Run{' '}
            <code>homelab-contabo/scripts/migrations/naming_theme_packs.sql</code> on Postgres.
          </p>
        </div>
      )}

      {!nameBankSchemaReady && (
        <div className="agents-card agents-alert">
          <p>
            Name bank tables are missing. Run{' '}
            <code>real-time-minaki-poc/api/scripts/migrations/name_warehouse_minaki_agents.sql</code>{' '}
            on Postgres before generating or browsing names.
          </p>
        </div>
      )}

      <section className="agents-card">
        <h2 className="agents-section-title">Preset teams</h2>
        {!presetTeams.length ? <p className="agents-muted">No preset teams yet.</p> : null}
        <div className="agents-team-grid">
          {presetTeams.map((team) => (
            <div key={team.id} className="agents-team-card">
              <h4>{team.display_name}</h4>
              <p>{team.description}</p>
              <button type="button" className="agents-btn secondary" onClick={() => openGeneratePanel(team.id)}>
                Generate names
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="agents-card">
        <h2 className="agents-section-title">My teams</h2>
        <div className="agents-team-grid">
          {customTeams.map((team) => (
            <div key={team.id} className="agents-team-card">
              <h4>{team.display_name}</h4>
              <p>{team.description || team.era_myth_prompt}</p>
              <div className="agents-actions">
                <button type="button" className="agents-btn secondary" onClick={() => startEditingTeam(team)}>
                  Edit
                </button>
                <button type="button" className="agents-btn secondary" onClick={() => openGeneratePanel(team.id)}>
                  Generate
                </button>
                <button type="button" className="agents-btn secondary" onClick={() => deleteTeam(team.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <h3 className="agents-section-title">{editingTeamId ? 'Edit team' : 'Create custom team'}</h3>
        <div className="agents-form">
          <label>
            Display name
            <input
              value={teamForm.display_name}
              placeholder={TEAM_FORM_PLACEHOLDERS.display_name}
              onChange={(event) => setTeamForm({ ...teamForm, display_name: event.target.value })}
            />
          </label>
          <label>
            Description (optional)
            <input
              value={teamForm.description}
              placeholder={TEAM_FORM_PLACEHOLDERS.description}
              onChange={(event) => setTeamForm({ ...teamForm, description: event.target.value })}
            />
          </label>
          <label>
            Naming flavor (mythology, era, mood)
            <textarea
              rows={3}
              value={teamForm.era_myth_prompt}
              placeholder={TEAM_FORM_PLACEHOLDERS.era_myth_prompt}
              onChange={(event) => setTeamForm({ ...teamForm, era_myth_prompt: event.target.value })}
            />
          </label>
          <label>
            Style preset
            <select
              value={teamForm.naming_style_preset}
              onChange={(event) => setTeamForm({ ...teamForm, naming_style_preset: event.target.value })}
            >
              <option value="minimal">Minimal</option>
              <option value="short_elegant">Short elegant</option>
              <option value="balanced">Balanced</option>
              <option value="grand">Grand</option>
            </select>
          </label>
          <label>
            Product line (optional)
            <select
              value={teamForm.channel_family}
              onChange={(event) => setTeamForm({ ...teamForm, channel_family: event.target.value })}
            >
              <option value="">Auto from category</option>
              <option value="crystal_ad">Crystal</option>
              <option value="kundan">Kundan</option>
              <option value="temple">Temple</option>
              <option value="eleganza">Eleganza</option>
              <option value="lab_grown">Lab grown</option>
            </select>
          </label>
          <button type="button" className="agents-btn primary" onClick={saveTeam} disabled={isSubmitting}>
            {editingTeamId ? 'Save changes' : 'Create team'}
          </button>
        </div>
      </section>

      {activeGenerateTeamId && (
        <section className="agents-card">
          <h2 className="agents-section-title">
            Generate — {activeGenerateTeam?.display_name || 'Team'}
          </h2>
          <label>
            Category
            <input
              value={generateCategory}
              placeholder={TEAM_FORM_PLACEHOLDERS.generateCategory}
              onChange={(event) => setGenerateCategory(event.target.value)}
            />
          </label>
          <div className="agents-actions">
            <button type="button" className="agents-btn primary" onClick={runNameGeneration} disabled={isSubmitting}>
              {isSubmitting ? 'Generating…' : 'Run once'}
            </button>
            <button
              type="button"
              className="agents-btn secondary"
              onClick={() => {
                setActiveGenerateTeamId(null);
                setGenerateResult(null);
                setNameBankTeamFilter('');
              }}
            >
              Close
            </button>
          </div>
          {generateResult && (
            <p className="agents-validation">
              Saved {generateResult.names_upserted ?? 0} names
              {generateResult.generation_run_id ? ` (run #${generateResult.generation_run_id})` : ''}.
              {generateResult.search_query ? ` Search: ${generateResult.search_query}` : ''}
            </p>
          )}
        </section>
      )}

      <section className="agents-card">
        <h2 className="agents-section-title">Name bank</h2>
        <div className="agents-search-row">
          <input
            placeholder="Search name or meaning…"
            value={nameBankSearch}
            onChange={(event) => setNameBankSearch(event.target.value)}
          />
          <input
            placeholder="Filter category…"
            value={nameBankCategoryFilter}
            onChange={(event) => setNameBankCategoryFilter(event.target.value)}
          />
          <select value={nameBankTeamFilter} onChange={(event) => setNameBankTeamFilter(event.target.value)}>
            <option value="">All teams</option>
            {teams.map((team) => (
              <option key={team.id} value={String(team.id)}>
                {team.display_name}
              </option>
            ))}
          </select>
          <button type="button" className="agents-btn secondary" onClick={loadNameBank}>
            Refresh
          </button>
        </div>

        {nameBankLoading ? (
          <LoadingSpinner message="Loading names…" />
        ) : (
          <div className="agents-table-wrap">
            <p className="agents-preview-skus">
              Showing {nameBankRangeStart}–{nameBankRangeEnd} of {nameBankTotal}
            </p>
            {!nameBankRows.length ? (
              <p className="agents-muted">No names yet. Pick a team and run Generate above.</p>
            ) : (
              <>
              <table className="agents-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Meaning</th>
                    <th>Category</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {nameBankRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{row.meaning}</td>
                      <td>{row.category || '—'}</td>
                      <td>{row.status || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {nameBankTotal > NAME_BANK_PAGE_SIZE && (
                <div className="agents-actions">
                  <button
                    type="button"
                    className="agents-btn secondary"
                    disabled={nameBankPage === 0}
                    onClick={() => setNameBankPage((page) => page - 1)}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="agents-btn secondary"
                    disabled={(nameBankPage + 1) * NAME_BANK_PAGE_SIZE >= nameBankTotal}
                    onClick={() => setNameBankPage((page) => page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
