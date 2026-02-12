import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column definitions [{ key, label, format }]
 * @param {string} filename - Output filename
 */
export const exportToCSV = (data, columns, filename = 'export.csv') => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Prepare headers
  const headers = columns.map((col) => col.label || col.key);

  // Prepare rows
  const rows = data.map((row) => {
    return columns.map((col) => {
      const value = row[col.key];
      return formatValueForExport(value, col.format);
    });
  });

  // Combine headers and rows
  const csvData = [headers, ...rows];

  // Convert to CSV string
  const csvContent = csvData.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export data to PDF format
 * @param {Object} reportData - Report data object { title, data, columns, summary }
 * @param {string} reportType - Type of report
 * @param {string} filename - Output filename
 */
export const exportToPDF = async (reportData, reportType, filename = 'export.pdf') => {
  const { title, data, columns, summary } = reportData;

  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const doc = new jsPDF();
  let yPosition = 20;

  // Add title
  doc.setFontSize(18);
  doc.setTextColor(139, 111, 71); // #8b6f47
  doc.text(title || 'Report', 14, yPosition);
  yPosition += 10;

  // Add date
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128); // #6b7280
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPosition);
  yPosition += 15;

  // Add summary if available
  if (summary) {
    doc.setFontSize(12);
    doc.setTextColor(44, 38, 22); // #2c2416
    doc.text('Summary', 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    Object.entries(summary).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        const formattedValue = typeof value === 'number' && value > 1000
          ? `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : String(value);
        doc.text(`${key}: ${formattedValue}`, 20, yPosition);
        yPosition += 6;
      }
    });
    yPosition += 5;
  }

  // Prepare table data
  const tableHeaders = columns.map((col) => col.label || col.key);
  const tableRows = data.map((row) => {
    return columns.map((col) => {
      const value = row[col.key];
      return formatValueForExport(value, col.format);
    });
  });

  // Add table
  doc.autoTable({
    head: [tableHeaders],
    body: tableRows,
    startY: yPosition,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [139, 111, 71], // #8b6f47
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // #f9fafb
    },
    margin: { top: yPosition, left: 14, right: 14 },
  });

  // Save PDF
  doc.save(filename);
};

/**
 * Print report
 * @param {string} reportTitle - Title of the report
 */
export const printReport = (reportTitle = 'Report') => {
  // Create print styles
  const printStyles = `
    <style>
      @media print {
        body * {
          visibility: hidden;
        }
        .print-section, .print-section * {
          visibility: visible;
        }
        .print-section {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
      }
    </style>
  `;

  // Add print styles to head
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = printStyles;
  document.head.appendChild(styleSheet);

  // Mark elements to print
  const reportSection = document.querySelector('.report-content');
  if (reportSection) {
    reportSection.classList.add('print-section');
  }

  // Print
  window.print();

  // Cleanup
  setTimeout(() => {
    if (reportSection) {
      reportSection.classList.remove('print-section');
    }
    document.head.removeChild(styleSheet);
  }, 1000);
};

/**
 * Format value for export
 * @param {*} value - Value to format
 * @param {string} format - Format type
 * @returns {string} Formatted value
 */
const formatValueForExport = (value, format) => {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  if (format === 'currency') {
    return `₹${parseFloat(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (format === 'number') {
    return parseFloat(value).toLocaleString('en-IN');
  }

  if (format === 'date') {
    return new Date(value).toLocaleDateString();
  }

  if (format === 'datetime') {
    return new Date(value).toLocaleString();
  }

  if (format === 'percentage') {
    return `${parseFloat(value).toFixed(2)}%`;
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

