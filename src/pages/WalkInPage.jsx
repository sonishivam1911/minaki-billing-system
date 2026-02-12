import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserPlus, Filter, Calendar } from 'lucide-react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { useWalkIns } from '../hooks';
import { WalkInCard, WalkInModal, LoadingSpinner, ErrorMessage, SearchBar } from '../components';
import { format, startOfDay, endOfDay, isToday } from 'date-fns';

/**
 * WalkInPage Component
 * Main page for managing walk-in visits
 */
export const WalkInPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    assigned_staff: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
  });
  const [searchQuery, setSearchQuery] = useState('');

  const {
    walkIns,
    loading,
    error,
    createWalkIn,
    updateWalkIn,
    deleteWalkIn,
    refetch
  } = useWalkIns({ autoFetch: true });

  const handleCreateWalkIn = async (walkInData) => {
    await createWalkIn(walkInData);
    await refetch(filters);
  };

  const handleUpdateWalkIn = async (walkInId, updateData) => {
    await updateWalkIn(walkInId, updateData);
    await refetch(filters);
  };

  const handleDeleteWalkIn = async (walkIn) => {
    if (window.confirm('Are you sure you want to delete this walk-in?')) {
      await deleteWalkIn(walkIn.id);
      await refetch(filters);
    }
  };

  const handleAddEnquiry = (walkIn) => {
    // Navigate to enquiry creation with walk-in pre-filled
    // This will be handled by the enquiry form component
    console.log('Add enquiry for walk-in:', walkIn);
    // TODO: Navigate to enquiry form or open enquiry modal
  };

  const handleViewDetails = (walkIn) => {
    // Show walk-in details
    console.log('View details for walk-in:', walkIn);
    // TODO: Open details modal or navigate to detail page
  };

  const filteredWalkIns = useMemo(() => {
    let filtered = [...walkIns];

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(wi => wi.status === filters.status);
    }
    if (filters.assigned_staff) {
      filtered = filtered.filter(wi => wi.assigned_staff === filters.assigned_staff);
    }
    if (filters.start_date) {
      filtered = filtered.filter(wi => {
        const visitDate = new Date(wi.visit_date);
        return visitDate >= startOfDay(new Date(filters.start_date));
      });
    }
    if (filters.end_date) {
      filtered = filtered.filter(wi => {
        const visitDate = new Date(wi.visit_date);
        return visitDate <= endOfDay(new Date(filters.end_date));
      });
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(wi => {
        const customerName = wi.customer?.name || 
                           wi.customer?.['Contact Name'] || 
                           wi.customer?.['Display Name'] || 
                           '';
        return customerName.toLowerCase().includes(query) ||
               wi.assigned_staff?.toLowerCase().includes(query) ||
               wi.visit_purpose?.toLowerCase().includes(query) ||
               wi.notes?.toLowerCase().includes(query);
      });
    }

    return filtered;
  }, [walkIns, filters, searchQuery]);

  const todayWalkIns = useMemo(() => {
    return filteredWalkIns.filter(wi => {
      try {
        return isToday(new Date(wi.visit_date));
      } catch {
        return false;
      }
    });
  }, [filteredWalkIns]);

  const activeWalkIns = useMemo(() => {
    return filteredWalkIns.filter(wi => wi.status === 'active');
  }, [filteredWalkIns]);

  // Open create modal when navigated from catalog with "Create Walk In"
  useEffect(() => {
    if (location.state?.openCreate) {
      setIsWalkInModalOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.openCreate, location.pathname, navigate]);

  if (loading && walkIns.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <LoadingSpinner message="Loading walk-ins..." />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#2c2416', mb: 0.5 }}>
              Walk-in Management
            </Typography>
            <Typography variant="body1" sx={{ color: '#6b7280' }}>
              Record and manage customer visits
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<UserPlus size={18} />}
            onClick={() => setIsWalkInModalOpen(true)}
            sx={{
              bgcolor: '#8b6f47',
              '&:hover': { bgcolor: '#6d5637' }
            }}
          >
            New Walk-in
          </Button>
        </Box>

        {error && (
          <Box sx={{ mb: 2 }}>
            <ErrorMessage message={error} onRetry={() => refetch(filters)} />
          </Box>
        )}

        {/* Filters */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search walk-ins..."
            />
          </Box>
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="follow_up">Follow Up</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Start Date"
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />

          <TextField
            label="End Date"
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
        </Box>

        {/* Summary Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Today's Walk-ins
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c2416' }}>
              {todayWalkIns.length}
            </Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Active Walk-ins
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c2416' }}>
              {activeWalkIns.length}
            </Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Total (Filtered)
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c2416' }}>
              {filteredWalkIns.length}
            </Typography>
          </Box>
        </Box>
      </Box>

      {filteredWalkIns.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            textAlign: 'center',
          }}
        >
          <UserPlus size={64} color="#9ca3af" />
          <Typography variant="h6" sx={{ mt: 2, color: '#2c2416' }}>
            No walk-ins found
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', mt: 1 }}>
            {searchQuery || filters.status || filters.assigned_staff
              ? 'No walk-ins match your filters'
              : 'Register your first walk-in to get started'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredWalkIns.map((walkIn) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={walkIn.id}>
              <WalkInCard
                walkIn={walkIn}
                onViewDetails={handleViewDetails}
                onAddEnquiry={handleAddEnquiry}
                onEdit={(walkIn) => {
                  // TODO: Open edit modal
                  console.log('Edit walk-in:', walkIn);
                }}
                onDelete={handleDeleteWalkIn}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <WalkInModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        onSubmit={handleCreateWalkIn}
      />
    </Container>
  );
};


