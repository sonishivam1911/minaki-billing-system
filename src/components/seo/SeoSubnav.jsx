import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

export const SEO_NAV_LINKS = [
  { to: '/seo/keyword-planner', label: 'Keyword Planner' },
  { to: '/seo/rank-tracker', label: 'Rank Tracker' },
  { to: '/seo/backlinks', label: 'Backlinks' },
  { to: '/seo/local-seo', label: 'Local SEO' },
  { to: '/seo/ai-visibility', label: 'AI Visibility' },
  { to: '/seo/serp-results', label: 'SERP Results' },
];

export const SeoSubnav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const currentPath = SEO_NAV_LINKS.some((link) => link.to === location.pathname)
    ? location.pathname
    : SEO_NAV_LINKS[0].to;

  if (isMobile) {
    return (
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="seo-nav-label">SEO tool</InputLabel>
        <Select
          labelId="seo-nav-label"
          label="SEO tool"
          value={currentPath}
          onChange={(event) => navigate(event.target.value)}
        >
          {SEO_NAV_LINKS.map((link) => (
            <MenuItem key={link.to} value={link.to}>
              {link.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  return (
    <Tabs
      value={currentPath}
      onChange={(_event, value) => navigate(value)}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
    >
      {SEO_NAV_LINKS.map((link) => (
        <Tab key={link.to} value={link.to} label={link.label} />
      ))}
    </Tabs>
  );
};
