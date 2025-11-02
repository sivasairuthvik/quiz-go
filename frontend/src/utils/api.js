import axios from 'axios';
import toast from 'react-hot-toast';
import { storage, parseJSONSafe, normalizeToken } from './helpers';

// In production (Vercel), API is on same domain via routing
// In development, use localhost:3000
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' ? '' : 'http://localhost:3000');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Read token via helpers to avoid JSON string quotes
    let token = null;
    try {
      const raw = localStorage.getItem('token');
      token = normalizeToken(parseJSONSafe(raw));
    } catch (err) {
      token = null;
    }

    if (typeof token === 'string' && token.trim()) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (response?.status === 403) {
      toast.error('Access denied. You do not have permission for this action.');
    } else if (response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (response?.data?.message) {
      toast.error(response.data.message);
    } else if (error.code === 'NETWORK_ERROR') {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  // Auth routes are under /api/auth, user profile is under /api/users
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  refresh: (refreshToken) => api.post('/api/auth/refresh', { refreshToken }),
  getMe: () => api.get('/api/users/me'),
  updateProfile: (data) => api.put('/api/users/me', data),
  logout: () => api.post('/api/auth/logout'),
  deleteAccount: () => api.delete('/api/users/me'),
  getAllUsers: (params) => api.get('/api/users', { params }),
  getUserById: (id) => api.get(`/api/users/${id}`),
  changeUserRole: (userId, role) => api.put(`/api/users/${userId}/role`, { role }),
};

// Quiz API calls
export const quizAPI = {
  // Main quiz resource (backend mounts routes at /api/quizzes)
  getQuizzes: (params) => api.get('/api/quizzes', { params }),
  getQuiz: (id) => api.get(`/api/quizzes/${id}`),
  createQuiz: (data) => api.post('/api/quizzes', data),
  updateQuiz: (id, data) => api.put(`/api/quizzes/${id}`, data),
  deleteQuiz: (id) => api.delete(`/api/quizzes/${id}`),
  // PDF upload endpoint
  uploadPDF: (formData) => api.post('/api/quizzes/upload-pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  assignQuiz: (id, studentIds) => api.post(`/api/quizzes/${id}/assign`, { studentIds }),

  // AI Study Buddy - generate questions from text/topics
  generateQuestions: (payload) => api.post('/api/ai-study-buddy/generate', payload),

  // Attempts/submissions are handled under /api/attempts
  // Start an attempt by quizId
  startAttempt: (quizId) => api.post('/api/attempts/start', { quizId }),
  // Submit an attempt: if first param looks like an attempt id, submit directly; otherwise try to start then submit
  submitAttempt: async (quizOrAttemptId, data) => {
    // If data.attemptId provided, use it
    if (data && data.attemptId) {
      return api.post(`/api/attempts/${data.attemptId}/submit`, data);
    }

    // Heuristic: if quizOrAttemptId is 24-char hex, assume it's an attempt id
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(quizOrAttemptId);
    if (isObjectId) {
      return api.post(`/api/attempts/${quizOrAttemptId}/submit`, data);
    }

    // Otherwise treat as quizId: start attempt then submit
  const startRes = await api.post('/api/attempts/start', { quizId: quizOrAttemptId });
  let attemptId = startRes.data?.data?.attempt?._id || startRes.data?.data?.attempt?.id || startRes.data?.data?.attempts?._id;
    if (!attemptId && startRes.data?.data?._id) {
      // some responses may return attempt directly
      attemptId = startRes.data.data._id;
    }
    if (!attemptId) {
      // fallback: return start response
      return startRes;
    }

    return api.post(`/api/attempts/${attemptId}/submit`, data);
  },

  generateAIFeedback: (submissionId) => api.post(`/api/quizzes/submission/${submissionId}/feedback`),
};

// Submission API calls
export const submissionAPI = {
  // Map submission operations to attempts endpoints
  getSubmissions: (params) => api.get('/api/attempts', { params }),
  getSubmission: (id) => api.get(`/api/attempts/${id}`),
  evaluateSubmission: (id, data) => api.put(`/api/attempts/${id}/evaluate`, data),
  requestRevaluation: (id, reason) => api.post(`/api/attempts/${id}/reval`, { reason }),
  handleRevaluation: (id, data) => api.put(`/api/attempts/${id}/reval`, data),
  getSubmissionStats: () => api.get('/api/attempts/stats'),
};

// Reports API calls
export const reportsAPI = {
  getStudentReport: (studentId = 'me', params) => api.get(`/api/reports/student/${studentId}`, { params }),
  getQuizReport: (quizId) => api.get(`/api/reports/quiz/${quizId}`),
  // Backend expects /api/reports/teacher/:id where :id can be 'me'
  getTeacherReport: (teacherId = 'me') => api.get(`/api/reports/teacher/${teacherId}`),
  // Admin report endpoint not implemented server-side; keep placeholder to avoid frontend crashes
  getAdminReport: () => api.get('/api/reports/admin').catch(() => ({ data: { success: false, error: 'Not implemented on server' } })),
};

// Practice API calls
export const practiceAPI = {
  generatePracticeQuiz: (data) => api.post('/api/practice', data),
  getPerformanceAnalysis: () => api.get('/api/practice/analysis'),
  getPracticeRecommendations: () => api.get('/api/practice/recommendations'),
};

// Messages API calls
export const messagesAPI = {
  getMessages: (params) => api.get('/api/messages', { params }),
  getMessage: (id) => api.get(`/api/messages/${id}`),
  sendMessage: (data) => api.post('/api/messages', data),
  getConversation: (userId, params) => api.get(`/api/messages/conversation/${userId}`, { params }),
  markAsRead: (id) => api.put(`/api/messages/${id}/read`),
  deleteMessage: (id) => api.delete(`/api/messages/${id}`),
  getMessageStats: () => api.get('/api/messages/stats'),
};

// Announcements API calls
export const announcementsAPI = {
  getAnnouncements: (params) => api.get('/api/announcements', { params }),
  getAnnouncement: (id) => api.get(`/api/announcements/${id}`),
  createAnnouncement: (data) => api.post('/api/announcements', data),
  updateAnnouncement: (id, data) => api.put(`/api/announcements/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/api/announcements/${id}`),
  getAnnouncementStats: () => api.get('/api/announcements/admin/stats'),
};

// Competitions API calls
export const competitionsAPI = {
  getCompetitions: (params) => api.get('/api/competitions', { params }),
  getCompetition: (id) => api.get(`/api/competitions/${id}`),
  createCompetition: (data) => api.post('/api/competitions', data),
  updateCompetition: (id, data) => api.put(`/api/competitions/${id}`, data),
  deleteCompetition: (id) => api.delete(`/api/competitions/${id}`),
  registerForCompetition: (id) => api.post(`/api/competitions/${id}/register`),
  submitCompetitionEntry: (id, submissionId) => api.post(`/api/competitions/${id}/submit`, { submissionId }),
  getLeaderboard: (id) => api.get(`/api/competitions/${id}/leaderboard`),
  getCompetitionStats: () => api.get('/api/competitions/stats'),
};

// Settings API
export const settingsAPI = {
  getSettings: () => api.get('/api/settings'),
  updateSettings: (data) => api.put('/api/settings', data),
  uploadLogo: (formData) => api.post('/api/settings/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/api/dashboard/stats'),
};

// Public API calls
export const publicAPI = {
  contact: (payload) => api.post('/api/public/contact', payload),
};

export default api;