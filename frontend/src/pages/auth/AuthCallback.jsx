import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Loading from '../../components/common/Loading';
import api from '../../utils/api';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      // Support both flows:
      // 1) Backend callback redirects to /auth/callback?token=...&refresh=...&user=...
      // 2) Frontend received ?code=..., then we POST to /api/auth/google/exchange
      const tokenParam = searchParams.get('token');
      const refreshParam = searchParams.get('refresh');
      const userParam = searchParams.get('user');

      if (tokenParam && userParam) {
        try {
          const parsedUser = JSON.parse(decodeURIComponent(userParam));
          await login(tokenParam, parsedUser);
          try { localStorage.setItem('refreshToken', JSON.stringify(refreshParam)); } catch {}
          toast.success(`Welcome, ${parsedUser?.name || 'user'}!`);
          navigate('/dashboard');
          return;
        } catch (e) {
          console.error('Failed to parse user from callback:', e);
          toast.error('Authentication failed. Please try again.');
          navigate('/login');
          return;
        }
      }

      // Fallback: Authorization code exchange flow
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        toast.error(`Authentication failed: ${error}`);
        navigate('/login');
        return;
      }

      if (!code) {
        toast.error('Missing authentication data');
        navigate('/login');
        return;
      }

      try {
        // Exchange code for tokens via backend
  const response = await api.post('/api/auth/google/exchange', { code });

        if (response.data.success) {
          const { user, accessToken, refreshToken } = response.data.data;
          // Update auth context and persist token/user
          await login(accessToken, user);
          try { localStorage.setItem('refreshToken', JSON.stringify(refreshToken)); } catch {}

          toast.success(`Welcome, ${user.name}!`);
          navigate('/dashboard');
        } else {
          toast.error('Authentication failed');
          navigate('/login');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        toast.error('Authentication failed. Please try again.');
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#000000'
    }}>
      <Loading />
    </div>
  );
};

export default AuthCallback;
