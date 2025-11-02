
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../utils/api';
import './AdminDashboardPage.css';


const AdminDashboardPage = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]); // keep for overview & messaging
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageContent, setMessageContent] = useState('');
  const [messageRecipient, setMessageRecipient] = useState('');
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await authAPI.getAllUsers({ limit: 100 });
        setUsers(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };
    const fetchMessages = async () => {
      try {
        const res = await authAPI.getMessages({ limit: 5 });
        setMessages(res.data.data || []);
      } catch {}
    };
    const fetchStats = async () => {
      try {
        const res = await authAPI.getMessageStats();
        setStats(res.data.data);
      } catch {}
    };
    if (user?.role === 'admin') {
      fetchUsers();
      fetchMessages();
      fetchStats();
    }
  }, [token, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageContent || !messageRecipient) return;
    setSending(true);
    try {
      await authAPI.sendMessage({
        recipient: messageRecipient,
        subject: 'Admin Message',
        content: messageContent,
        type: 'general',
      });
      setMessageContent('');
      setMessageRecipient('');
      // Refresh messages
      const res = await authAPI.getMessages({ limit: 5 });
      setMessages(res.data.data || []);
    } catch {}
    setSending(false);
  };

  // Note: users table & role filters moved to Admin Users page.

  if (!user || user.role !== 'admin') {
    return <div className="admin-dashboard"><h2>Access Denied</h2><p>You must be an admin to view this page.</p></div>;
  }

  return (
    <div className="admin-dashboard">
      <h2>Admin Control Center</h2>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* User Stats */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <h3>User Overview</h3>
          <p>Total Users: {users.length}</p>
          <p>Admins: {users.filter(u => u.role === 'admin').length}</p>
          <p>Teachers: {users.filter(u => u.role === 'teacher').length}</p>
          <p>Students: {users.filter(u => u.role === 'student').length}</p>
        </div>

        {/* Analytics */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <h3>System Analytics</h3>
          {stats ? (
            <ul>
              <li>Messages Sent: {stats.sent}</li>
              <li>Messages Received: {stats.received}</li>
              <li>Unread Messages: {stats.unread}</li>
              <li>Message Types: {Object.entries(stats.typeBreakdown).map(([type, count]) => `${type}: ${count}`).join(', ')}</li>
            </ul>
          ) : <p>Loading analytics...</p>}
          <a href="/admin/analytics" className="export-btn" style={{ background: '#6366f1' }}>View Analytics</a>
        </div>

        {/* Messaging */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <h3>Quick Messaging</h3>
          <form onSubmit={handleSendMessage} style={{ marginBottom: '1rem' }}>
            <select value={messageRecipient} onChange={e => setMessageRecipient(e.target.value)} required style={{ width: '100%', marginBottom: 8 }}>
              <option value="">Select recipient...</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.email}) [{u.role}]</option>
              ))}
            </select>
            <textarea value={messageContent} onChange={e => setMessageContent(e.target.value)} required placeholder="Type your message..." style={{ width: '100%', minHeight: 60, marginBottom: 8 }} />
            <button type="submit" className="export-btn" disabled={sending}>Send Message</button>
          </form>
          <h4>Recent Messages</h4>
          <ul style={{ maxHeight: 120, overflowY: 'auto', padding: 0 }}>
            {messages.length === 0 ? <li>No recent messages.</li> : messages.map(m => (
              <li key={m._id} style={{ marginBottom: 4 }}>
                <strong>{m.subject}</strong>: {m.content.slice(0, 60)}... <span style={{ color: '#888' }}>to {m.recipient?.name || 'Unknown'}</span>
              </li>
            ))}
          </ul>
          <a href="/admin/messages" className="export-btn" style={{ background: '#f59e42' }}>View All Messages</a>
        </div>

        {/* Settings */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <h3>System Settings</h3>
          <a href="/admin/settings" className="export-btn" style={{ background: '#10b981' }}>Go to Settings</a>
        </div>
      </div>

      {/* Note: User management table moved to the Users tab.
          Use the Users page to view, filter and export users. */}
    </div>
  );
};

export default AdminDashboardPage;
