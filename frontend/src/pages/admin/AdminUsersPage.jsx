import React, { useEffect, useState } from 'react';
import md5 from 'blueimp-md5';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../utils/api';
import './AdminDashboardPage.css';

const AdminUsersPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await authAPI.getAllUsers({ limit: 500 });
        setUsers(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'admin') fetchUsers();
  }, [user]);

  const filteredUsers = roleFilter === 'all' ? users : users.filter(u => u.role === roleFilter);

  const exportFilteredCSV = (userList) => {
    if (!userList.length) return;
    const header = ['id', 'name', 'email', 'role', 'profileUrl'];
    const rows = userList.map(u => [u._id, u.name, u.email, u.role, `/profile/${u._id}`]);
    const csv = [header.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!user || user.role !== 'admin') {
    return <div className="admin-users-page"><h2>Access Denied</h2><p>You must be an admin to view this page.</p></div>;
  }

  return (
    <div className="admin-users-page">
      <h1>User Management</h1>
      {loading ? <p>Loading users...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : (
        <>
          <div style={{ margin: '1rem 0', display: 'flex', gap: 12 }}>
            <button className={`export-btn${roleFilter === 'all' ? ' active-chip' : ''}`} style={{ background: '#64748b' }} onClick={() => setRoleFilter('all')}>All</button>
            <button className={`export-btn${roleFilter === 'admin' ? ' active-chip' : ''}`} style={{ background: '#6366f1' }} onClick={() => setRoleFilter('admin')}>Admins</button>
            <button className={`export-btn${roleFilter === 'teacher' ? ' active-chip' : ''}`} style={{ background: '#10b981' }} onClick={() => setRoleFilter('teacher')}>Teachers</button>
            <button className={`export-btn${roleFilter === 'student' ? ' active-chip' : ''}`} style={{ background: '#f59e42' }} onClick={() => setRoleFilter('student')}>Students</button>
            <button className="export-btn" style={{ background: '#059669' }} onClick={() => exportFilteredCSV(filteredUsers)}>Export Filtered to CSV</button>
          </div>

          <table className="users-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Bio</th>
                <th>Institution</th>
                <th>Mobile Number</th>
                <th>Profile</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => {
                const gravatarUrl = u.email ? `https://www.gravatar.com/avatar/${md5(u.email.trim().toLowerCase())}?d=identicon` : '/default-avatar.png';
                const avatarSrc = u.profilePicture && u.profilePicture.length > 5 ? u.profilePicture : gravatarUrl;
                return (
                  <tr key={u._id}>
                    <td>
                      <img src={(avatarSrc.startsWith('http') || avatarSrc.startsWith('data:')) ? avatarSrc : `${import.meta.env.VITE_API_URL}${avatarSrc}`} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', background: 'var(--surface-muted-bg)', border: '1px solid var(--surface-border)' }} />
                    </td>
                    <td>{u.name}</td>
                    <td>{u.role}</td>
                    <td>{u.email}</td>
                    <td>{u.profile?.bio || '-'}</td>
                    <td>{u.profile?.institution || '-'}</td>
                    <td>{u.mobileNumber || '-'}</td>
                    <td><a href={`/profile/${u._id}`}>Profile</a></td>
                    <td><a href={`/profile/${u._id}`} className="export-btn" style={{ background: '#6366f1', padding: '2px 10px', fontSize: '0.95rem' }}>View</a></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default AdminUsersPage;