import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/agents/writer', label: 'Product Writer' },
  { to: '/agents/product-reviewer', label: 'Product Reviewer' },
  { to: '/agents/keywords', label: 'Keywords' },
  { to: '/agents/naming-teams', label: 'Naming Teams' },
  { to: '/agents/collections', label: 'Collection Builder' },
  { to: '/agents/campaign-creative', label: 'Campaign Creative' },
  { to: '/agents/creative-pod', label: 'Banner Generation' },
  { to: '/agents/marketing', label: 'Meta Marketing' },
];

export const AgentsSubnav = () => {
  const location = useLocation();
  return (
    <nav className="agents-subnav">
      {LINKS.map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          className={location.pathname === to ? 'active' : ''}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
};
