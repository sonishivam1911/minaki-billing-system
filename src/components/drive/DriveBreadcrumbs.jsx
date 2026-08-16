import React from 'react';
import { Breadcrumbs, Link, Typography } from '@mui/material';
import { ChevronRight } from 'lucide-react';

const DriveBreadcrumbs = ({ items = [], onNavigate }) => (
  <Breadcrumbs separator={<ChevronRight size={14} />} sx={{ px: 1 }}>
    {items.map((crumb, idx) => {
      const isLast = idx === items.length - 1;
      if (isLast) {
        return (
          <Typography key={crumb.id ?? 'root'} color="text.primary" fontWeight={600}>
            {crumb.name}
          </Typography>
        );
      }
      return (
        <Link
          key={crumb.id ?? 'root'}
          component="button"
          underline="hover"
          color="text.secondary"
          onClick={() => onNavigate?.(crumb.id)}
        >
          {crumb.name}
        </Link>
      );
    })}
  </Breadcrumbs>
);

export default DriveBreadcrumbs;
