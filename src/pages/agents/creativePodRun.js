const HTTP_URL_PATTERN = /^https?:\/\//i;

/** Collect every http(s) URL nested inside an API payload (banner JSON shapes vary). */
export function collectHttpImageUrls(value, collectedUrls = []) {
  if (!value) {
    return collectedUrls;
  }
  if (typeof value === 'string' && HTTP_URL_PATTERN.test(value)) {
    collectedUrls.push(value);
    return collectedUrls;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectHttpImageUrls(entry, collectedUrls));
    return collectedUrls;
  }
  if (typeof value === 'object') {
    Object.values(value).forEach((entry) => collectHttpImageUrls(entry, collectedUrls));
  }
  return collectedUrls;
}

export function parseCommaSeparatedEmails(value) {
  return String(value || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

/** Prefer structured variants[]; fall back to flattening top-level banner_urls. */
export function normalizeCreativePodVariants(bannerUrls) {
  const payload = bannerUrls || {};
  const structured = Array.isArray(payload.variants) ? payload.variants : [];
  if (structured.length) {
    return structured.map((variantRow, index) => {
      const imageUrls = collectHttpImageUrls(variantRow.banner_urls || variantRow);
      return {
        variantIndex: variantRow.variant_index ?? index + 1,
        diversityKey: variantRow.diversity_key || '',
        diversityLabel: variantRow.diversity_label || `Variant ${index + 1}`,
        castingKey: variantRow.casting_key || '',
        castingIndex: variantRow.casting_index || null,
        imageUrls,
        ocr: variantRow.ocr || null,
        models: variantRow.models || {},
      };
    });
  }
  const flatUrls = collectHttpImageUrls(payload);
  if (!flatUrls.length) {
    return [];
  }
  return [
    {
      variantIndex: 1,
      diversityKey: '',
      diversityLabel: 'Variant 1',
      castingKey: '',
      castingIndex: null,
      imageUrls: flatUrls,
      ocr: null,
      models: {},
    },
  ];
}

/** Normalize create/get/regenerate API shapes into one UI-friendly object. */
export function normalizeCreativePodRunForDisplay(apiRun) {
  if (!apiRun) {
    return null;
  }
  const intake = apiRun.intake || apiRun.intake_json || {};
  const copyPack = apiRun.copy_pack || apiRun.copy_pack_json || {};
  const inImage = copyPack.in_image || copyPack.locked_in_image || {};
  const bannerUrls = apiRun.banner_urls || apiRun.banner_urls_json;
  const variants = normalizeCreativePodVariants(bannerUrls);
  return {
    runId: apiRun.run_id ?? apiRun.id,
    success: apiRun.success !== false && apiRun.status !== 'failed',
    status: apiRun.status || 'unknown',
    errorMessage: apiRun.error || apiRun.error_message,
    briefText: apiRun.brief_text,
    goalDetail: apiRun.goal_detail,
    notifyEmails: Array.isArray(apiRun.notify_emails) ? apiRun.notify_emails : [],
    goalType: intake.goal_type || apiRun.goal_type,
    platform: intake.platform,
    platformLabel: intake.platform_label,
    brandLane: intake.brand_lane,
    textRenderMode: intake.text_render_mode,
    variantCount: intake.variant_count || variants.length || 1,
    intake,
    contentBrief: apiRun.content_brief || apiRun.content_brief_json,
    copyPack,
    inImageTitle: inImage.title || inImage.Title || '',
    inImageSubtitle: inImage.subtitle || inImage.Subtitle || '',
    inImageCta: inImage.cta || inImage.CTA || '',
    visualSpec: apiRun.visual_spec || apiRun.visual_spec_json,
    bannerUrls,
    variants,
    ocrQa: Array.isArray(bannerUrls?.ocr_qa) ? bannerUrls.ocr_qa : [],
    modelsUsed: apiRun.models_used,
    emailNotification: apiRun.email_notification || apiRun.email_result_json,
    decisionLogs: apiRun.decision_logs || apiRun.decision_logs_json,
  };
}
