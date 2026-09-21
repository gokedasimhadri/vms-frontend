import * as XLSX from 'xlsx';
import jsPDFModule, { jsPDF as namedJsPDF } from 'jspdf';
import autoTableFn from 'jspdf-autotable';

// Helper to reliably retrieve jsPDF constructor across different bundler environments
const getJsPDF = () => {
  if (typeof namedJsPDF === 'function') return namedJsPDF;
  if (typeof jsPDFModule === 'function') return jsPDFModule;
  if (jsPDFModule && typeof jsPDFModule.jsPDF === 'function') return jsPDFModule.jsPDF;
  if (jsPDFModule && typeof jsPDFModule.default === 'function') return jsPDFModule.default;
  if (typeof window !== 'undefined' && window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
  return null;
};

// Helper to reliably invoke jspdf-autotable plugin
const applyAutoTable = (doc, options) => {
  if (typeof autoTableFn === 'function') {
    autoTableFn(doc, options);
    return;
  }
  if (autoTableFn && typeof autoTableFn.default === 'function') {
    autoTableFn.default(doc, options);
    return;
  }
  if (autoTableFn && typeof autoTableFn.autoTable === 'function') {
    autoTableFn.autoTable(doc, options);
    return;
  }
  if (typeof doc.autoTable === 'function') {
    doc.autoTable(options);
    return;
  }
  console.warn('jspdf-autotable is not available');
};

/**
 * Sanitize filename to prevent invalid file system characters
 */
const sanitizeFilename = (name) => {
  return String(name || 'data_export').replace(/[/\\?%*:|"<>]/g, '_').trim();
};

/**
 * Export data to CSV format
 */
export const exportToCSV = (headers, rows, filename = 'data_export') => {
  if (!headers || !headers.length) {
    alert('No data headers available for CSV export.');
    return;
  }

  const cleanRows = Array.isArray(rows) ? rows : [];
  const formatCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const csvRows = [
    headers.map(formatCell).join(','),
    ...cleanRows.map(row => row.map(formatCell).join(','))
  ];

  const csvContent = csvRows.join('\r\n');
  // Include UTF-8 BOM so Excel opens CSV files without character encoding problems
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${sanitizeFilename(filename)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

/**
 * Export data to Excel (.xlsx) format
 */
export const exportToExcel = (headers, rows, filename = 'data_export') => {
  if (!headers || !headers.length) {
    alert('No data headers available for Excel export.');
    return;
  }

  const cleanRows = Array.isArray(rows) ? rows : [];
  const sanitizedRows = cleanRows.map(row =>
    row.map(cell => (cell !== null && cell !== undefined ? cell : ''))
  );

  const data = [headers, ...sanitizedRows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Auto-fit column widths approximately
  const colWidths = headers.map((h, i) => {
    let maxLen = String(h).length;
    for (let r = 0; r < Math.min(cleanRows.length, 50); r++) {
      const cellVal = cleanRows[r]?.[i];
      if (cellVal !== null && cellVal !== undefined) {
        maxLen = Math.max(maxLen, String(cellVal).length);
      }
    }
    return { wch: Math.min(Math.max(maxLen + 3, 10), 40) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${sanitizeFilename(filename)}.xlsx`);
};

/**
 * Export data to PDF format
 */
export const exportToPDF = (headers, rows, filename = 'data_export', title = 'Data Export') => {
  if (!headers || !headers.length) {
    alert('No data headers available for PDF export.');
    return;
  }

  const JsPDFClass = getJsPDF();
  if (!JsPDFClass) {
    console.error('jsPDF library could not be loaded');
    alert('PDF export failed: PDF library is unavailable.');
    return;
  }

  // Use landscape mode if there are more than 5 columns
  const orientation = headers.length > 5 ? 'landscape' : 'portrait';
  const doc = new JsPDFClass({ orientation, unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Add Document Header / Title
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(title, pageWidth / 2, 28, { align: 'center' });

  // Add Generation timestamp subtitle
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100, 116, 139);
  const now = new Date().toLocaleString();
  doc.text(`Generated on: ${now}`, pageWidth / 2, 40, { align: 'center' });

  const cleanRows = Array.isArray(rows) ? rows : [];
  const sanitizedRows = cleanRows.map(row =>
    row.map(cell => (cell !== null && cell !== undefined ? String(cell) : ''))
  );

  applyAutoTable(doc, {
    head: [headers],
    body: sanitizedRows,
    startY: 48,
    styles: { 
      fontSize: headers.length > 8 ? 7 : 8, 
      cellPadding: 4,
      overflow: 'linebreak',
      textColor: [30, 41, 59]
    },
    headStyles: { 
      fillColor: [30, 41, 59], // Dark Slate
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: { 
      fillColor: [248, 250, 252] // Very light slate
    },
    margin: { top: 48, left: 14, right: 14, bottom: 20 },
    theme: 'grid'
  });

  doc.save(`${sanitizeFilename(filename)}.pdf`);
};

/**
 * Print table contents directly
 */
export const printTable = (tableSelector, title = 'Data Export') => {
  const tableEl = document.querySelector(tableSelector);
  if (!tableEl) {
    console.error(`Table with selector ${tableSelector} not found.`);
    return;
  }
  
  // Clone the table to manipulate it without affecting the real DOM
  const clonedTable = tableEl.cloneNode(true);
  
  // Define columns to exclude from printing
  const excludeHeaders = ['edit', 'remove', 'action', 'actions'];
  
  // Find indices of columns to remove
  const thElements = clonedTable.querySelectorAll('thead th');
  const indicesToRemove = [];
  
  thElements.forEach((th, index) => {
    const text = th.textContent.trim().toLowerCase();
    if (excludeHeaders.includes(text)) {
      indicesToRemove.push(index);
    }
  });
  
  // If there are columns to remove, process all rows
  if (indicesToRemove.length > 0) {
    // Sort indices in descending order so removing doesn't shift remaining indices
    indicesToRemove.sort((a, b) => b - a);
    
    const allRows = clonedTable.querySelectorAll('tr');
    allRows.forEach(row => {
      const cells = row.querySelectorAll('th, td');
      indicesToRemove.forEach(index => {
        if (cells[index]) {
          row.removeChild(cells[index]);
        }
      });
    });
  }
  
  const remainingCols = clonedTable.querySelectorAll('thead th').length;
  const isLandscape = remainingCols > 6;
  
  const printContent = clonedTable.outerHTML;
  const printWindow = window.open('', '', 'width=800,height=600');
  
  printWindow.document.write('<html><head><title>' + title + '</title>');
  printWindow.document.write(`
    <style>
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        padding: 20px; 
        color: #333; 
      }
      h2 { 
        text-align: center; 
        margin-bottom: 20px; 
        font-size: 24px;
      }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin-bottom: 20px;
        table-layout: auto;
      }
      th, td { 
        border: 1px solid #e2e8f0; 
        padding: 8px; 
        text-align: left; 
        font-size: 12px;
        word-wrap: break-word;
        overflow-wrap: break-word;
        white-space: normal;
      }
      th { 
        background-color: #f8fafc; 
        font-weight: 600; 
        color: #475569; 
        border-bottom: 2px solid #cbd5e1;
      }
      tr:nth-child(even) { 
        background-color: #f1f5f9; 
      }
      @media print {
        @page { 
          margin: 1cm;
          size: ${isLandscape ? 'landscape' : 'portrait'};
        }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
  `);
  printWindow.document.write('</head><body>');
  printWindow.document.write('<h2>' + title + '</h2>');
  printWindow.document.write(printContent);
  printWindow.document.write('</body></html>');
  
  printWindow.document.close();
  printWindow.focus();
  
  // Wait for styles to load
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};
