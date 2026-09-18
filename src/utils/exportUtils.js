import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export data to CSV format
 */
export const exportToCSV = (headers, rows, filename = 'data_export') => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export data to Excel (.xlsx) format
 */
export const exportToExcel = (headers, rows, filename = 'data_export') => {
  const data = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Export data to PDF format
 */
export const exportToPDF = (headers, rows, filename = 'data_export', title = 'Data Export') => {
  // Use landscape mode if there are many columns
  const orientation = headers.length > 6 ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation });
  
  // Add Title
  doc.setFontSize(16);
  doc.text(title, doc.internal.pageSize.width / 2, 15, { align: 'center' });
  
  // Generate Table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 25,
    styles: { 
      fontSize: 9, 
      cellPadding: 3,
      overflow: 'linebreak'
    },
    headStyles: { 
      fillColor: [71, 85, 105], // Slate-600
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: { 
      fillColor: [248, 250, 252] // Slate-50
    },
    margin: { top: 25, left: 10, right: 10, bottom: 15 }
  });
  
  doc.save(`${filename}.pdf`);
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
