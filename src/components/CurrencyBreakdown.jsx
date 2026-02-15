import React, { useState, useEffect } from 'react';
import { formatRupees } from '../utils';

/**
 * CurrencyBreakdown Component
 * Handles input of Indian Rupee currency notes and coins
 * Auto-calculates total and change breakdown
 * 
 * @param {Object} props
 * @param {number} props.totalAmount - Total amount due
 * @param {Function} props.onAmountChange - Callback when cash amount changes
 * @param {string|number} props.initialAmount - Initial cash amount (optional)
 */
export const CurrencyBreakdown = ({ totalAmount, onAmountChange, initialAmount = '' }) => {
  // Indian currency denominations
  const NOTES = [2000, 500, 200, 100, 50, 20, 10, 5, 2];
  const COINS = [20, 10, 5, 2, 1];

  // State for currency counts
  const [currencyCounts, setCurrencyCounts] = useState(() => {
    const initial = {};
    [...NOTES, ...COINS].forEach(denom => {
      initial[denom] = 0;
    });
    return initial;
  });

  // State for manual entry
  const [manualAmount, setManualAmount] = useState(initialAmount.toString());
  const [useManualEntry, setUseManualEntry] = useState(!initialAmount);

  // Calculate total from currency breakdown
  const calculateTotalFromBreakdown = () => {
    return [...NOTES, ...COINS].reduce((sum, denom) => {
      return sum + (denom * (currencyCounts[denom] || 0));
    }, 0);
  };

  // Calculate change breakdown
  const calculateChangeBreakdown = (changeAmount) => {
    if (changeAmount <= 0) return {};
    
    const breakdown = {};
    const denominations = [...NOTES, ...COINS].sort((a, b) => b - a);
    let remaining = Math.round(changeAmount);
    
    denominations.forEach(denom => {
      const count = Math.floor(remaining / denom);
      if (count > 0) {
        breakdown[denom] = count;
        remaining -= count * denom;
      }
    });
    
    return breakdown;
  };

  const breakdownTotal = calculateTotalFromBreakdown();
  const finalAmount = useManualEntry ? parseFloat(manualAmount) || 0 : breakdownTotal;
  const change = finalAmount - totalAmount;
  const changeBreakdown = change > 0 ? calculateChangeBreakdown(change) : {};

  // Update parent when amount changes
  useEffect(() => {
    onAmountChange(finalAmount);
  }, [finalAmount, onAmountChange]);

  // Handle currency count change
  const handleCountChange = (denomination, value) => {
    const count = Math.max(0, parseInt(value) || 0);
    setCurrencyCounts(prev => ({
      ...prev,
      [denomination]: count
    }));
    setUseManualEntry(false);
  };

  // Handle manual amount change
  const handleManualAmountChange = (value) => {
    setManualAmount(value);
    setUseManualEntry(true);
  };

  // Sync manual entry with breakdown
  const syncToBreakdown = () => {
    const amount = parseFloat(manualAmount) || 0;
    if (amount > 0) {
      const newCounts = {};
      const denominations = [...NOTES, ...COINS].sort((a, b) => b - a);
      let remaining = Math.round(amount);
      
      denominations.forEach(denom => {
        const count = Math.floor(remaining / denom);
        newCounts[denom] = count;
        remaining -= count * denom;
      });
      
      setCurrencyCounts(newCounts);
      setUseManualEntry(false);
    }
  };

  return (
    <div className="currency-breakdown">
      <div style={{ marginBottom: '1rem' }}>
        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="radio"
            checked={!useManualEntry}
            onChange={() => setUseManualEntry(false)}
            style={{ cursor: 'pointer' }}
          />
          <span>Enter by denomination</span>
        </label>
        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', cursor: 'pointer' }}>
          <input
            type="radio"
            checked={useManualEntry}
            onChange={() => setUseManualEntry(true)}
            style={{ cursor: 'pointer' }}
          />
          <span>Enter total amount</span>
        </label>
      </div>

      {!useManualEntry ? (
        <>
          {/* Currency Notes Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#5d4e37', marginBottom: '0.75rem' }}>
              Currency Notes
            </h3>
            <div className="currency-grid">
              {NOTES.map(denom => (
                <div key={denom} className="currency-input-group">
                  <label className="currency-label">₹{denom}</label>
                  <input
                    type="number"
                    min="0"
                    className="currency-input"
                    value={currencyCounts[denom] || ''}
                    onChange={(e) => handleCountChange(denom, e.target.value)}
                    placeholder="0"
                  />
                  <span className="currency-total">
                    = ₹{((currencyCounts[denom] || 0) * denom).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Coins Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#5d4e37', marginBottom: '0.75rem' }}>
              Coins
            </h3>
            <div className="currency-grid">
              {COINS.map(denom => (
                <div key={denom} className="currency-input-group">
                  <label className="currency-label">₹{denom}</label>
                  <input
                    type="number"
                    min="0"
                    className="currency-input"
                    value={currencyCounts[denom] || ''}
                    onChange={(e) => handleCountChange(denom, e.target.value)}
                    placeholder="0"
                  />
                  <span className="currency-total">
                    = ₹{((currencyCounts[denom] || 0) * denom).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total from Breakdown */}
          <div style={{
            padding: '1rem',
            background: '#f5f1e8',
            borderRadius: '8px',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#5d4e37', marginBottom: '0.25rem' }}>
              Total Cash Received
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#2c2416' }}>
              {formatRupees(breakdownTotal)}
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <label className="input-label">Enter Total Amount</label>
            <input
              type="number"
              className="input-field"
              placeholder="Enter amount"
              value={manualAmount}
              onChange={(e) => handleManualAmountChange(e.target.value)}
              step="0.01"
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={syncToBreakdown}
              style={{ marginTop: '0.5rem', width: '100%' }}
              disabled={!manualAmount || parseFloat(manualAmount) <= 0}
            >
              Convert to Denomination Breakdown
            </button>
          </div>
        </>
      )}

      {/* Change Display */}
      {change > 0 && (
        <div className="change-display">
          <div style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
            Change to return: <strong>{formatRupees(change)}</strong>
          </div>
          {Object.keys(changeBreakdown).length > 0 && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(46, 125, 50, 0.3)' }}>
              <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '500' }}>
                Suggested Change Breakdown:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
                {Object.entries(changeBreakdown)
                  .sort(([a], [b]) => b - a)
                  .map(([denom, count]) => (
                    <span key={denom} style={{
                      padding: '0.25rem 0.5rem',
                      background: 'rgba(255, 255, 255, 0.5)',
                      borderRadius: '4px'
                    }}>
                      {count}× ₹{denom}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {change < 0 && (
        <div style={{
          background: '#ffebee',
          border: '1px solid #ef5350',
          color: '#c62828',
          padding: '1rem',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '0.9rem'
        }}>
          Insufficient amount. Need {formatRupees(Math.abs(change))} more.
        </div>
      )}
    </div>
  );
};
