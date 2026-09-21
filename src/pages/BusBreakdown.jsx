import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import CustomTabs from '../components/CustomTabs';
import ExportButtons from '../components/ExportButtons';
import { TableLoader } from '../components/Loader';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils';
import {
  getBusBreakdownData,
  createBusBreakdownItem,
  deleteBusBreakdownItem,
} from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

const EMPTY_FORM = {
  busno: '',
  society: '',
  branch: '',
  drivername: '',
  driverphoneno: '',
  breakedownplace: '',
  natureofcomplaint: '',
  messagereceivetime: '',
  date: '',
  workassignedtime: '',
  workcompletedtime: '',
  workstatus: '',
  sparepartsutilised: '',
  travellingallowance: '',
  spartpartamount: '',
  foodallowance: '',
  totalamount: '',
};

const EMPTY_WORKER = { workername: '', workerdesignation: '' };

const STATUS_OPTIONS = ['Completed', 'Pending', 'In Progress'];

const ALL_COLUMNS = [
  { key: 'society', label: 'Society' },
  { key: 'branch', label: 'Branch' },
  { key: 'busno', label: 'Vehicle No.' },
  { key: 'drivername', label: 'Name of the Driver' },
  { key: 'driverphoneno', label: 'Driver Phone NO' },
  { key: 'breakedownplace', label: 'Break Down Place' },
  { key: 'natureofcomplaint', label: 'Complaint' },
  { key: 'date', label: 'Date' },
  { key: 'messagereceivetime', label: 'Message Received Time' },
  { key: 'workassignedtime', label: 'Work assigned Time' },
  { key: 'workcompletedtime', label: 'Work Completed Time' },
  { key: 'workstatus', label: 'Status' },
  { key: 'sparepartsutilised', label: 'Spare Parts' },
  { key: 'spartpartamount', label: 'Spare Part Amount' },
  { key: 'travellingallowance', label: 'Travelling Allowance' },
  { key: 'foodallowance', label: 'Food Allowance' },
  { key: 'noofworkers', label: "No'of Workers" },
  { key: 'totalamount', label: 'Total Amount' },
];

export default function BusBreakdown() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);

  // Tabs: 'breakdown' | 'report'
  const [activeTab, setActiveTab] = useState('breakdown');

  // Form state
  const [form, setForm] = useState(EMPTY_FORM);
  const [workers, setWorkers] = useState([
    { ...EMPTY_WORKER },
    { ...EMPTY_WORKER },
    { ...EMPTY_WORKER },
    { ...EMPTY_WORKER },
  ]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Table state
  const [tableData, setTableData] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Report tab state
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportEntriesPerPage, setReportEntriesPerPage] = useState(10);
  const [reportCurrentPage, setReportCurrentPage] = useState(1);

  // Custom Delete Confirm Modal State
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    id: null,
    itemName: '',
    loading: false
  });

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch (e) { }
    }
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchTable();
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // ---- Fetch table data ----
  const fetchTable = async () => {
    setTableLoading(true);
    try {
      const res = await getBusBreakdownData();
      setTableData(res?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setTableLoading(false);
    }
  };

  // ---- Form helpers ----
  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addWorkerRow = () =>
    setWorkers(w => [...w, { ...EMPTY_WORKER }]);

  const removeWorkerRow = () =>
    setWorkers(w => w.length > 1 ? w.slice(0, -1) : w);

  const setWorkerField = (idx, key, val) =>
    setWorkers(w => w.map((row, i) => i === idx ? { ...row, [key]: val } : row));

  // Calculate total amount automatically
  const calcTotal = () => {
    const t = parseFloat(form.travellingallowance || 0)
      + parseFloat(form.spartpartamount || 0)
      + parseFloat(form.foodallowance || 0);
    return isNaN(t) ? '' : String(t);
  };

  // ---- Save record ----
  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const filledWorkers = workers.filter(w => w.workername.trim());
      const payload = {
        ...form,
        totalamount: calcTotal(),
        noofworkers: filledWorkers.length,
        workers: filledWorkers,
      };
      await createBusBreakdownItem(payload);
      setSaveMsg('✓ Record saved successfully!');
      setForm(EMPTY_FORM);
      setWorkers([EMPTY_WORKER, EMPTY_WORKER, EMPTY_WORKER, EMPTY_WORKER]);
      fetchTable();
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e) {
      console.error(e);
      alert('Error saving record: ' + (e.response?.data?.message || e.message));
    } finally {
      setSaving(false);
    }
  };

  // ---- Delete ----
  const handlePromptDelete = (row) => {
    const rawId = row._id || row.id;
    const id = typeof rawId === 'object' ? (rawId?._id || rawId?.$oid || String(rawId)) : (rawId ? String(rawId) : '');
    const itemName = row.busno || row.regno || row.natureofcomplaint || '';
    setDeleteConfirmModal({
      isOpen: true,
      id,
      itemName,
      loading: false
    });
  };

  const handleConfirmDelete = async () => {
    const { id } = deleteConfirmModal;
    if (!id) {
      setDeleteConfirmModal({ isOpen: false, id: null, itemName: '', loading: false });
      return;
    }
    setDeleteConfirmModal(prev => ({ ...prev, loading: true }));
    try {
      await deleteBusBreakdownItem(id);
      setDeleteConfirmModal({ isOpen: false, id: null, itemName: '', loading: false });
      fetchTable();
    } catch (e) {
      setDeleteConfirmModal({ isOpen: false, id: null, itemName: '', loading: false });
      alert('Failed to delete: ' + (e.response?.data?.message || e.message));
    }
  };

  // ---- Filtered & paginated table ----
  const filtered = tableData.filter(row => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(row).some(v => v && String(v).toLowerCase().includes(q));
  });
  const totalPages = Math.ceil(filtered.length / entriesPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  // ---- Report tab ----
  const fetchReport = async () => {
    setReportLoading(true);
    try {
      const res = await getBusBreakdownData();
      let data = res?.data || [];
      if (fromDate) data = data.filter(r => r.date && r.date >= fromDate);
      if (toDate) data = data.filter(r => r.date && r.date <= toDate);
      setReportData(data);
      setReportCurrentPage(1);
    } catch (e) {
      console.error(e);
    } finally {
      setReportLoading(false);
    }
  };

  const filteredReport = reportData.filter(row => {
    if (!reportSearchQuery.trim()) return true;
    const q = reportSearchQuery.toLowerCase();
    return Object.values(row).some(v => v && String(v).toLowerCase().includes(q));
  });
  const totalReportPages = Math.ceil(filteredReport.length / reportEntriesPerPage) || 1;
  const paginatedReport = filteredReport.slice(
    (reportCurrentPage - 1) * reportEntriesPerPage,
    reportCurrentPage * reportEntriesPerPage
  );

  // ---- Export Handlers ----
  const handleExportBreakdownCSV = () => {
    if (!filtered.length) {
      alert('No data available to export');
      return;
    }
    const headers = ALL_COLUMNS.map(c => c.label);
    const rows = filtered.map(row => ALL_COLUMNS.map(c => row[c.key] ?? ''));
    exportToCSV(headers, rows, `Bus_Breakdown_${selectedBranch}`);
  };

  const handleExportBreakdownPDF = () => {
    if (!filtered.length) {
      alert('No data available to export');
      return;
    }
    const headers = ALL_COLUMNS.map(c => c.label);
    const rows = filtered.map(row => ALL_COLUMNS.map(c => row[c.key] ?? ''));
    exportToPDF(headers, rows, `Bus_Breakdown_${selectedBranch}`, `Bus Breakdown - ${selectedBranch}`);
  };

  const handleExportBreakdownExcel = () => {
    if (!filtered.length) {
      alert('No data available to export');
      return;
    }
    const headers = ALL_COLUMNS.map(c => c.label);
    const rows = filtered.map(row => ALL_COLUMNS.map(c => row[c.key] ?? ''));
    exportToExcel(headers, rows, `Bus_Breakdown_${selectedBranch}`);
  };

  const handleExportReportCSV = () => {
    if (!filteredReport.length) {
      alert('No data available to export');
      return;
    }
    const headers = ALL_COLUMNS.map(c => c.label);
    const rows = filteredReport.map(row => ALL_COLUMNS.map(c => row[c.key] ?? ''));
    exportToCSV(headers, rows, `Bus_Breakdown_Report_${selectedBranch}`);
  };

  const handleExportReportPDF = () => {
    if (!filteredReport.length) {
      alert('No data available to export');
      return;
    }
    const headers = ALL_COLUMNS.map(c => c.label);
    const rows = filteredReport.map(row => ALL_COLUMNS.map(c => row[c.key] ?? ''));
    exportToPDF(headers, rows, `Bus_Breakdown_Report_${selectedBranch}`, `Bus Breakdown Report - ${selectedBranch}`);
  };

  const handleExportReportExcel = () => {
    if (!filteredReport.length) {
      alert('No data available to export');
      return;
    }
    const headers = ALL_COLUMNS.map(c => c.label);
    const rows = filteredReport.map(row => ALL_COLUMNS.map(c => row[c.key] ?? ''));
    exportToExcel(headers, rows, `Bus_Breakdown_Report_${selectedBranch}`);
  };

  return (
    <MainLayout
      mobileLeftOpen={mobileLeftOpen}
      setMobileLeftOpen={setMobileLeftOpen}
      activeTab="Bus Breakdown"
      user={user}
      handleLogout={handleLogout}
    >
      <div className="bb-page-wrapper">

        {/* ── Top badge ── */}
        <div className="module-top-badge-wrapper">
          <div className="module-top-badge">
            <div className="module-top-badge-icon">
              <AlertTriangle size={16} />
            </div>
            <div className="module-top-badge-label">Bus Break Down</div>
          </div>
        </div>

        {/* ── Tab ribbon (pill style) ── */}
        <div className="bb-tabs-center">
          <CustomTabs
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id)}
            tabs={[
              { id: 'breakdown', label: 'Bus BreakDown' },
              { id: 'report', label: 'Generate Report' },
            ]}
          />
        </div>

        {/* ════════════════════════════════════════
            TAB 1 — Bus BreakDown form + data table
            ════════════════════════════════════════ */}
        {activeTab === 'breakdown' && (
          <div className="bb-content-card bb-content-card--gap">

            {/* ── Main form grid ── */}
            <div className="bb-form-grid">

              {/* Row 1 */}
              <div className="bb-field">
                <label>Bus No. :</label>
                <input value={form.busno} onChange={e => setField('busno', e.target.value)} placeholder="" />
              </div>
              <div className="bb-field">
                <label>Society</label>
                <input value={form.society} onChange={e => setField('society', e.target.value)} />
              </div>
              <div className="bb-field">
                <label>Branch :</label>
                <input value={form.branch} onChange={e => setField('branch', e.target.value)} />
              </div>

              {/* Row 2 */}
              <div className="bb-field">
                <label>Name of the Driver :</label>
                <input value={form.drivername} onChange={e => setField('drivername', e.target.value)} />
              </div>
              <div className="bb-field">
                <label>Driver Phone NO :</label>
                <input value={form.driverphoneno} onChange={e => setField('driverphoneno', e.target.value)} />
              </div>
              <div className="bb-field">
                <label>Breake Down place :</label>
                <input value={form.breakedownplace} onChange={e => setField('breakedownplace', e.target.value)} />
              </div>

              {/* Row 3 */}
              <div className="bb-field">
                <label>Nature of complaint :</label>
                <input value={form.natureofcomplaint} onChange={e => setField('natureofcomplaint', e.target.value)} />
              </div>
              <div className="bb-field">
                <label>Message received time :</label>
                <input value={form.messagereceivetime} onChange={e => setField('messagereceivetime', e.target.value)} placeholder="e.g. 06.10am" />
              </div>
              <div className="bb-field">
                <label>Date:</label>
                <input type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
              </div>

              {/* Row 4 */}
              <div className="bb-field">
                <label>Work Assigned Time:</label>
                <input value={form.workassignedtime} onChange={e => setField('workassignedtime', e.target.value)} placeholder="e.g. 07.15am" />
              </div>
              <div className="bb-field">
                <label>Work Completed Time:</label>
                <input value={form.workcompletedtime} onChange={e => setField('workcompletedtime', e.target.value)} placeholder="e.g. 09.15am" />
              </div>
              <div className="bb-field">
                <label>Work Status:</label>
                <select value={form.workstatus} onChange={e => setField('workstatus', e.target.value)}>
                  <option value="">-- Select --</option>
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              {/* Row 5 */}
              <div className="bb-field">
                <label>Spare Part Utilised if any:</label>
                <input value={form.sparepartsutilised} onChange={e => setField('sparepartsutilised', e.target.value)} />
              </div>
              <div className="bb-field">
                <label>Travelling Allowance:</label>
                <input type="number" value={form.travellingallowance} onChange={e => setField('travellingallowance', e.target.value)} />
              </div>
              <div className="bb-field">
                <label>Spare Part amount if purchased:</label>
                <input type="number" value={form.spartpartamount} onChange={e => setField('spartpartamount', e.target.value)} />
              </div>

              {/* Row 6 */}
              <div className="bb-field">
                <label>Food allowances :</label>
                <input type="number" value={form.foodallowance} onChange={e => setField('foodallowance', e.target.value)} />
              </div>
              <div className="bb-field">
                <label>Total Amount :</label>
                <input value={calcTotal()} readOnly style={{ background: '#f8fafc', color: '#64748b' }} />
              </div>
              <div className="bb-field" />
            </div>

            {/* ── Workers Data section ── */}
            <div className="bb-workers-section">
              <h3 className="bb-section-title">Workers Data</h3>
              <div className="bb-workers-actions">
                <button className="bb-add-btn" onClick={addWorkerRow}>Add row</button>
                <button className="bb-remove-btn" onClick={removeWorkerRow}>Remove row</button>
              </div>
              <table className="bb-workers-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Worker Name</th>
                    <th>Worker Designation</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((w, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>
                        <input
                          className="bb-worker-input"
                          value={w.workername}
                          onChange={e => setWorkerField(i, 'workername', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="bb-worker-input"
                          value={w.workerdesignation}
                          onChange={e => setWorkerField(i, 'workerdesignation', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Save button */}
            <div className="bb-save-row">
              {saveMsg && <span className="bb-save-msg">{saveMsg}</span>}
              <button className="bb-save-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'save'}
              </button>
            </div>

            {/* ── Data table ── */}
            <div className="bb-table-section">
              {/* Toolbar */}
              <div className="admin-table-toolbar">
                <ExportButtons
                  onCSV={handleExportBreakdownCSV}
                  onPDF={handleExportBreakdownPDF}
                  onExcel={handleExportBreakdownExcel}
                />
                <div className="admin-entries-control">
                  <span>Show</span>
                  <select value={entriesPerPage} onChange={e => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>entries</span>
                </div>
                <div className="admin-search-control">
                  <label>Search:</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  />
                </div>
              </div>

              {/* Table */}
              <div className="admin-table-responsive">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 50, textAlign: 'center' }}>▴ S.No</th>
                      {ALL_COLUMNS.map(c => <th key={c.key}>{c.label}</th>)}
                      <th style={{ textAlign: 'center' }}>Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableLoading ? (
                      <TableLoader colSpan={ALL_COLUMNS.length + 2} message="Loading Bus Breakdown records, please wait..." />
                    ) : paginated.length > 0 ? (
                      paginated.map((row, idx) => (
                        <tr key={row._id || row.id || idx}>
                          <td style={{ textAlign: 'center' }}>{(currentPage - 1) * entriesPerPage + idx + 1}</td>
                          {ALL_COLUMNS.map(c => (
                            <td key={c.key}>{row[c.key] !== undefined && row[c.key] !== null ? String(row[c.key]) : '-'}</td>
                          ))}
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="bb-del-btn"
                              title="Delete"
                              onClick={() => handlePromptDelete(row)}
                            >🗑</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={ALL_COLUMNS.length + 2} className="empty-cell">No data available in table</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="admin-table-footer">
                <div>
                  Showing {filtered.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to {Math.min(currentPage * entriesPerPage, filtered.length)} of {filtered.length} entries
                </div>
                <div className="admin-pagination-group">
                  <button className="admin-pbtn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Previous</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(n => (
                    <button key={n} className={`admin-pbtn ${currentPage === n ? 'active' : ''}`} onClick={() => setCurrentPage(n)}>{n}</button>
                  ))}
                  <button className="admin-pbtn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB 2 — Generate Report
            ════════════════════════════════════════ */}
        {activeTab === 'report' && (
          <div className="bb-content-card bb-content-card--gap">
            <div className="bb-report-filter-row">
              <div className="bb-report-field">
                <label>From Date :</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
              <div className="bb-report-field">
                <label>To Date :</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
              <button className="bb-getdata-btn" onClick={fetchReport} disabled={reportLoading}>
                {reportLoading ? 'Loading...' : 'getdata'}
              </button>
            </div>

            {/* Report table toolbar */}
            <div className="admin-table-toolbar" style={{ marginTop: 16 }}>
              <ExportButtons
                onCSV={handleExportReportCSV}
                onPDF={handleExportReportPDF}
                onExcel={handleExportReportExcel}
              />
              <div className="admin-entries-control">
                <span>Show</span>
                <select value={reportEntriesPerPage} onChange={e => { setReportEntriesPerPage(Number(e.target.value)); setReportCurrentPage(1); }}>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>entries</span>
              </div>
              <div className="admin-search-control">
                <label>Search:</label>
                <input type="text" value={reportSearchQuery} onChange={e => { setReportSearchQuery(e.target.value); setReportCurrentPage(1); }} />
              </div>
            </div>

            <div className="admin-table-responsive">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th style={{ width: 50, textAlign: 'center' }}>▴ .No</th>
                    {ALL_COLUMNS.map(c => <th key={c.key}>{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {reportLoading ? (
                    <TableLoader colSpan={ALL_COLUMNS.length + 1} message="Loading Bus Breakdown report, please wait..." />
                  ) : paginatedReport.length > 0 ? (
                    paginatedReport.map((row, idx) => (
                      <tr key={row._id || row.id || idx}>
                        <td style={{ textAlign: 'center' }}>{(reportCurrentPage - 1) * reportEntriesPerPage + idx + 1}</td>
                        {ALL_COLUMNS.map(c => (
                          <td key={c.key}>{row[c.key] !== undefined && row[c.key] !== null ? String(row[c.key]) : '-'}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={ALL_COLUMNS.length + 1} className="empty-cell">No data available in table</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-table-footer">
              <div>
                Showing {filteredReport.length === 0 ? 0 : (reportCurrentPage - 1) * reportEntriesPerPage + 1} to {Math.min(reportCurrentPage * reportEntriesPerPage, filteredReport.length)} of {filteredReport.length} entries
              </div>
              <div className="admin-pagination-group">
                <button className="admin-pbtn" disabled={reportCurrentPage === 1} onClick={() => setReportCurrentPage(p => Math.max(1, p - 1))}>Previous</button>
                {Array.from({ length: Math.min(5, totalReportPages) }, (_, i) => i + 1).map(n => (
                  <button key={n} className={`admin-pbtn ${reportCurrentPage === n ? 'active' : ''}`} onClick={() => setReportCurrentPage(n)}>{n}</button>
                ))}
                <button className="admin-pbtn" disabled={reportCurrentPage >= totalReportPages} onClick={() => setReportCurrentPage(p => Math.min(totalReportPages, p + 1))}>Next</button>
              </div>
            </div>
          </div>
        )}
        {/* Custom Confirmation Modal for Delete */}
        <ConfirmModal
          isOpen={deleteConfirmModal.isOpen}
          title="Remove Bus Breakdown Record"
          message="Are you sure you want to delete this bus breakdown record? This action cannot be undone."
          itemName={deleteConfirmModal.itemName}
          confirmText="Yes, Remove"
          cancelText="Cancel"
          confirmVariant="danger"
          loading={deleteConfirmModal.loading}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirmModal({ isOpen: false, id: null, itemName: '', loading: false })}
        />
      </div>
    </MainLayout>
  );
}
