import React, { useEffect, useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
import { LoadingSpinner, ErrorMessage } from '../../components';

const SCOPES = [
  {
    key: 'collection_builder',
    label: 'Collection Builder',
    description:
      "Defaults used when generating a collection banner. Without a brand lane here, the run auto-classifies from the collection brief text — which almost always lands on Demi Fine, since the brief never contains vertical-signal keywords. Set a lane (and optionally a scene) to break that pattern; each run can still override these on the fly.",
    fields: ['brand_lane', 'visual_sub_variant', 'image_model', 'text_model', 'variant_count'],
  },
  {
    key: 'creative_pod',
    label: 'Creative Pod (Banner Generation)',
    description: 'Defaults pre-filled on a new Creative Pod run — still overridable per run.',
    fields: ['brand_lane', 'visual_sub_variant', 'image_model', 'text_model', 'variant_count'],
  },
  {
    key: 'campaign_creative',
    label: 'Campaign Creative',
    description: 'Default brand lane / scene for new campaign themes.',
    fields: ['brand_lane', 'visual_sub_variant'],
  },
];

const VARIANT_COUNT_OPTIONS = [1, 2, 3];

export const AgentSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [brandLanes, setBrandLanes] = useState([]);
  const [imageModels, setImageModels] = useState([]);
  const [textModels, setTextModels] = useState([]);
  const [visualVariantsByLane, setVisualVariantsByLane] = useState({});
  const [settings, setSettings] = useState({});
  const [savedAt, setSavedAt] = useState({});
  const [saving, setSaving] = useState({});
  const [saveError, setSaveError] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const [brandLanesResponse, imageModelsResponse, textModelsResponse, ...settingsResponses] =
          await Promise.all([
            agentsApi.listCreativePodBrandLanes(),
            agentsApi.listCreativePodModels(),
            agentsApi.listCreativePodTextModels(),
            ...SCOPES.map((scope) => agentsApi.getAgentSettings(scope.key)),
          ]);
        setBrandLanes(brandLanesResponse.brand_lanes || []);
        setImageModels(imageModelsResponse.models || []);
        setTextModels(textModelsResponse.models || []);

        const nextSettings = {};
        const nextSavedAt = {};
        SCOPES.forEach((scope, index) => {
          const response = settingsResponses[index];
          nextSettings[scope.key] = response.config || {};
          nextSavedAt[scope.key] = response.updated_at || null;
        });
        setSettings(nextSettings);
        setSavedAt(nextSavedAt);

        const lanesToPreload = new Set(
          Object.values(nextSettings)
            .map((config) => config.brand_lane)
            .filter(Boolean)
        );
        await Promise.all([...lanesToPreload].map(loadVisualVariants));
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadVisualVariants = async (lane) => {
    if (!lane || visualVariantsByLane[lane]) return;
    try {
      const response = await agentsApi.listCreativePodVisualVariants(lane);
      setVisualVariantsByLane((prev) => ({ ...prev, [lane]: response.visual_sub_variants || [] }));
    } catch {
      setVisualVariantsByLane((prev) => ({ ...prev, [lane]: [] }));
    }
  };

  const updateField = (scopeKey, field, value) => {
    setSettings((prev) => {
      const nextConfig = { ...(prev[scopeKey] || {}), [field]: value || null };
      if (field === 'brand_lane') {
        // Old scene may not exist under the new lane — clear it and load the
        // new lane's options so the picker below doesn't show a stale value.
        nextConfig.visual_sub_variant = null;
        if (value) loadVisualVariants(value);
      }
      return { ...prev, [scopeKey]: nextConfig };
    });
  };

  const saveScope = async (scopeKey) => {
    setSaving((prev) => ({ ...prev, [scopeKey]: true }));
    setSaveError((prev) => ({ ...prev, [scopeKey]: null }));
    try {
      const response = await agentsApi.saveAgentSettings(scopeKey, settings[scopeKey] || {});
      setSettings((prev) => ({ ...prev, [scopeKey]: response.config || {} }));
      setSavedAt((prev) => ({ ...prev, [scopeKey]: response.updated_at || null }));
    } catch (error) {
      setSaveError((prev) => ({ ...prev, [scopeKey]: error.message }));
    } finally {
      setSaving((prev) => ({ ...prev, [scopeKey]: false }));
    }
  };

  if (loading) {
    return (
      <div className="screen-container agents-page">
        <div className="screen-header">
          <h1 className="screen-title">Agent Settings</h1>
        </div>
        <AgentsSubnav />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="screen-container agents-page">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">Agent Settings</h1>
          <p className="screen-subtitle">
            Global generation defaults shared by Collection Builder, Creative Pod, and Campaign
            Creative — stored on the server, editable without a redeploy.
          </p>
        </div>
      </div>
      <AgentsSubnav />
      {errorMessage && <ErrorMessage message={errorMessage} onRetry={() => setErrorMessage(null)} />}

      {SCOPES.map((scope) => {
        const config = settings[scope.key] || {};
        const laneVariants = visualVariantsByLane[config.brand_lane] || [];
        return (
          <section className="agents-card" key={scope.key}>
            <h2 className="agents-section-title">{scope.label}</h2>
            <p className="agents-muted">{scope.description}</p>

            <div className="agents-form-stack">
              {scope.fields.includes('brand_lane') && (
                <label>
                  Default vertical
                  <select
                    value={config.brand_lane || ''}
                    onChange={(event) => updateField(scope.key, 'brand_lane', event.target.value)}
                  >
                    <option value="">Auto-classify from brief</option>
                    {brandLanes.map((row) => (
                      <option key={row.value} value={row.value}>
                        {row.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {scope.fields.includes('visual_sub_variant') && (
                <label>
                  Default scene / mood
                  <select
                    value={config.visual_sub_variant || ''}
                    onChange={(event) =>
                      updateField(scope.key, 'visual_sub_variant', event.target.value)
                    }
                    disabled={!config.brand_lane}
                  >
                    <option value="">
                      {config.brand_lane ? "Lane's default scene" : 'Pick a vertical first'}
                    </option>
                    {laneVariants.map((row) => (
                      <option key={row.value} value={row.value}>
                        {row.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {scope.fields.includes('image_model') && (
                <label>
                  Default image model
                  <select
                    value={config.image_model || ''}
                    onChange={(event) => updateField(scope.key, 'image_model', event.target.value)}
                  >
                    <option value="">Use pipeline default</option>
                    {imageModels.map((row) => (
                      <option key={row.value} value={row.value}>
                        {row.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {scope.fields.includes('text_model') && (
                <label>
                  Default text model
                  <select
                    value={config.text_model || ''}
                    onChange={(event) => updateField(scope.key, 'text_model', event.target.value)}
                  >
                    <option value="">Use pipeline default</option>
                    {textModels.map((row) => (
                      <option key={row.value} value={row.value}>
                        {row.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {scope.fields.includes('variant_count') && (
                <label>
                  Default image variants
                  <select
                    value={config.variant_count || 1}
                    onChange={(event) =>
                      updateField(scope.key, 'variant_count', Number(event.target.value))
                    }
                  >
                    {VARIANT_COUNT_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className="agents-actions-row">
              <button
                type="button"
                className="agents-btn primary"
                onClick={() => saveScope(scope.key)}
                disabled={saving[scope.key]}
              >
                {saving[scope.key] ? 'Saving…' : 'Save defaults'}
              </button>
              {savedAt[scope.key] && (
                <span className="agents-muted-inline">
                  Last saved {new Date(savedAt[scope.key]).toLocaleString()}
                </span>
              )}
            </div>
            {saveError[scope.key] && <ErrorMessage message={saveError[scope.key]} />}
          </section>
        );
      })}
    </div>
  );
};
