export const fmtMoney = (value) => {
  if (value == null || value === '') return '—';
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return `₹${number.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const fmtNum = (value) => {
  if (value == null || value === '') return '—';
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  if (Number.isInteger(number)) return number.toLocaleString('en-IN');
  return number.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

export const fmtPct = (value) => {
  if (value == null || value === '') return '—';
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return `${number.toFixed(2)}%`;
};

export const fmtRoas = (value) => {
  if (value == null || value === '') return '—';
  return String(value);
};
