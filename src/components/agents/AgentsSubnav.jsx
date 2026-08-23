import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/use-media-query';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

export const AGENT_NAV_LINKS = [
  { to: '/agents/writer', label: 'Product Writer' },
  { to: '/agents/product-reviewer', label: 'Product Reviewer' },
  { to: '/agents/keywords', label: 'Keywords' },
  { to: '/agents/naming-teams', label: 'Naming Teams' },
  { to: '/agents/collections', label: 'Collection Builder' },
  { to: '/agents/campaign-creative', label: 'Campaign Creative' },
  { to: '/agents/creative-pod', label: 'Banner Generation' },
  { to: '/agents/marketing', label: 'Meta Marketing' },
  { to: '/agents/settings', label: 'Agent Settings' },
];

export const AgentsSubnav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const currentPath = AGENT_NAV_LINKS.some((link) => link.to === location.pathname)
    ? location.pathname
    : AGENT_NAV_LINKS[0].to;

  if (isMobile) {
    return (
      <div className="minaki-ui mb-4">
        <Select value={currentPath} onValueChange={(value) => navigate(value)}>
          <SelectTrigger aria-label="Agent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AGENT_NAV_LINKS.map((link) => (
              <SelectItem key={link.to} value={link.to}>
                {link.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="minaki-ui mb-4">
      <Tabs value={currentPath} onValueChange={(value) => navigate(value)}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {AGENT_NAV_LINKS.map((link) => (
            <TabsTrigger key={link.to} value={link.to}>
              {link.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};
