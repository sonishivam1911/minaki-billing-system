import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Printer } from 'lucide-react';
import { Button, Menu, MenuItem, CircularProgress } from '@mui/material';
import { exportToCSV, exportToPDF, printReport } from '../../utils/exportUtils';

/**
 * ExportButton Component
 * Provides export options: CSV, PDF, Print
 * 
 * @param {Object} props
 * @param {Array} props.data - Data to export
 * @param {Array} props.columns - Column definitions for export
 * @param {string} props.reportType - Type of report
 * @param {string} props.reportTitle - Title of the report
 * @param {Object} props.summary - Summary data for PDF export
 */
export const ExportButton = ({
  data = [],
  columns = [],
  reportType = 'report',
  reportTitle = 'Report',
  summary = null,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [exporting, setExporting] = useState(false);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      await exportToCSV(data, columns, `${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
      handleClose();
    } catch (error) {
      console.error('CSV export failed:', error);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      await exportToPDF(
        {
          title: reportTitle,
          data,
          columns,
          summary,
        },
        reportType,
        `${reportType}_${new Date().toISOString().split('T')[0]}.pdf`
      );
      handleClose();
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    try {
      printReport(reportTitle);
      handleClose();
    } catch (error) {
      console.error('Print failed:', error);
      alert('Failed to print. Please try again.');
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={exporting ? <CircularProgress size={16} /> : <Download size={18} />}
        onClick={handleClick}
        disabled={exporting || !data || data.length === 0}
        sx={{
          borderColor: '#8b6f47',
          color: '#8b6f47',
          '&:hover': {
            borderColor: '#6b5638',
            backgroundColor: '#f5f1e8',
          },
        }}
      >
        {exporting ? 'Exporting...' : 'Export'}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleExportCSV} disabled={exporting}>
          <FileSpreadsheet size={18} style={{ marginRight: 8 }} />
          Export as CSV
        </MenuItem>
        <MenuItem onClick={handleExportPDF} disabled={exporting}>
          <FileText size={18} style={{ marginRight: 8 }} />
          Export as PDF
        </MenuItem>
        <MenuItem onClick={handlePrint}>
          <Printer size={18} style={{ marginRight: 8 }} />
          Print
        </MenuItem>
      </Menu>
    </>
  );
};

