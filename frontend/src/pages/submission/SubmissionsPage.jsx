import React, { useEffect, useState } from 'react';
import { submissionAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common';
import { Link } from 'react-router-dom';

const SubmissionsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Teachers/admins can see all attempts; students will only see their own per backend.
        const res = await submissionAPI.getSubmissions({ limit: 200 });
        setAttempts(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch attempts', err);
        setError(err.response?.data?.error || 'Failed to load attempts');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <div className="submissions-page" style={{ padding: 24 }}>
      <h1>Submissions</h1>
      <Card>
        {loading && <p>Loading submissions...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && !attempts.length && <p>No submissions found.</p>}

        {!loading && attempts.length > 0 && (
          <div style={{ display: 'grid', gap: 12 }}>
            {attempts.map((a) => (
              <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{a.quizId?.title || 'Quiz'}</div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>{a.studentId?.name || a.studentId?.email || 'Student'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>Score: {a.score ?? '—'} / {a.maxScore ?? '—'}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{a.submittedAt ? new Date(a.submittedAt).toLocaleString() : (a.is_submitted ? 'Submitted' : 'In progress')}</div>
                  <div style={{ marginTop: 8 }}>
                    <Link to={`/submission/${a._id}`} className="export-btn" style={{ padding: '6px 10px' }}>View</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SubmissionsPage;