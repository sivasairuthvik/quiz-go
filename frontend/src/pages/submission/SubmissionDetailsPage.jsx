import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { submissionAPI } from '../../utils/api';
import { Card } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const SubmissionDetailsPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await submissionAPI.getSubmission(id);
        setAttempt(res.data.data);
      } catch (err) {
        console.error('Failed to load submission', err);
        setError(err.response?.data?.error || 'Failed to load submission');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const refresh = async () => {
    try {
      const res = await submissionAPI.getSubmission(id);
      setAttempt(res.data.data);
    } catch (err) {
      console.error('Failed to refresh submission', err);
    }
  };

  const handleRequestRevaluation = async () => {
    if (!attempt) return;
    const defaultReason = 'Please review my answers';
    const reason = window.prompt('Enter reason for re-evaluation (optional):', defaultReason);
    if (reason === null) return; // user cancelled
    try {
      setLoading(true);
      await submissionAPI.requestRevaluation(id, reason || defaultReason);
      toast.success('Revaluation requested');
      await refresh();
    } catch (err) {
      console.error('Request revaluation failed', err);
      toast.error('Failed to request revaluation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submission-details-page" style={{ padding: 24 }}>
      <h1>Submission Details</h1>
      <Card>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && attempt && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div><strong>Quiz:</strong> {attempt.quizId?.title || 'Quiz'}</div>
            <div><strong>Student:</strong> {attempt.studentId?.name || attempt.studentId?.email}</div>
            <div><strong>Score:</strong> {attempt.score} / {attempt.maxScore}</div>
            <div><strong>Submitted At:</strong> {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : '—'}</div>

            {/* Student: request revaluation if submitted and no pending request */}
            {user && user.role === 'student' && attempt.is_submitted && (
              (() => {
                const hasPending = Array.isArray(attempt.revaluationRequests) && attempt.revaluationRequests.some(r => r.status === 'pending');
                return (
                  <div>
                    {!hasPending ? (
                      <button className="btn btn-primary" onClick={handleRequestRevaluation} disabled={loading}>Request Re-evaluation</button>
                    ) : (
                      <div style={{ color: '#f59e0b' }}>Re-evaluation request pending</div>
                    )}
                  </div>
                );
              })()
            )}

            <h3>Answers</h3>
            {Array.isArray(attempt.answers) && attempt.answers.length > 0 ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {attempt.answers.map((ans, idx) => (
                  <div key={idx} style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                    <div><strong>Question ID:</strong> {ans.questionId}</div>
                    <div><strong>Selected Index:</strong> {ans.selectedIndex}</div>
                    <div><strong>Time Taken (s):</strong> {ans.timeTakenSeconds ?? 0}</div>
                    <div><strong>Correct:</strong> {attempt.answerResults && attempt.answerResults.find(r => r.questionId === (ans.questionId.toString ? ans.questionId.toString() : ans.questionId))?.isCorrect ? 'Yes' : 'No'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No answers recorded.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SubmissionDetailsPage;