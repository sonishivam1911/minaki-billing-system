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
import { LoadingSpinner, ErrorMessage } from '../../components';

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
    return <LoadingSpinner message="Loading writer templates..." />;
  }

  return (
    <div className="screen-container agents-page">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">Product Writer</h1>
          <p className="screen-subtitle">
            Upload SKUs or a product list — AI writes names, descriptions, and SEO
          </p>
        </div>
      </div>

      <AgentsSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.writer} />
      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

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
        <section className="agents-card">
          <ShopifyProductPicker selectedSkus={selectedSkus} onSelectionChange={setSelectedSkus} />
        </section>
      ) : (
      <section className="agents-card">
        <h2 className="agents-section-title">Upload your product list</h2>

        <div className="agents-template-row">
          <label className="agents-radio">
            <input
              type="radio"
              name="template"
              checked={templateId === 'sku_only'}
              onChange={() => setTemplateId('sku_only')}
            />
            Simple SKU list
          </label>
          <button
            type="button"
            className="agents-link-btn"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide' : 'More file types…'}
          </button>
        </div>

        {showAdvanced && (
          <div className="agents-template-advanced">
            {templates
              .filter((t) => t.id !== 'sku_only')
              .map((t) => (
                <label key={t.id} className="agents-radio">
                  <input
                    type="radio"
                    name="template"
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
          <div className="agents-validation">
            <p>
              <strong>{validation.valid_rows}</strong> products ready
              {validation.errors?.length > 0 && (
                <span className="agents-warn">
                  {' '}
                  · {validation.errors.length} row issue(s)
                </span>
              )}
            </p>
            {validation.preview_skus?.length > 0 && (
              <p className="agents-preview-skus">
                SKUs: {validation.preview_skus.slice(0, 8).join(', ')}
                {validation.preview_skus.length > 8 ? '…' : ''}
              </p>
            )}
          </div>
        )}

        <div className="agents-actions">
          <button
            type="button"
            className="agents-btn secondary"
            onClick={handleValidate}
            disabled={!file || validating}
          >
            {validating ? 'Checking…' : 'Check file'}
          </button>
        </div>
      </section>
      )}

      <section className="agents-card">
        <UpdateMaskCheckboxes value={updateMask} onChange={setUpdateMask} />
        <label className="agents-check agents-dry-run">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={() => setDryRun(!dryRun)}
          />
          <span>Preview only (do not change Shopify yet)</span>
        </label>
        <div className="agents-actions">
          <button
            type="button"
            className="agents-btn primary"
            onClick={handleRun}
            disabled={(inputMode === 'csv' && !file) || running}
          >
            {running ? 'Running…' : dryRun ? 'Preview run' : 'Apply to Shopify'}
          </button>
        </div>
        {enrichmentRunId && (
          <p className="agents-preview-skus">Enrichment run: {enrichmentRunId}</p>
        )}
      </section>

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
