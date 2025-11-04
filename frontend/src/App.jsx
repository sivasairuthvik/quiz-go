import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { QuizProvider } from './context/QuizContext';
import { Layout } from './components/layout';
import Loading from './components/common/Loading';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Lazy load pages for better performance
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const AdminLoginPage = React.lazy(() => import('./pages/admin/AdminLoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const AuthCallback = React.lazy(() => import('./pages/auth/AuthCallback'));
const HomePage = React.lazy(() => import('./pages/home/HomePage'));
const DashboardPage = React.lazy(() => import('./pages/dashboard/DashboardPage'));
const ProfilePage = React.lazy(() => import('./pages/profile/ProfilePage'));
const QuizzesPage = React.lazy(() => import('./pages/quiz/QuizzesPage'));
const QuizDetailsPage = React.lazy(() => import('./pages/quiz/QuizDetailsPage'));
const CreateQuizPage = React.lazy(() => import('./pages/quiz/CreateQuizPage'));
const TakeQuizPage = React.lazy(() => import('./pages/quiz/TakeQuizPage'));
const SubmissionsPage = React.lazy(() => import('./pages/submission/SubmissionsPage'));
const SubmissionDetailsPage = React.lazy(() => import('./pages/submission/SubmissionDetailsPage'));
const AnalyticsPage = React.lazy(() => import('./pages/analytics/AnalyticsPage'));
const CompetitionsPage = React.lazy(() => import('./pages/competition/CompetitionsPage'));
const AnnouncementsPage = React.lazy(() => import('./pages/announcement/AnnouncementsPage'));
const MessagesPage = React.lazy(() => import('./pages/message/MessagesPage'));
const AdminUsersPage = React.lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminDashboardPage = React.lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminAnalyticsPage = React.lazy(() => import('./pages/admin/AdminAnalyticsPage'));
const AdminSettingsPage = React.lazy(() => import('./pages/admin/AdminSettingsPage'));
const NotFoundPage = React.lazy(() => import('./pages/error/NotFoundPage'));

// Auth success page (lazy)
const AuthSuccessPage = React.lazy(() => import('./pages/auth/AuthSuccessPage'));

// Loading fallback component
const SuspenseFallback = () => <Loading text="Loading page..." fullScreen />;

function App() {
  // App root — router is created below using lazy-loaded pages and suspense
  // build the routes for createBrowserRouter so we can opt-in to future flags
  const SuspenseElement = (Comp) => {
    // Use createElement to avoid JSX parsing edge-cases in HMR
    return React.createElement(
      React.Suspense,
      { fallback: React.createElement(SuspenseFallback) },
      React.createElement(Comp)
    );
  };

  const router = createBrowserRouter(
    [
      // Public routes
      { path: '/', element: SuspenseElement(HomePage) },
      { path: '/login', element: SuspenseElement(LoginPage) },
      { path: '/admin', element: SuspenseElement(AdminLoginPage) },
      { path: '/register', element: SuspenseElement(RegisterPage) },
      { path: '/auth/callback', element: SuspenseElement(AuthCallback) },
      { path: '/auth/success', element: SuspenseElement(AuthSuccessPage) },

      // Protected routes wrapped in Layout
      {
        path: '/',
        element: <Layout />,
        children: [
          { path: 'home', element: <Navigate to="/" replace /> },
          { path: 'dashboard', element: <ProtectedRoute>{SuspenseElement(DashboardPage)}</ProtectedRoute> },
          { path: 'profile', element: <ProtectedRoute>{SuspenseElement(ProfilePage)}</ProtectedRoute> },
          { path: 'profile/:id', element: <ProtectedRoute>{SuspenseElement(ProfilePage)}</ProtectedRoute> },
          { path: 'quizzes', element: <ProtectedRoute>{SuspenseElement(QuizzesPage)}</ProtectedRoute> },
          { path: 'quizzes/create', element: <ProtectedRoute allowedRoles={["teacher", "admin"]}>{SuspenseElement(CreateQuizPage)}</ProtectedRoute> },
          { path: 'quiz/create', element: <Navigate to="/quizzes/create" replace /> },
          { path: 'quizzes/:id', element: <ProtectedRoute>{SuspenseElement(QuizDetailsPage)}</ProtectedRoute> },
          { path: 'quizzes/:id/edit', element: <ProtectedRoute allowedRoles={["teacher", "admin"]}>{SuspenseElement(CreateQuizPage)}</ProtectedRoute> },
          { path: 'quizzes/:id/take', element: <ProtectedRoute allowedRoles={["student"]}>{SuspenseElement(TakeQuizPage)}</ProtectedRoute> },
          { path: 'submissions', element: <ProtectedRoute>{SuspenseElement(SubmissionsPage)}</ProtectedRoute> },
          { path: 'submission/:id', element: <ProtectedRoute>{SuspenseElement(SubmissionDetailsPage)}</ProtectedRoute> },
          { path: 'analytics', element: <ProtectedRoute allowedRoles={["teacher", "admin"]}>{SuspenseElement(AnalyticsPage)}</ProtectedRoute> },
          { path: 'competitions', element: <ProtectedRoute>{SuspenseElement(CompetitionsPage)}</ProtectedRoute> },
          { path: 'announcements', element: <ProtectedRoute allowedRoles={["teacher", "admin"]}>{SuspenseElement(AnnouncementsPage)}</ProtectedRoute> },
          { path: 'messages', element: <ProtectedRoute>{SuspenseElement(MessagesPage)}</ProtectedRoute> },
          { path: 'admin/dashboard', element: <ProtectedRoute allowedRoles={["admin"]}>{SuspenseElement(AdminDashboardPage)}</ProtectedRoute> },
          { path: 'admin/users', element: <ProtectedRoute allowedRoles={["admin"]}>{SuspenseElement(AdminUsersPage)}</ProtectedRoute> },
          { path: 'admin/analytics', element: <ProtectedRoute allowedRoles={["admin"]}>{SuspenseElement(AdminAnalyticsPage)}</ProtectedRoute> },
          { path: 'admin/quizzes', element: <ProtectedRoute allowedRoles={["admin"]}>{SuspenseElement(QuizzesPage)}</ProtectedRoute> },
          { path: 'admin/competitions', element: <ProtectedRoute allowedRoles={["admin"]}>{SuspenseElement(CompetitionsPage)}</ProtectedRoute> },
          { path: 'admin/announcements', element: <ProtectedRoute allowedRoles={["admin"]}>{SuspenseElement(AnnouncementsPage)}</ProtectedRoute> },
          { path: 'admin/messages', element: <ProtectedRoute allowedRoles={["admin"]}>{SuspenseElement(MessagesPage)}</ProtectedRoute> },
          { path: 'admin/settings', element: <ProtectedRoute allowedRoles={["admin"]}>{SuspenseElement(AdminSettingsPage)}</ProtectedRoute> },
          // 404 within protected area
          { path: '*', element: SuspenseElement(NotFoundPage) },
        ],
      },
    ],
    // Opt-in to v7 future flags to avoid warnings & align with upcoming router behavior
    { future: { v7_startTransition: true, v7_relativeSplatPath: true } }
  );

  return (
    <AuthProvider>
      <QuizProvider>
        <div className="App">
            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  style: {
                    background: '#10b981',
                  }
                },
                error: {
                  duration: 5000,
                  style: {
                    background: '#ef4444',
                  }
                }
              }}
            />
            {/* RouterProvider will render routes & children. Using RouterProvider lets us pass future flags during creation. */}
            <RouterProvider router={router} />
          </div>
      </QuizProvider>
    </AuthProvider>
  );
}

export default App;
