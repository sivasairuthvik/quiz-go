import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reportsAPI, dashboardAPI } from '../../utils/api';
import { Card } from '../../components/common';
import './DashboardPage.css';

const StatCard = ({ title, value }) => (
  <div className="dashboard-stat-card">
    <div className="dashboard-stat-value">{value}</div>
    <div className="dashboard-stat-title">{title}</div>
  </div>
);

const DashboardPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        if (user.role === 'student') {
          const res = await reportsAPI.getStudentReport('me');
          if (res.data?.success) setData({ type: 'student', payload: res.data.data });
          else setError(res.data?.error || 'Failed to fetch student report');
        } else if (user.role === 'teacher' || user.role === 'admin') {
          const res = await dashboardAPI.getStats();
          if (res.data?.success) setData({ type: 'teacher', payload: res.data.data });
          else setError(res.data?.error || 'Failed to fetch dashboard stats');
        } else {
          setError('Unknown role');
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [user]);

  if (authLoading) return <p>Loading...</p>;

  return (
    <div className="dashboard-page" style={{ padding: 24 }}>
      <h2>Dashboard</h2>
      <Card>
        {loading && <p>Loading report...</p>}
        {error && <p className="dashboard-error">{error}</p>}

        {!loading && data && data.type === 'teacher' && (
          <div>
            <div className="dashboard-stats-row">
              <StatCard title="Total Users" value={data.payload.totalUsers ?? 0} />
              <StatCard title="Total Quizzes" value={data.payload.totalQuizzes ?? 0} />
              <StatCard title="Total Attempts" value={data.payload.totalAttempts ?? 0} />
            </div>

            <h3 style={{ marginTop: 16 }}>Recent Attempts</h3>
            {Array.isArray(data.payload.recentAttempts) && data.payload.recentAttempts.length > 0 ? (
              <div className="dashboard-attempts-list">
                {data.payload.recentAttempts.map((a) => (
                  <div className="dashboard-attempt" key={a._id}>
                    <div className="attempt-left">
                      <div className="attempt-quiz">{a.quizId?.title || 'Quiz'}</div>
                      <div className="attempt-user">{a.studentId?.name || a.studentId?.email || 'Student'}</div>
                    </div>
                    <div className="attempt-right">
                      <div className="attempt-score">Score: {a.score ?? '—'}/{a.maxScore ?? '—'}</div>
                      <div className="attempt-date">{new Date(a.submittedAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No recent attempts available.</p>
            )}
          </div>
        )}

        {!loading && data && data.type === 'student' && (
          <div>
            <h3>Your Performance</h3>
            <div className="dashboard-stats-row">
              <StatCard title="Total Attempts" value={data.payload.totalAttempts ?? 0} />
              <StatCard title="Average Score (%)" value={Math.round((data.payload.avgScore ?? 0) * 100) / 100} />
              <StatCard title="Total Score" value={`${data.payload.totalScore ?? 0}/${data.payload.totalMaxScore ?? 0}`} />
            </div>

            <h3 style={{ marginTop: 16 }}>Recent Attempts</h3>
            {Array.isArray(data.payload.attempts) && data.payload.attempts.length > 0 ? (
              <div className="dashboard-attempts-list">
                {data.payload.attempts.map((a) => (
                  <div className="dashboard-attempt" key={a._id}>
                    <div className="attempt-left">
                      <div className="attempt-quiz">{a.quizId?.title || 'Quiz'}</div>
                      <div className="attempt-user">Submitted: {new Date(a.submittedAt).toLocaleString()}</div>
                    </div>
                    <div className="attempt-right">
                      <div className="attempt-score">Score: {a.score ?? '—'}/{a.maxScore ?? '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No attempts found.</p>
            )}
          </div>
        )}

        {!loading && !data && !error && <p>No report data available.</p>}
      </Card>
    </div>
  );
};

export default DashboardPage;
