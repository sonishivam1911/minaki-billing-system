import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  LinearProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Calendar, ChevronLeft, ChevronRight, Search, UserPlus, X } from 'lucide-react';
import hrApi from '../../services/hrApi';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday;
}

function formatDateKey(d) {
  return d.toISOString().slice(0, 10);
}

function weekDatesFromMonday(monday) {
  const dates = [];
  const m = new Date(monday);
  for (let i = 0; i < 7; i++) {
    const d = new Date(m);
    d.setDate(m.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function HrWeeklySchedulePage() {
  const [weekStart, setWeekStart] = useState(() => getWeekMonday(new Date()));
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [schedule, setSchedule] = useState({ shifts: [], assignments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [assigning, setAssigning] = useState(null); // { dateKey, shiftId }
  const [assignForm, setAssignForm] = useState({ employeeId: '' });

  const weekDates = weekDatesFromMonday(weekStart);
  const weekStartStr = formatDateKey(weekStart);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [shiftsRes, employeesRes, scheduleRes] = await Promise.all([
        hrApi.getShifts(),
        hrApi.getScheduleEmployees(),
        hrApi.getSchedule(weekStartStr),
      ]);
      setShifts(Array.isArray(shiftsRes) ? shiftsRes : []);
      setEmployees(Array.isArray(employeesRes) ? employeesRes : []);
      setSchedule({
        shifts: Array.isArray(scheduleRes?.shifts) ? scheduleRes.shifts : [],
        assignments: Array.isArray(scheduleRes?.assignments) ? scheduleRes.assignments : [],
      });
    } catch (e) {
      setError(e?.message || 'Failed to load schedule');
      setShifts([]);
      setEmployees([]);
      setSchedule({ shifts: [], assignments: [] });
    } finally {
      setLoading(false);
    }
  }, [weekStartStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const prevWeek = useCallback(() => {
    const m = new Date(weekStart);
    m.setDate(m.getDate() - 7);
    setWeekStart(m);
  }, [weekStart]);

  const nextWeek = useCallback(() => {
    const m = new Date(weekStart);
    m.setDate(m.getDate() + 7);
    setWeekStart(m);
  }, [weekStart]);

  const filteredEmployees = search.trim()
    ? employees.filter(
        (e) =>
          `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
          (e.employee_id || '').toLowerCase().includes(search.toLowerCase())
      )
    : employees;

  const getAssignmentsFor = useCallback(
    (dateKey, shiftId) => {
      return (schedule.assignments || []).filter(
        (a) => a.assignment_date === dateKey && a.shift_id === shiftId
      );
    },
    [schedule.assignments]
  );

  const handleAddAssignment = useCallback(
    async (dateKey, shiftId) => {
      const employeeId = assignForm.employeeId ? Number(assignForm.employeeId) : null;
      if (!employeeId) return;
      setAssigning({ dateKey, shiftId });
      try {
        await hrApi.createAssignment({
          employee_id: employeeId,
          shift_id: shiftId,
          assignment_date: dateKey,
        });
        setAssignForm({ employeeId: '' });
        setAssigning(null);
        await loadData();
      } catch (e) {
        alert(e?.message || 'Failed to assign');
        setAssigning(null);
      }
    },
    [assignForm.employeeId, loadData]
  );

  const handleRemoveAssignment = useCallback(
    async (assignmentId) => {
      try {
        await hrApi.deleteAssignment(assignmentId);
        await loadData();
      } catch (e) {
        alert(e?.message || 'Failed to remove');
      }
    },
    [loadData]
  );

  const openAssign = (dateKey, shiftId) => setAssigning({ dateKey, shiftId });
  const closeAssign = () => {
    setAssigning(null);
    setAssignForm({ employeeId: '' });
  };

  const shiftRows = schedule.shifts.length ? schedule.shifts : shifts;
  const weekLabel = `${weekDates[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${weekDates[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Calendar size={28} color="#8b6f47" />
          <Typography variant="h5" fontWeight={600} color="#2c2416">
            Weekly Schedule
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={prevWeek} size="small" sx={{ color: '#8b6f47' }}>
            <ChevronLeft size={24} />
          </IconButton>
          <Typography variant="body1" fontWeight={600} sx={{ minWidth: 220, textAlign: 'center' }}>
            {weekLabel}
          </Typography>
          <IconButton onClick={nextWeek} size="small" sx={{ color: '#8b6f47' }}>
            <ChevronRight size={24} />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {loading ? (
        <LinearProgress sx={{ mb: 2 }} />
      ) : (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {/* Left: Employees */}
          <Card sx={{ minWidth: 260, maxWidth: 320, height: 'fit-content' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Employees
              </Typography>
              <TextField
                size="small"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fullWidth
                sx={{ mb: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} />
                    </InputAdornment>
                  ),
                }}
              />
              <TableContainer sx={{ maxHeight: 360, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Name</strong></TableCell>
                      <TableCell><strong>Dept</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} align="center" sx={{ py: 2 }} color="text.secondary">
                          No employees. Add staff from the HR Dashboard.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <TableRow key={emp.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {emp.first_name} {emp.last_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {emp.employee_id}
                            </Typography>
                          </TableCell>
                          <TableCell>{emp.department_name || '–'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Right: Week grid */}
          <Card sx={{ flex: 1, minWidth: 0 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Schedule grid
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Click &quot;Assign&quot; in a cell to assign an employee to that shift. Remove with the × button.
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ overflow: 'auto' }}>
                <Table size="small" sx={{ minWidth: 700 }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 600, width: 120 }}>Shift</TableCell>
                      {weekDates.map((d, i) => (
                        <TableCell key={d.toISOString()} align="center" sx={{ fontWeight: 600, minWidth: 100 }}>
                          {DAY_LABELS[i]}
                          <Typography variant="caption" display="block" color="text.secondary">
                            {d.getDate()}/{d.getMonth() + 1}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shiftRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }} color="text.secondary">
                          No shifts defined. Refresh the page to seed default shifts (Morning, Afternoon, Evening).
                        </TableCell>
                      </TableRow>
                    ) : (
                      shiftRows.map((shift) => (
                        <TableRow key={shift.id}>
                          <TableCell sx={{ fontWeight: 500 }}>
                            {shift.name}
                            {shift.start_time != null && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                {String(shift.start_time).slice(0, 5)} – {String(shift.end_time).slice(0, 5)}
                              </Typography>
                            )}
                          </TableCell>
                          {weekDates.map((d) => {
                            const dateKey = formatDateKey(d);
                            const assignments = getAssignmentsFor(dateKey, shift.id);
                            const isAssigning = assigning?.dateKey === dateKey && assigning?.shiftId === shift.id;
                            return (
                              <TableCell key={dateKey} align="center" sx={{ verticalAlign: 'top', minWidth: 100 }}>
                                {isAssigning ? (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                                    <FormControl size="small" fullWidth>
                                      <InputLabel>Employee</InputLabel>
                                      <Select
                                        value={assignForm.employeeId}
                                        label="Employee"
                                        onChange={(e) => setAssignForm((f) => ({ ...f, employeeId: e.target.value }))}
                                      >
                                        <MenuItem value="">— Select —</MenuItem>
                                        {employees.map((emp) => (
                                          <MenuItem key={emp.id} value={emp.id}>
                                            {emp.first_name} {emp.last_name}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                      <Button size="small" variant="contained" sx={{ backgroundColor: '#8b6f47', '&:hover': { backgroundColor: '#7a6340' } }} onClick={() => handleAddAssignment(dateKey, shift.id)}>
                                        Add
                                      </Button>
                                      <Button size="small" onClick={closeAssign}>Cancel</Button>
                                    </Box>
                                  </Box>
                                ) : (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                                    {assignments.map((a) => (
                                      <Chip
                                        key={a.id}
                                        size="small"
                                        label={a.employee_name || 'Staff'}
                                        onDelete={() => handleRemoveAssignment(a.id)}
                                        deleteIcon={<X size={14} />}
                                        sx={{ backgroundColor: '#e8e0d5', color: '#2c2416', fontWeight: 500 }}
                                      />
                                    ))}
                                    <Button
                                      size="small"
                                      startIcon={<UserPlus size={14} />}
                                      onClick={() => openAssign(dateKey, shift.id)}
                                      sx={{ color: '#8b6f47', mt: 0.5 }}
                                    >
                                      Assign
                                    </Button>
                                  </Box>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}
    </Container>
  );
}
