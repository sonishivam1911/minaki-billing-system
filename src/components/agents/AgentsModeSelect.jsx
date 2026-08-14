import React from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
} from '@mui/material';

/**
 * In-page mode switch: dropdown on phones, scrollable tabs on desktop.
 */
export const AgentsModeSelect = ({
  label = 'View',
  value,
  onChange,
  options = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    return (
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="agents-mode-label">{label}</InputLabel>
        <Select
          labelId="agents-mode-label"
          label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  return (
    <Tabs
      value={value}
      onChange={(_event, nextValue) => onChange(nextValue)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
    >
      {options.map((option) => (
        <Tab key={option.value} value={option.value} label={option.label} />
      ))}
    </Tabs>
  );
};
