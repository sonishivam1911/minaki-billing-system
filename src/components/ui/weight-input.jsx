import React from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './select';
import { cn } from '../../lib/utils';

const UNITS = ['g', 'ct', 'oz'];

/**
 * First-class numeric input for gold/gemstone weights (MINAKI spec §7).
 * Grams typically want 3 decimals ("18.420 g"), carats 2 — pass `decimals`
 * to override the default per unit if the caller needs to.
 */
const WeightInput = React.forwardRef(
  (
    {
      className,
      unit = 'g',
      onUnitChange,
      units = UNITS,
      value,
      onValueChange,
      decimals,
      placeholder,
      ...props
    },
    ref
  ) => {
    const effectiveDecimals = decimals ?? (unit === 'g' ? 3 : 2);

    const handleChange = (e) => {
      const raw = e.target.value;
      const decimalPattern = effectiveDecimals > 0 ? `(\\.\\d{0,${effectiveDecimals}})?` : '';
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
        <input
          ref={ref}
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder={placeholder ?? (effectiveDecimals > 0 ? `0.${'0'.repeat(effectiveDecimals)}` : '0')}
          className="w-full bg-transparent px-3 py-2 text-right font-mono text-sm tabular-nums text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
          {...props}
        />
        {onUnitChange ? (
          <Select value={unit} onValueChange={onUnitChange}>
            <SelectTrigger className="h-9 w-[68px] shrink-0 border-0 border-l border-[var(--color-input)] rounded-l-none font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {units.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="shrink-0 border-l border-[var(--color-input)] px-3 py-2 font-mono text-xs text-[var(--color-text-muted)] select-none">
            {unit}
          </span>
        )}
      </div>
    );
  }
);
WeightInput.displayName = 'WeightInput';

export { WeightInput };
