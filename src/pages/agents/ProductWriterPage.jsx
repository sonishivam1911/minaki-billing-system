import React, { useEffect, useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { CsvUploadZone } from '../../components/agents/CsvUploadZone';
import { CsvSchemaHelp } from '../../components/agents/CsvSchemaHelp';
import {
  UpdateMaskCheckboxes,
  DEFAULT_UPDATE_MASK,
} from '../../components/agents/UpdateMaskCheckboxes';
import { WriterResultsTable } from '../../components/agents/WriterResultsTable';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
import { AgentsModeSelect } from '../../components/agents/AgentsModeSelect';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { ShopifyProductPicker } from '../../components/agents/ShopifyProductPicker';
import { LoadingSpinner } from '../../components';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';

const TEMPLATE_SOURCE = {
  sku_only: 'sku_csv',
  writer_full: 'writer_csv',
  catalog: 'catalog',
  inventory: 'inventory',
};

export const ProductWriterPage = () => {
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('sku_only');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [file, setFile] = useState(null);
  const [validation, setValidation] = useState(null);
  const [validating, setValidating] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [updateMask, setUpdateMask] = useState(DEFAULT_UPDATE_MASK);
  const [dryRun, setDryRun] = useState(true);
  const [inputMode, setInputMode] = useState('csv');
  const [selectedSkus, setSelectedSkus] = useState([]);
  const [enrichmentRunId, setEnrichmentRunId] = useState(null);

  useEffect(() => {
    agentsApi
      .getCsvTemplates()
      .then((data) => setTemplates(data.templates || []))
      .catch((e) => setError(e.message));
  }, []);

  const activeTemplate =
    templates.find((t) => t.id === templateId) || templates[0];

  const handleValidate = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    setValidating(true);
    setError(null);
    try {
      const res = await agentsApi.validateCsv(file, templateId);
      setValidation(res);
    } catch (e) {
      setError(e.message);
      setValidation(null);
    } finally {
      setValidating(false);
    }
  };

  const pollEnrichment = async (runId) => {
    const maxAttempts = 120;
    for (let i = 0; i < maxAttempts; i += 1) {
      const status = await agentsApi.getEnrichmentStatus(runId);
      if (status.status && !['running', 'queued'].includes(status.status)) {
        const itemsRes = await agentsApi.getEnrichmentItems(runId);
        setResults(
          (itemsRes.items || []).map((it) => ({
            sku: it.sku,
            status: it.status,
            success: it.status === 'completed',
            preview: it.payload?.preview || it.preview,
            existing_title: it.existing_title,
            product_title: it.product_title,
          }))
        );
        return;
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
    setError('Enrichment run timed out — check API logs');
  };

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setEnrichmentRunId(null);
    try {
      if (inputMode === 'shopify') {
        if (!selectedSkus.length) {
          setError('Select at least one product from Shopify');
          return;
        }
        const start = await agentsApi.startEnrichment({
          skus: selectedSkus,
          max_products: selectedSkus.length,
          dry_run: dryRun,
          update_mask: updateMask,
        });
        setEnrichmentRunId(start.run_id);
        await pollEnrichment(start.run_id);
      } else {
        if (!file) {
          setError('Please select a file first');
          return;
        }
        const rowLimit = validation?.valid_rows || undefined;
        const res = await agentsApi.runWriterSync({
          file,
          sourceType: TEMPLATE_SOURCE[templateId] || 'sku_csv',
          rowLimit,
          dryRun,
          updateMask,
        });
        setResults(res.detailed_results || []);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  if (!templates.length && !error) {
    return (
      <div className="minaki-ui mx-auto max-w-5xl px-4 py-6 pb-16 sm:px-6">
        <h1 className="text-2xl font-semibold sm:text-3xl">Product Writer</h1>
        <AgentsSubnav />
        <LoadingSpinner message="Loading writer templates..." />
      </div>
    );
  }

  return (
    <div className="minaki-ui mx-auto max-w-5xl px-4 py-6 pb-16 sm:px-6">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold sm:text-3xl">Product Writer</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Upload SKUs or a product list — AI writes names, descriptions, and SEO
        </p>
      </header>

      <AgentsSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.writer} />
      {error && (
        <Alert variant="destructive" title="Something went wrong" className="mb-4">
          {error}
        </Alert>
      )}

      <AgentsModeSelect
        label="Input"
        value={inputMode}
        onChange={setInputMode}
        options={[
          { value: 'csv', label: 'Upload CSV' },
          { value: 'shopify', label: 'Pick from Shopify' },
        ]}
      />

      {inputMode === 'shopify' ? (
        <Card className="mb-6">
          <CardContent className="pt-5">
            <ShopifyProductPicker selectedSkus={selectedSkus} onSelectionChange={setSelectedSkus} />
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload your product list</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="template"
                  className="h-4 w-4 accent-[var(--color-primary)]"
                  checked={templateId === 'sku_only'}
                  onChange={() => setTemplateId('sku_only')}
                />
                Simple SKU list
              </label>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Hide' : 'More file types…'}
              </Button>
            </div>

            {showAdvanced && (
              <div className="flex flex-wrap gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-3">
                {templates
                  .filter((t) => t.id !== 'sku_only')
                  .map((t) => (
                    <label key={t.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="template"
                        className="h-4 w-4 accent-[var(--color-primary)]"
                        checked={templateId === t.id}
                        onChange={() => setTemplateId(t.id)}
                      />
                      {t.label}
                    </label>
                  ))}
              </div>
            )}

            <CsvSchemaHelp template={activeTemplate} />
            <CsvUploadZone file={file} onFileSelect={(f) => { setFile(f); setValidation(null); setResults([]); }} />

            {validation && (
              <div className="space-y-1 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-3 text-sm">
                <p>
                  <strong>{validation.valid_rows}</strong> products ready
                  {validation.errors?.length > 0 && (
                    <span className="text-[var(--color-warning)]">
                      {' '}
                      · {validation.errors.length} row issue(s)
                    </span>
                  )}
                </p>
                {validation.preview_skus?.length > 0 && (
                  <p className="text-[var(--color-muted-foreground)]">
                    SKUs: {validation.preview_skus.slice(0, 8).join(', ')}
                    {validation.preview_skus.length > 8 ? '…' : ''}
                  </p>
                )}
              </div>
            )}

            <div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleValidate}
                disabled={!file || validating}
              >
                {validating ? 'Checking…' : 'Check file'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardContent className="space-y-4 pt-5">
          <UpdateMaskCheckboxes value={updateMask} onChange={setUpdateMask} />
          <div className="flex items-center gap-2">
            <Checkbox
              id="pw-dry-run"
              checked={dryRun}
              onCheckedChange={(checked) => setDryRun(Boolean(checked))}
            />
            <Label htmlFor="pw-dry-run" className="font-normal">
              Preview only (do not change Shopify yet)
            </Label>
          </div>
          <Button
            onClick={handleRun}
            disabled={(inputMode === 'csv' && !file) || running}
          >
            {running ? 'Running…' : dryRun ? 'Preview run' : 'Apply to Shopify'}
          </Button>
          {enrichmentRunId && (
            <p className="text-sm text-[var(--color-muted-foreground)]">Enrichment run: {enrichmentRunId}</p>
          )}
        </CardContent>
      </Card>

      {running && (
        <LoadingSpinner
          message={
            inputMode === 'shopify'
              ? 'Enriching selected Shopify products…'
              : 'Generating product content…'
          }
        />
      )}
      <WriterResultsTable results={results} />
    </div>
  );
};
