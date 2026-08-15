import React from 'react';
import { Box, Grid, Card, CardContent, Typography } from '@mui/material';
import { formatRupees } from '../../utils';

/**
 * ReportSummaryCards Component
 * Displays key metrics in card format
 * 
 * @param {Object} props
 * @param {Array} props.cards - Array of card objects with { title, value, color, icon, format }
 */
export const ReportSummaryCards = ({ cards = [] }) => {
  if (!cards || cards.length === 0) {
    return null;
  }

  const getColor = (color) => {
    const colorMap = {
      primary: '#8b6f47',
      success: '#2e7d32',
      warning: '#ed6c02',
      error: '#d32f2f',
      info: '#0288d1',
      default: '#6b7280',
    };
    return colorMap[color] || colorMap.default;
  };

  const formatValue = (value, format) => {
    const numericValue = typeof value === 'number' ? value : parseFloat(value);
    if (format === 'currency') {
      return formatRupees(Number.isFinite(numericValue) ? numericValue : 0);
    }
    if (format === 'number') {
      return (Number.isFinite(numericValue) ? numericValue : 0).toLocaleString('en-IN');
    }
    if (format === 'percentage') {
      return `${(Number.isFinite(numericValue) ? numericValue : 0).toFixed(2)}%`;
    }
    return value == null ? '—' : String(value);
  };

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {cards.map((card, index) => {
        const Icon = card.icon;
        const color = getColor(card.color || 'default');

        return (
          <Grid item xs={6} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                border: `1px solid ${color}20`,
                '&:hover': {
                  boxShadow: 2,
                },
              }}
            >
              <CardContent>
                {Icon && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Icon size={20} color={color} />
                  </Box>
                )}
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: color,
                    mb: 0.5,
                  }}
                >
                  {formatValue(card.value, card.format || 'default')}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  {card.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

