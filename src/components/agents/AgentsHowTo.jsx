import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

export const AgentsHowTo = ({ title, what, steps = [] }) => (
  <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
    <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
      {what}
    </Typography>
    <Typography variant="caption" sx={{ display: 'block', mb: 0.75, fontWeight: 600 }}>
      How to use it
    </Typography>
    <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
      {steps.map((step) => (
        <Typography key={step} component="li" variant="body2" sx={{ mb: 0.5 }}>
          {step}
        </Typography>
      ))}
    </Box>
  </Paper>
);
