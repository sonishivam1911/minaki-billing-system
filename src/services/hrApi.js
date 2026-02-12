/**
 * HR API - Dashboard metrics and workforce for HR Management
 */
import { apiRequest } from './apiClient';

function downloadCsvContent(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const hrApi = {
  getDashboardMetrics() {
    return apiRequest('GET', '/hr/dashboard/metrics');
  },

  getWorkforce(params = {}) {
    const { status = 'all', search, page = 1, page_size = 10 } = params;
    const queryParams = { status, page, page_size };
    if (search) queryParams.search = search;
    return apiRequest('GET', '/hr/employees', null, { params: queryParams });
  },

  startOnboarding(employeeId) {
    return apiRequest('POST', `/hr/employees/${employeeId}/start-onboarding`);
  },

  getDepartments() {
    return apiRequest('GET', '/hr/departments');
  },

  createEmployee(body) {
    return apiRequest('POST', '/hr/employees', body);
  },

  submitOnboarding(body) {
    return apiRequest('POST', '/hr/onboarding', body);
  },

  getShifts() {
    return apiRequest('GET', '/hr/shifts');
  },

  getSchedule(weekStart) {
    const params = weekStart ? { week_start: weekStart } : {};
    return apiRequest('GET', '/hr/schedule', null, { params });
  },

  getScheduleEmployees() {
    return apiRequest('GET', '/hr/schedule/employees');
  },

  createAssignment(body) {
    return apiRequest('POST', '/hr/schedule/assignments', body);
  },

  deleteAssignment(assignmentId) {
    return apiRequest('DELETE', `/hr/schedule/assignments/${assignmentId}`);
  },

  /** Export HR data (returns JSON array). Use exportDownloadCsv() for file download. */
  async exportData(format = 'json') {
    return apiRequest('GET', '/hr/data/export', null, { params: { format } });
  },

  /** Fetch HR export as JSON and trigger CSV file download. */
  async exportDownloadCsv() {
    const rows = await this.exportData('json');
    if (!Array.isArray(rows) || rows.length === 0) {
      const headers = ['employee_id', 'first_name', 'last_name', 'personal_email', 'status', 'department_name', 'position_name', 'created_at'];
      const csv = headers.join(',') + '\n';
      downloadCsvContent(csv, 'hr_employees_export.csv');
      return;
    }
    const fieldnames = Object.keys(rows[0]);
    const escape = (v) => {
      const s = v == null ? '' : String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headerLine = fieldnames.map(escape).join(',');
    const dataLines = rows.map((r) => fieldnames.map((f) => escape(r[f])).join(','));
    const csv = [headerLine, ...dataLines].join('\n');
    downloadCsvContent(csv, 'hr_employees_export.csv');
  },
};

export default hrApi;
