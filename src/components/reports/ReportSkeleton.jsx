import React from 'react';
import { Box, Skeleton, Grid, Card, CardContent } from '@mui/material';

/**
 * ReportSkeleton Component
 * Loading placeholder for reports
 */
export const ReportSkeleton = () => {
  return (
    <Box>
      {/* Summary Cards Skeleton */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={6} sm={6} md={3} key={item}>
            <Card>
              <CardContent>
                <Skeleton variant="rectangular" width={40} height={40} sx={{ mb: 2 }} />
                <Skeleton variant="text" width="60%" height={40} />
                <Skeleton variant="text" width="40%" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Table Skeleton */}
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="rectangular" width="100%" height={400} />
      </Box>

      {/* Chart Skeleton */}
      <Box>
        <Skeleton variant="rectangular" width="100%" height={300} />
      </Box>
    </Box>
  );
};

