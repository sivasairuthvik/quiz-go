
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Button, Card } from '../../components/common';

import PublicNavbar from '../../components/layout/PublicNavbar';
import './LoginPage.css';

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, login, loginWithCredentials } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Local email/password login
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await loginWithCredentials(form.email, form.password);
      if (res?.success) {
        navigate(from, { replace: true });
      } else {
        toast.error(res.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login submit error:', err);
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo logins removed for production — use real accounts to sign in

  if (isAuthenticated) return null;

  return (
    <>
      <PublicNavbar />
      <div className="login-page">
        <div className="login-page__background">
          <div className="login-page__pattern"></div>
        </div>
        <div className="login-page__container">
          <div className="login-page__content">
            <div className="login-page__header">
              <div className="login-page__logo">
                <h1>Quiz Mantra</h1>
                <p>AI-Powered Quiz Management System</p>
              </div>
            </div>
            <Card className="login-page__card">
              <div className="login-card">
                <div className="login-card__header">
                  <h2>Welcome Back</h2>
                  <p>Sign in to access your quiz dashboard</p>
                </div>
                <form className="login-card__content" onSubmit={handleSubmit}>
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />

                  <label htmlFor="password">Password</label>
                  <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />

                  <Button type="submit" loading={isLoading} size="lg" fullWidth className="login-card__submit-btn">Sign in</Button>

                  {/* Demo buttons removed */}
                </form>
                <div className="login-card__footer">
                  <p>
                    By signing in, you agree to our{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>{' '}and{' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;

