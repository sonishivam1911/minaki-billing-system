import React from 'react';
import { Box, Typography } from '@mui/material';
import { ChevronRight, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDriveMotion } from './motionConfig';

/**
 * macOS Finder-style path bar: rounded chips in a translucent pill track,
 * not the plain MUI <Breadcrumbs> link list — gives the navigation trail
 * real visual weight so it reads as a breadcrumb, not stray text.
 */
const DriveBreadcrumbs = ({ items = [], onNavigate }) => {
  const motionCfg = useDriveMotion();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 2,
        py: 1,
        overflowX: 'auto',
      }}
    >
      {items.map((crumb, idx) => {
        const isLast = idx === items.length - 1;
        const isRoot = crumb.id == null;
        return (
          <React.Fragment key={crumb.id ?? 'root'}>
            {idx > 0 && <ChevronRight size={14} color="#b3a58e" style={{ flexShrink: 0 }} />}
            {isLast ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.5 }}>
                {isRoot && <HardDrive size={15} color="#5d4e37" />}
                <Typography sx={{ fontWeight: 600, letterSpacing: '-0.01em', color: '#2c2416', whiteSpace: 'nowrap' }}>
                  {crumb.name}
                </Typography>
              </Box>
            ) : (
              <motion.button
                onClick={() => onNavigate?.(crumb.id)}
                whileHover={{ backgroundColor: 'rgba(139,111,71,0.1)' }}
                whileTap={{ scale: 0.97 }}
                transition={motionCfg.tap}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: 'none',
                  background: 'transparent',
                  borderRadius: 999,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  color: '#5d4e37',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {isRoot && <HardDrive size={15} />}
                {crumb.name}
              </motion.button>
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
};

export default DriveBreadcrumbs;
