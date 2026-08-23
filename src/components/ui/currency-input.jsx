import React from 'react';
import { cn } from '../../lib/utils';

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

/**
 * First-class numeric input for prices/totals (MINAKI spec §7 — the design
 * direction gives money its own IBM Plex Mono, tabular-nums treatment).
 * Value stays a plain string of digits/decimal while typing — no
 * reformatting mid-keystroke — so it's safe to bind straight to numeric
 * form state without fighting the cursor.
 */
const CurrencyInput = React.forwardRef(
  ({ className, currency = 'INR', value, onValueChange, decimals = 2, placeholder, ...props }, ref) => {
    const symbol = CURRENCY_SYMBOLS[currency] || currency;

    const handleChange = (e) => {
      const raw = e.target.value;
      const decimalPattern = decimals > 0 ? `(\\.\\d{0,${decimals}})?` : '';
      const pattern = new RegExp(`^\\d*${decimalPattern}$`);
      if (raw === '' || pattern.test(raw)) {
        onValueChange?.(raw);
      }
    };

    return (
      <div
        className={cn(
          'flex h-11 items-center rounded-md border border-[var(--color-input)] bg-[var(--color-surface)]',
          'focus-within:ring-2 focus-within:ring-[var(--color-ring)] focus-within:border-[var(--color-ring)]',
          'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50',
          className
        )}
      >
        <span className="pl-3 font-mono text-sm text-[var(--color-text-muted)] select-none">{symbol}</span>
        <input
          ref={ref}
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder={placeholder ?? (decimals > 0 ? `0.${'0'.repeat(decimals)}` : '0')}
          className="w-full bg-transparent px-2 py-2 text-right font-mono text-sm tabular-nums text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
          {...props}
        />
      </div>
    );
  }
);
CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
