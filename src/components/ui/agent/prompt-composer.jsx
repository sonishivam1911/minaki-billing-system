import React, { useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../button';

/**
 * The prompt-entry surface for agent pages — a self-contained composer bar
 * (textarea + inline actions + submit) rather than a bare <textarea>, matching
 * the modern AI-composer pattern instead of a generic form field. Auto-grows
 * with content, glows sapphire on focus (see .prompt-glow), and keeps the
 * submit button anchored bottom-right the way a chat input does.
 */
function PromptComposer({
  value,
  onChange,
  onSubmit,
  placeholder = 'Describe what you want…',
  maxLength,
  disabled,
  submitLabel,
  leadingActions,
  className,
  minRows = 2,
  maxRows = 8,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = 22;
    const min = minRows * lineHeight;
    const max = maxRows * lineHeight;
    el.style.height = `${Math.min(Math.max(el.scrollHeight, min), max)}px`;
  }, [value, minRows, maxRows]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !disabled) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <div
      className={cn(
        'prompt-glow flex flex-col gap-3 rounded-lg border border-[var(--color-input)] bg-[var(--color-surface)] p-5 transition-shadow',
        className
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        rows={minRows}
        className="w-full resize-none bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">{leadingActions}</div>
        <div className="flex items-center gap-2">
          {typeof maxLength === 'number' && (
            <span className="font-mono text-[11px] tabular-nums text-[var(--color-text-muted)]">
              {(value || '').length}/{maxLength}
            </span>
          )}
          <Button
            type="button"
            size="icon"
            onClick={onSubmit}
            disabled={disabled || !value?.trim()}
            aria-label={submitLabel || 'Generate'}
            className="h-9 w-9"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export { PromptComposer };
