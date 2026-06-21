import React from 'react';

const FIELDS = [
  { key: 'title', label: 'Product name' },
  { key: 'description', label: 'Description' },
  { key: 'seo_title', label: 'SEO title' },
  { key: 'seo_description', label: 'SEO description' },
  { key: 'styling_tip', label: 'Styling tip' },
  { key: 'faqs', label: 'FAQs' },
  { key: 'force_title', label: 'Force rename (even if title looks fine)' },
];

export const UpdateMaskCheckboxes = ({ value, onChange }) => {
  const toggle = (key) => {
    onChange({ ...value, [key]: !value[key] });
  };

  return (
    <div className="agents-mask">
      <h3 className="agents-section-title">What to update</h3>
      <div className="agents-mask-grid">
        {FIELDS.map(({ key, label }) => (
          <label key={key} className="agents-check">
            <input
              type="checkbox"
              checked={!!value[key]}
              onChange={() => toggle(key)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export const DEFAULT_UPDATE_MASK = {
  title: true,
  description: true,
  seo_title: true,
  seo_description: true,
  styling_tip: false,
  faqs: false,
  force_title: false,
};
