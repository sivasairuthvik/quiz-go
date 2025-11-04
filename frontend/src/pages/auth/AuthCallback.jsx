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
      // Google OAuth has been disabled. Redirect to login.
      toast.error('OAuth is disabled. Please use email/password login.');
      navigate('/login');
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
