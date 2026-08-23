import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CollectionsOutlinedIcon from '@mui/icons-material/CollectionsOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import { agentsApi } from '../../services/agentsApi';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { LoadingSpinner, ErrorMessage } from '../../components';

const SCOPES = [
  {
    key: 'collection_builder',
    label: 'Collection Builder',
    usedOn: 'Collection pages',
    icon: CollectionsOutlinedIcon,
    description:
      "Defaults used when generating a collection banner. Without a brand lane here, the run auto-classifies from the collection brief text — which almost always lands on Demi Fine, since the brief never contains vertical-signal keywords. Set a lane (and optionally a scene) to break that pattern; each run can still override these on the fly.",
    fields: ['brand_lane', 'visual_sub_variant', 'image_model', 'text_model', 'variant_count'],
  },
  {
    key: 'creative_pod',
    label: 'Creative Pod (Banner Generation)',
    usedOn: 'Creative Pod runs',
    icon: ImageOutlinedIcon,
    description: 'Defaults pre-filled on a new Creative Pod run — still overridable per run.',
    fields: ['brand_lane', 'visual_sub_variant', 'image_model', 'text_model', 'variant_count'],
  },
  {
    key: 'campaign_creative',
    label: 'Campaign Creative',
    usedOn: 'Campaign themes',
    icon: CampaignOutlinedIcon,
    description: 'Default brand lane / scene for new campaign themes.',
    fields: ['brand_lane', 'visual_sub_variant'],
  },
];

const VARIANT_COUNT_OPTIONS = [1, 2, 3];
const DESCRIPTION_TRUNCATE_LENGTH = 90;

export const AgentSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [brandLanes, setBrandLanes] = useState([]);
  const [imageModels, setImageModels] = useState([]);
  const [textModels, setTextModels] = useState([]);
  const [visualVariantsByLane, setVisualVariantsByLane] = useState({});
  const [settings, setSettings] = useState({});
  const [savedSettings, setSavedSettings] = useState({});
  const [savedAt, setSavedAt] = useState({});
  const [saving, setSaving] = useState({});
  const [saveError, setSaveError] = useState({});
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [confirmScopeKey, setConfirmScopeKey] = useState(null);

  const loadVisualVariants = useCallback(async (lane) => {
    if (!lane) return;
    setVisualVariantsByLane((prev) => {
      if (prev[lane]) return prev;
      return prev;
    });
    try {
      const response = await agentsApi.listCreativePodVisualVariants(lane);
      setVisualVariantsByLane((prev) => ({ ...prev, [lane]: response.visual_sub_variants || [] }));
    } catch {
      setVisualVariantsByLane((prev) => ({ ...prev, [lane]: [] }));
    }
  }, []);

  const load = useCallback(async () => {
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
      setSavedSettings(nextSettings);
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
  }, [loadVisualVariants]);

  useEffect(() => {
    load();
  }, [load]);

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

  const isDirty = (scopeKey) =>
    JSON.stringify(settings[scopeKey] || {}) !== JSON.stringify(savedSettings[scopeKey] || {});

  const describeValue = (field, value, scopeKey) => {
    if (!value) {
      if (field === 'brand_lane') return 'Auto-classify from brief';
      if (field === 'visual_sub_variant') return "Lane's default scene";
      if (field === 'image_model' || field === 'text_model') return 'Use pipeline default';
      return '—';
    }
    if (field === 'brand_lane') return brandLanes.find((row) => row.value === value)?.label || value;
    if (field === 'image_model') return imageModels.find((row) => row.value === value)?.label || value;
    if (field === 'text_model') return textModels.find((row) => row.value === value)?.label || value;
    if (field === 'visual_sub_variant') {
      const lane = settings[scopeKey]?.brand_lane;
      const options = visualVariantsByLane[lane] || [];
      return options.find((row) => row.value === value)?.label || value;
    }
    return String(value);
  };

  const FIELD_LABELS = {
    brand_lane: 'Default vertical',
    visual_sub_variant: 'Default scene / mood',
    image_model: 'Default image model',
    text_model: 'Default text model',
    variant_count: 'Default image variants',
  };

  const changedFields = useMemo(() => {
    if (!confirmScopeKey) return [];
    const scope = SCOPES.find((s) => s.key === confirmScopeKey);
    const before = savedSettings[confirmScopeKey] || {};
    const after = settings[confirmScopeKey] || {};
    return scope.fields
      .filter((field) => (before[field] || null) !== (after[field] || null))
      .map((field) => ({
        field,
        label: FIELD_LABELS[field],
        before: describeValue(field, before[field], confirmScopeKey),
        after: describeValue(field, after[field], confirmScopeKey),
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmScopeKey, settings, savedSettings, brandLanes, imageModels, textModels, visualVariantsByLane]);

  const saveScope = async (scopeKey) => {
    setConfirmScopeKey(null);
    setSaving((prev) => ({ ...prev, [scopeKey]: true }));
    setSaveError((prev) => ({ ...prev, [scopeKey]: null }));
    try {
      const response = await agentsApi.saveAgentSettings(scopeKey, settings[scopeKey] || {});
      const nextConfig = response.config || {};
      setSettings((prev) => ({ ...prev, [scopeKey]: nextConfig }));
      setSavedSettings((prev) => ({ ...prev, [scopeKey]: nextConfig }));
      setSavedAt((prev) => ({ ...prev, [scopeKey]: response.updated_at || null }));
    } catch (error) {
      setSaveError((prev) => ({ ...prev, [scopeKey]: error.message }));
    } finally {
      setSaving((prev) => ({ ...prev, [scopeKey]: false }));
    }
  };

  if (loading) {
    return (
      <Box className="screen-container agents-page" sx={{ pb: 4 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Agent Settings
        </Typography>
        <AgentsSubnav />
        <LoadingSpinner />
      </Box>
    );
  }

  const confirmScope = SCOPES.find((s) => s.key === confirmScopeKey);

  return (
    <Box className="screen-container agents-page" sx={{ pb: 4 }}>
      <Typography variant="h5" sx={{ mb: 0.5 }}>
        Agent Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Global generation defaults shared by Collection Builder, Creative Pod, and Campaign
        Creative — stored on the server, editable without a redeploy.
      </Typography>
      <AgentsSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.settings} />
      {errorMessage && <ErrorMessage message={errorMessage} onRetry={load} />}

      <Stack spacing={2}>
        {SCOPES.map((scope) => {
          const config = settings[scope.key] || {};
          const laneVariants = visualVariantsByLane[config.brand_lane] || [];
          const dirty = isDirty(scope.key);
          const descriptionExpanded = expandedDescriptions[scope.key];
          const isLongDescription = scope.description.length > DESCRIPTION_TRUNCATE_LENGTH;
          const Icon = scope.icon;

          return (
            <Paper variant="outlined" sx={{ p: 2.5 }} key={scope.key}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    bgcolor: 'action.hover',
                    color: 'primary.main',
                    flexShrink: 0,
                  }}
                >
                  <Icon fontSize="small" />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="subtitle1">{scope.label}</Typography>
                    <Chip label={scope.usedOn} size="small" variant="outlined" />
                    {dirty && <Chip label="Unsaved changes" size="small" color="warning" />}
                  </Stack>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      ...(isLongDescription && !descriptionExpanded
                        ? {
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }
                        : {}),
                    }}
                  >
                    {scope.description}
                  </Typography>
                  {isLongDescription && (
                    <Button
                      size="small"
                      onClick={() =>
                        setExpandedDescriptions((prev) => ({ ...prev, [scope.key]: !prev[scope.key] }))
                      }
                      sx={{ mt: 0.25, px: 0, minWidth: 0 }}
                    >
                      {descriptionExpanded ? 'Show less' : 'Show more'}
                    </Button>
                  )}
                </Box>
              </Stack>

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1.5}
                flexWrap="wrap"
                useFlexGap
                sx={{ mb: 1.5 }}
              >
                {scope.fields.includes('brand_lane') && (
                  <TextField
                    select
                    size="small"
                    label="Default vertical"
                    value={config.brand_lane || ''}
                    onChange={(event) => updateField(scope.key, 'brand_lane', event.target.value)}
                    sx={{ minWidth: { md: 200 }, flex: { md: 1 } }}
                  >
                    <MenuItem value="">Auto-classify from brief</MenuItem>
                    {brandLanes.map((row) => (
                      <MenuItem key={row.value} value={row.value}>
                        {row.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}

                {scope.fields.includes('visual_sub_variant') && (
                  <TextField
                    select
                    size="small"
                    label="Default scene / mood"
                    value={config.visual_sub_variant || ''}
                    onChange={(event) => updateField(scope.key, 'visual_sub_variant', event.target.value)}
                    disabled={!config.brand_lane}
                    sx={{ minWidth: { md: 200 }, flex: { md: 1 } }}
                  >
                    <MenuItem value="">
                      {config.brand_lane ? "Lane's default scene" : 'Pick a vertical first'}
                    </MenuItem>
                    {laneVariants.map((row) => (
                      <MenuItem key={row.value} value={row.value}>
                        {row.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}

                {scope.fields.includes('image_model') && (
                  <TextField
                    select
                    size="small"
                    label="Default image model"
                    value={config.image_model || ''}
                    onChange={(event) => updateField(scope.key, 'image_model', event.target.value)}
                    sx={{ minWidth: { md: 200 }, flex: { md: 1 } }}
                  >
                    <MenuItem value="">Use pipeline default</MenuItem>
                    {imageModels.map((row) => (
                      <MenuItem key={row.value} value={row.value}>
                        {row.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}

                {scope.fields.includes('text_model') && (
                  <TextField
                    select
                    size="small"
                    label="Default text model"
                    value={config.text_model || ''}
                    onChange={(event) => updateField(scope.key, 'text_model', event.target.value)}
                    sx={{ minWidth: { md: 200 }, flex: { md: 1 } }}
                  >
                    <MenuItem value="">Use pipeline default</MenuItem>
                    {textModels.map((row) => (
                      <MenuItem key={row.value} value={row.value}>
                        {row.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}

                {scope.fields.includes('variant_count') && (
                  <TextField
                    select
                    size="small"
                    label="Default image variants"
                    value={config.variant_count || 1}
                    onChange={(event) => updateField(scope.key, 'variant_count', Number(event.target.value))}
                    sx={{ minWidth: { md: 160 } }}
                  >
                    {VARIANT_COUNT_OPTIONS.map((value) => (
                      <MenuItem key={value} value={value}>
                        {value}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                <Button
                  variant="contained"
                  onClick={() => setConfirmScopeKey(scope.key)}
                  disabled={saving[scope.key] || !dirty}
                >
                  {saving[scope.key] ? 'Saving…' : 'Save defaults'}
                </Button>
                {savedAt[scope.key] && (
                  <Typography variant="caption" color="text.secondary">
                    Last saved {new Date(savedAt[scope.key]).toLocaleString()}
                  </Typography>
                )}
              </Stack>
              <Collapse in={Boolean(saveError[scope.key])}>
                <Alert severity="error" sx={{ mt: 1.5 }}>
                  {saveError[scope.key]}
                </Alert>
              </Collapse>
            </Paper>
          );
        })}
      </Stack>

      <Dialog open={Boolean(confirmScopeKey)} onClose={() => setConfirmScopeKey(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Save {confirmScope?.label} defaults?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This changes what {confirmScope?.usedOn.toLowerCase()} start from on every new run,
            starting now. Runs already in progress aren't affected.
          </DialogContentText>
          <Stack spacing={1}>
            {changedFields.map((change) => (
              <Box key={change.field}>
                <Typography variant="caption" color="text.secondary">
                  {change.label}
                </Typography>
                <Typography variant="body2">
                  {change.before} → <strong>{change.after}</strong>
                </Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmScopeKey(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => saveScope(confirmScopeKey)}>
            Save defaults
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
