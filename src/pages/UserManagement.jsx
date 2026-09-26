import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import {
  getUsersData,
  createUserItem,
  updateUserItem,
  deleteUserItem,
  getAdminData
} from '../services/api';
import {
  Users, UserCheck, ShieldCheck, Key, Plus, Search,
  Edit2, Trash2, X, Check, RefreshCw
} from 'lucide-react';

const UserManagement = () => {
  const navigate = useNavigate();
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [user, setUser] = useState(null);

  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    role: 'BRANCH_USER',
    branch: '',
    branches: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Delete confirm modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    user: null,
    loading: false
  });

  // Available metadata for branches
  const [availableBranches, setAvailableBranches] = useState([]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setUser(parsed);
        const usernameLower = (parsed.username || '').toLowerCase();
        const roleUpper = (parsed.role || '').toUpperCase();
        const isVmsUser = ['vms', 'vmskkd', 'vc', 'admin'].includes(usernameLower) ||
                          ['ADMIN', 'SUPER_ADMIN'].includes(roleUpper) ||
                          parsed.branch === 'VMS' ||
                          parsed.branch === 'ALL';
        if (!isVmsUser) {
          navigate('/dashboard');
        }
      } catch (e) {
        console.error('Failed to parse user session', e);
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  // Fetch Metadata Branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchRes = await getAdminData('branches', 'ALL').catch(() => null);
        const branchData = Array.isArray(branchRes) ? branchRes : (Array.isArray(branchRes?.data) ? branchRes.data : []);
        const branchNames = branchData
          .map(b => (b.name || b.branchname || '').trim())
          .filter(Boolean);
        setAvailableBranches(Array.from(new Set(branchNames)).sort());
      } catch (err) {
        console.error('Error fetching metadata branches:', err);
      }
    };
    fetchBranches();
  }, []);

  // Fetch Users List
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsersData(searchQuery, branchFilter, roleFilter);
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setUsersList(data);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsersList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, branchFilter]);

  // Handle Search Trigger
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filtered Users List (Client-side Search refinement)
  const filteredUsers = useMemo(() => {
    let result = usersList;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(u =>
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.branch && u.branch.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q))
      );
    }

    if (roleFilter !== 'ALL') {
      result = result.filter(u => u.role === roleFilter);
    }

    if (branchFilter !== 'ALL') {
      result = result.filter(u => u.branch === branchFilter || (Array.isArray(u.branches) && u.branches.includes(branchFilter)));
    }

    return result;
  }, [usersList, searchQuery, roleFilter, branchFilter]);

  // Pagination Logic
  const totalEntries = filteredUsers.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredUsers.slice(indexOfFirstEntry, indexOfLastEntry);

  // Stats Counters
  const stats = useMemo(() => {
    const total = usersList.length;
    const branchUsers = usersList.filter(u => u.role === 'BRANCH_USER').length;
    const branchAdmins = usersList.filter(u => u.role === 'BRANCH_ADMIN').length;
    const admins = usersList.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length;
    return { total, branchUsers, branchAdmins, admins };
  }, [usersList]);

  // Modal Handlers
  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      name: '',
      password: '',
      role: 'BRANCH_USER',
      branch: availableBranches[0] || '',
      branches: []
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      username: u.username || '',
      name: u.name || '',
      password: '',
      role: u.role || 'BRANCH_USER',
      branch: u.branch || '',
      branches: Array.isArray(u.branches) ? [...u.branches] : []
    });
    setFormError('');
    setShowModal(true);
  };

  const handleToggleBranchSelection = (branchName) => {
    setFormData(prev => {
      const exists = prev.branches.includes(branchName);
      if (exists) {
        return { ...prev, branches: prev.branches.filter(b => b !== branchName) };
      } else {
        return { ...prev, branches: [...prev.branches, branchName] };
      }
    });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.username.trim()) {
      setFormError('Username is required.');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      setFormError('Password is required for new users.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        username: formData.username.trim(),
        name: formData.name.trim() || formData.username.trim(),
        role: formData.role,
        branch: formData.branch,
        branches: formData.branches
      };

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      if (editingUser) {
        await updateUserItem(editingUser._id, payload);
        setSuccessToast('User updated successfully!');
      } else {
        await createUserItem(payload);
        setSuccessToast('User created successfully!');
      }

      setShowModal(false);
      fetchUsers();

      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      console.error('Error saving user:', err);
      setFormError(err.response?.data?.message || err.message || 'Failed to save user.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete User Handler
  const handleDeleteConfirm = async () => {
    if (!deleteModal.user) return;
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      await deleteUserItem(deleteModal.user._id);
      setSuccessToast(`User '${deleteModal.user.username}' deleted successfully.`);
      setDeleteModal({ isOpen: false, user: null, loading: false });
      fetchUsers();
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err.response?.data?.message || 'Failed to delete user');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const formatRoleBadge = (role) => {
    const r = (role || '').toUpperCase();
    if (r === 'ADMIN' || r === 'SUPER_ADMIN') {
      return (
        <span style={{
          backgroundColor: '#fef3c7',
          color: '#b45309',
          border: '1px solid #fde68a',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <ShieldCheck size={12} /> {r}
        </span>
      );
    }
    if (r === 'BRANCH_ADMIN') {
      return (
        <span style={{
          backgroundColor: '#f3e8ff',
          color: '#6b21a8',
          border: '1px solid #e9d5ff',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <UserCheck size={12} /> BRANCH ADMIN
        </span>
      );
    }
    return (
      <span style={{
        backgroundColor: '#e0f2fe',
        color: '#0369a1',
        border: '1px solid #bae6fd',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <Users size={12} /> BRANCH USER
      </span>
    );
  };

  return (
    <MainLayout
      mobileLeftOpen={mobileLeftOpen}
      setMobileLeftOpen={setMobileLeftOpen}
      activeTab="User Management"
      user={user}
      handleLogout={handleLogout}
    >
      <div>
        {/* Breadcrumb Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              User Management
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Manage user credentials, branch assignments, and role permissions stored in MongoDB login collection.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(2,132,199,0.2)',
              transition: 'all 0.2s ease'
            }}
          >
            <Plus size={16} /> Add New User
          </button>
        </div>

        {/* Success Toast Notification */}
        {successToast && (
          <div style={{
            backgroundColor: '#ecfdf5',
            color: '#047857',
            border: '1px solid #a7f3d0',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={16} /> {successToast}
          </div>
        )}

        {/* Summary Stat Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '16px 20px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Total Users
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {stats.total}
              </div>
            </div>
            <div style={{ backgroundColor: '#e0f2fe', color: '#0284c7', padding: '10px', borderRadius: '8px' }}>
              <Users size={22} />
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            padding: '16px 20px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Branch Users
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0369a1', marginTop: '4px' }}>
                {stats.branchUsers}
              </div>
            </div>
            <div style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '10px', borderRadius: '8px' }}>
              <Users size={22} />
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            padding: '16px 20px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Branch Admins
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#7e22ce', marginTop: '4px' }}>
                {stats.branchAdmins}
              </div>
            </div>
            <div style={{ backgroundColor: '#f3e8ff', color: '#7e22ce', padding: '10px', borderRadius: '8px' }}>
              <UserCheck size={22} />
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            padding: '16px 20px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                System Admins
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#b45309', marginTop: '4px' }}>
                {stats.admins}
              </div>
            </div>
            <div style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '10px', borderRadius: '8px' }}>
              <ShieldCheck size={22} />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '16px 20px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
            {/* Search Box */}
            <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by username, name or branch..."
                value={searchQuery}
                onChange={handleSearchChange}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  color: '#0f172a'
                }}
              />
            </div>

            {/* Role Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Role:</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  backgroundColor: '#ffffff',
                  color: '#0f172a'
                }}
              >
                <option value="ALL">All Roles</option>
                <option value="BRANCH_USER">BRANCH_USER</option>
                <option value="BRANCH_ADMIN">BRANCH_ADMIN</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            {/* Branch Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Branch:</label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  maxWidth: '220px'
                }}
              >
                <option value="ALL">All Branches</option>
                {availableBranches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchUsers}
            title="Refresh Users List"
            style={{
              backgroundColor: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Main Users Datatable */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}>
          {/* Table Control Header */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px'
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>entries</span>
            </div>

            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Showing <strong>{totalEntries > 0 ? indexOfFirstEntry + 1 : 0}</strong> to <strong>{Math.min(indexOfLastEntry, totalEntries)}</strong> of <strong>{totalEntries}</strong> users
            </div>
          </div>

          {/* Responsive Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#334155', fontWeight: 700 }}>
                  <th style={{ padding: '12px 16px', width: '50px' }}>#</th>
                  <th style={{ padding: '12px 16px' }}>Username</th>
                  <th style={{ padding: '12px 16px' }}>Name / Display Title</th>
                  <th style={{ padding: '12px 16px' }}>Role</th>
                  <th style={{ padding: '12px 16px' }}>Primary Branch</th>
                  <th style={{ padding: '12px 16px' }}>Assigned Branches</th>
                  <th style={{ padding: '12px 16px', width: '120px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                      Loading user management records...
                    </td>
                  </tr>
                ) : currentEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                      No user records found matching your query.
                    </td>
                  </tr>
                ) : (
                  currentEntries.map((u, index) => {
                    const sNo = indexOfFirstEntry + index + 1;
                    const hasBranches = Array.isArray(u.branches) && u.branches.length > 0;

                    return (
                      <tr
                        key={u._id || u.username + index}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>
                          {sNo}
                        </td>

                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                          {u.username}
                        </td>

                        <td style={{ padding: '12px 16px', color: '#334155' }}>
                          {u.name || '-'}
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          {formatRoleBadge(u.role)}
                        </td>

                        <td style={{ padding: '12px 16px', color: '#475569', fontWeight: 500 }}>
                          {u.branch || <span style={{ color: '#94a3b8', italic: 'true' }}>ALL Branches</span>}
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          {hasBranches ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '300px' }}>
                              <span style={{
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                borderRadius: '12px',
                                padding: '2px 8px',
                                fontSize: '11px',
                                fontWeight: 600
                              }}>
                                {u.branches.length} Branches Assigned
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>None</span>
                          )}
                        </td>

                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              title="Edit User"
                              onClick={() => handleOpenEditModal(u)}
                              style={{
                                backgroundColor: '#f0f9ff',
                                color: '#0284c7',
                                border: '1px solid #bae6fd',
                                borderRadius: '4px',
                                padding: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              <Edit2 size={14} />
                            </button>

                            <button
                              type="button"
                              title="Delete User"
                              onClick={() => setDeleteModal({ isOpen: true, user: u, loading: false })}
                              style={{
                                backgroundColor: '#fef2f2',
                                color: '#ef4444',
                                border: '1px solid #fecaca',
                                borderRadius: '4px',
                                padding: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                style={{
                  padding: '6px 14px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                  color: currentPage === 1 ? '#94a3b8' : '#334155',
                  fontSize: '13px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>

              <div style={{ display: 'flex', gap: '4px' }}>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, idx) => {
                  const pageNum = idx + 1;
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: isActive ? '1px solid #0284c7' : '1px solid #cbd5e1',
                        backgroundColor: isActive ? '#0284c7' : '#ffffff',
                        color: isActive ? '#ffffff' : '#334155',
                        fontSize: '13px',
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                style={{
                  padding: '6px 14px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                  color: currentPage === totalPages ? '#94a3b8' : '#334155',
                  fontSize: '13px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} /> {editingUser ? 'Edit User Credentials & Roles' : 'Create New User Account'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveUser} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {formError && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  fontSize: '13px'
                }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Username <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. aei.tuni"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Full Name / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ADITYA PUBLIC SCHOOL - TUNI"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Password {editingUser ? <span style={{ fontWeight: 400, color: '#64748b' }}>(Leave blank to keep unchanged)</span> : <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  <input
                    type="password"
                    placeholder={editingUser ? '••••••••' : 'Enter password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Role <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="BRANCH_USER">BRANCH_USER (Individual Branch Access)</option>
                    <option value="BRANCH_ADMIN">BRANCH_ADMIN (Multiple Branches Admin)</option>
                    <option value="ADMIN">ADMIN (Full System Administrator)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Primary Branch
                </label>
                <select
                  value={formData.branch}
                  onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="">-- ALL / Global Access --</option>
                  {availableBranches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Multi-Branch Assignment Checklist */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Assigned Branches Array ({formData.branches.length} selected)
                </label>
                <div style={{
                  maxHeight: '140px',
                  overflowY: 'auto',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc'
                }}>
                  {availableBranches.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Loading branch options...</div>
                  ) : (
                    availableBranches.map(b => {
                      const isChecked = formData.branches.includes(b);
                      return (
                        <label
                          key={b}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '12px',
                            color: '#334155',
                            padding: '4px 0',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleBranchSelection(b)}
                          />
                          {b}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 4px rgba(2,132,199,0.2)'
                  }}
                >
                  {submitting ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '420px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
              Confirm User Deletion
            </h3>
            <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 20px 0' }}>
              Are you sure you want to delete user <strong>{deleteModal.user?.username}</strong>? This operation cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, user: null, loading: false })}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleteModal.loading}
                onClick={handleDeleteConfirm}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: deleteModal.loading ? 'not-allowed' : 'pointer'
                }}
              >
                {deleteModal.loading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default UserManagement;
