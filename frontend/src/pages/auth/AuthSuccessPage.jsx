import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { parseJSONSafe } from '../../utils/helpers';

const AuthSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userStr = params.get('user');
    let user = null;
    try {
      user = userStr ? parseJSONSafe(decodeURIComponent(userStr)) : null;
    } catch {
      user = null;
    }

    const doLogin = async () => {
      if (!token || !user) {
        navigate('/login', { replace: true });
        return;
      }

      const res = await login(token, user);
      const finalUser = res?.user || user;
      if (finalUser?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    };

    doLogin();
  }, [location, login, navigate]);

  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h2>Authenticating...</h2>
      <p>Please wait while we log you in.</p>
    </div>
  );
};

export default AuthSuccessPage;
