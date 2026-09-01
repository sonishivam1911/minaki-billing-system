import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardActionArea, Typography } from '@mui/material';
import { billingUiBuilder } from '../ui/BillingUiBuilder';
import { useAuth } from '../context/AuthContext';
import { SECTIONS } from '../config/sections';

export const HomePage = () => {
  const navigate = useNavigate();
  const { userInfo, isAdmin } = useAuth();
  const firstName = userInfo?.name?.split(' ')[0] || userInfo?.email?.split('@')[0];
  const visibleSections = SECTIONS.filter((section) => !section.adminOnly || isAdmin());

  return billingUiBuilder.page({
    title: firstName ? `Welcome back, ${firstName}` : 'Welcome back',
    description: 'Pick a section to get started.',
    children: (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          },
          gap: { xs: 2, sm: 2.5 },
        }}
      >
        {visibleSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.key} sx={{ height: '100%' }}>
              <CardActionArea
                onClick={() => navigate(section.path)}
                sx={{ height: '100%', p: { xs: 2, sm: 2.5 }, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: '10px',
                    backgroundColor: `${section.color}1a`,
                    color: section.color,
                    mb: 1.5,
                  }}
                >
                  <Icon size={24} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {section.label}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  {section.description}
                </Typography>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>
    ),
  });
};
