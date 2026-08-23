import React, { useEffect, useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
import { LoadingSpinner } from '../../components';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select';

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
const AUTO_VALUE = '__auto__';
const DEFAULT_VALUE = '__default__';

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
      <div className="minaki-ui mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-semibold sm:text-3xl">Agent Settings</h1>
        <AgentsSubnav />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="minaki-ui mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold sm:text-3xl">Agent Settings</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Global generation defaults shared by Collection Builder, Creative Pod, and Campaign
          Creative — stored on the server, editable without a redeploy.
        </p>
      </header>
      <AgentsSubnav />
      {errorMessage && (
        <Alert variant="destructive" title="Couldn't load settings" className="mb-6">
          {errorMessage}
        </Alert>
      )}

      <div className="space-y-6">
        {SCOPES.map((scope) => {
          const config = settings[scope.key] || {};
          const laneVariants = visualVariantsByLane[config.brand_lane] || [];
          return (
            <Card key={scope.key}>
              <CardHeader>
                <CardTitle>{scope.label}</CardTitle>
                <CardDescription>{scope.description}</CardDescription>
              </CardHeader>

              <CardContent className="grid gap-4 sm:grid-cols-2">
                {scope.fields.includes('brand_lane') && (
                  <div className="space-y-1.5">
                    <Label>Default vertical</Label>
                    <Select
                      value={config.brand_lane || AUTO_VALUE}
                      onValueChange={(value) =>
                        updateField(scope.key, 'brand_lane', value === AUTO_VALUE ? '' : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AUTO_VALUE}>Auto-classify from brief</SelectItem>
                        {brandLanes.map((row) => (
                          <SelectItem key={row.value} value={row.value}>
                            {row.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {scope.fields.includes('visual_sub_variant') && (
                  <div className="space-y-1.5">
                    <Label>Default scene / mood</Label>
                    <Select
                      value={config.visual_sub_variant || DEFAULT_VALUE}
                      onValueChange={(value) =>
                        updateField(scope.key, 'visual_sub_variant', value === DEFAULT_VALUE ? '' : value)
                      }
                      disabled={!config.brand_lane}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DEFAULT_VALUE}>
                          {config.brand_lane ? "Lane's default scene" : 'Pick a vertical first'}
                        </SelectItem>
                        {laneVariants.map((row) => (
                          <SelectItem key={row.value} value={row.value}>
                            {row.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {scope.fields.includes('image_model') && (
                  <div className="space-y-1.5">
                    <Label>Default image model</Label>
                    <Select
                      value={config.image_model || DEFAULT_VALUE}
                      onValueChange={(value) =>
                        updateField(scope.key, 'image_model', value === DEFAULT_VALUE ? '' : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DEFAULT_VALUE}>Use pipeline default</SelectItem>
                        {imageModels.map((row) => (
                          <SelectItem key={row.value} value={row.value}>
                            {row.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {scope.fields.includes('text_model') && (
                  <div className="space-y-1.5">
                    <Label>Default text model</Label>
                    <Select
                      value={config.text_model || DEFAULT_VALUE}
                      onValueChange={(value) =>
                        updateField(scope.key, 'text_model', value === DEFAULT_VALUE ? '' : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DEFAULT_VALUE}>Use pipeline default</SelectItem>
                        {textModels.map((row) => (
                          <SelectItem key={row.value} value={row.value}>
                            {row.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {scope.fields.includes('variant_count') && (
                  <div className="space-y-1.5">
                    <Label>Default image variants</Label>
                    <Select
                      value={String(config.variant_count || 1)}
                      onValueChange={(value) => updateField(scope.key, 'variant_count', Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VARIANT_COUNT_OPTIONS.map((value) => (
                          <SelectItem key={value} value={String(value)}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex-wrap items-center gap-3">
                <Button onClick={() => saveScope(scope.key)} disabled={saving[scope.key]}>
                  {saving[scope.key] ? 'Saving…' : 'Save defaults'}
                </Button>
                {savedAt[scope.key] && (
                  <span className="text-sm text-[var(--color-muted-foreground)]">
                    Last saved {new Date(savedAt[scope.key]).toLocaleString()}
                  </span>
                )}
                {saveError[scope.key] && (
                  <Alert variant="destructive" className="w-full">
                    {saveError[scope.key]}
                  </Alert>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
