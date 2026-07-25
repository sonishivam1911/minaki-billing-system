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

/** Normalize create/get/regenerate API shapes into one UI-friendly object. */
export function normalizeCreativePodRunForDisplay(apiRun) {
  if (!apiRun) {
    return null;
  }
  const intake = apiRun.intake || apiRun.intake_json || {};
  const copyPack = apiRun.copy_pack || apiRun.copy_pack_json || {};
  const inImage = copyPack.in_image || copyPack.locked_in_image || {};
  return {
    runId: apiRun.run_id ?? apiRun.id,
    success: apiRun.success !== false && apiRun.status !== 'failed',
    status: apiRun.status || 'unknown',
    errorMessage: apiRun.error || apiRun.error_message,
    briefText: apiRun.brief_text,
    goalType: intake.goal_type || apiRun.goal_type,
    platform: intake.platform,
    platformLabel: intake.platform_label,
    brandLane: intake.brand_lane,
    textRenderMode: intake.text_render_mode,
    variantCount: intake.variant_count,
    intake,
    contentBrief: apiRun.content_brief || apiRun.content_brief_json,
    copyPack,
    inImageTitle: inImage.title || inImage.Title || '',
    inImageSubtitle: inImage.subtitle || inImage.Subtitle || '',
    inImageCta: inImage.cta || inImage.CTA || '',
    visualSpec: apiRun.visual_spec || apiRun.visual_spec_json,
    bannerUrls: apiRun.banner_urls || apiRun.banner_urls_json,
    modelsUsed: apiRun.models_used,
    emailNotification: apiRun.email_notification || apiRun.email_result_json,
    decisionLogs: apiRun.decision_logs || apiRun.decision_logs_json,
  };
}
