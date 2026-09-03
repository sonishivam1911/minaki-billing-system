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

export const AGENT_NAV_LINKS = [
  { to: '/agents/writer', label: 'Product Writer' },
  { to: '/agents/product-reviewer', label: 'Product Reviewer' },
  { to: '/agents/keywords', label: 'Keywords' },
  { to: '/agents/naming-teams', label: 'Naming Teams' },
  { to: '/agents/collections', label: 'Collection Builder' },
  { to: '/agents/campaign-creative', label: 'Campaign Creative' },
  { to: '/agents/creative-pod', label: 'Banner Generation' },
  { to: '/agents/marketing', label: 'Meta Marketing' },
  { to: '/agents/ads-insights', label: 'Ads Insights' },
  { to: '/agents/settings', label: 'Agent Settings' },
];

export const AgentsSubnav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const currentPath = AGENT_NAV_LINKS.some((link) => link.to === location.pathname)
    ? location.pathname
    : AGENT_NAV_LINKS[0].to;

  if (isMobile) {
    return (
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="agents-nav-label">Agent</InputLabel>
        <Select
          labelId="agents-nav-label"
          label="Agent"
          value={currentPath}
          onChange={(event) => navigate(event.target.value)}
        >
          {AGENT_NAV_LINKS.map((link) => (
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
      {AGENT_NAV_LINKS.map((link) => (
        <Tab key={link.to} value={link.to} label={link.label} />
      ))}
    </Tabs>
  );
};
