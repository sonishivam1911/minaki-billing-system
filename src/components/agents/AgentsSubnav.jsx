import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/agents/writer', label: 'Product Writer' },
  { to: '/agents/keywords', label: 'Keywords' },
  { to: '/agents/naming-teams', label: 'Naming Teams' },
  { to: '/agents/collections', label: 'Collections' },
  { to: '/agents/campaign-creative', label: 'Campaign Creative' },
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
