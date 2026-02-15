/**
 * Build WhatsApp template components for the Cloud API.
 * Supports body variables and header (IMAGE, VIDEO, DOCUMENT).
 */
export const buildTemplateComponents = (options = {}) => {
  const { templateVars = '', headerMediaUrl = '', headerFormat = 'IMAGE' } = options;
  const components = [];

  // Header (IMAGE, VIDEO, DOCUMENT)
  if (headerMediaUrl.trim()) {
    const mediaType = (headerFormat || 'IMAGE').toLowerCase();
    const param = {
      type: mediaType,
      [mediaType]: { link: headerMediaUrl.trim() },
    };
    components.push({
      type: 'header',
      parameters: [param],
    });
  }

  // Body variables
  const vars = String(templateVars || '')
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean);
  if (vars.length > 0) {
    components.push({
      type: 'body',
      parameters: vars.map((text) => ({ type: 'text', text })),
    });
  }

  return components;
};
