import React, { useEffect, useId, useRef, useState } from 'react';
import { Info } from 'lucide-react';

/**
 * Compact ⓘ control that toggles an explanation panel.
 * Click/tap based so it works on mobile (no hover-only tooltips).
 */
export const FieldInfoTip = ({ label, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const tipId = useId();
  const rootRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <span className="agents-field-info" ref={rootRef}>
      <button
        type="button"
        className="agents-field-info-btn"
        aria-expanded={isOpen}
        aria-controls={tipId}
        aria-label={`About ${label}`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsOpen((open) => !open);
        }}
      >
        <Info size={15} strokeWidth={2.25} aria-hidden />
      </button>
      {isOpen && (
        <span id={tipId} className="agents-field-info-panel" role="note">
          {children}
        </span>
      )}
    </span>
  );
};

export const FieldLabel = ({ label, info, children }) => (
  <span className="agents-field-label-row">
    <span className="agents-field-label-text">{label}</span>
    {info ? <FieldInfoTip label={label}>{info}</FieldInfoTip> : null}
    {children}
  </span>
);
