import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './RegisterPage.css';
import PublicNavbar from '../../components/layout/PublicNavbar';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password);
      toast.success('Registration successful! Please log in.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    // Google OAuth has been disabled
    toast.error('Google sign-up is disabled. Please register with email/password.');
  };

  return (
    <>
      <PublicNavbar />
      <section className="register-page" aria-label="Register">
        <div className="register-page__container">
          <Card className="register-card">
            <div className="register-card__header">
              <h2>Create your account</h2>
              <p>Join Quiz Mantra to start creating and taking quizzes.</p>
            </div>

            <div className="register-card__content">
              {/* Google OAuth removed */}

              {/* Email/Password Registration Form */}
              <form onSubmit={handleSubmit} className="register-form">
                <Input
                  label="Full Name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />

                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password (min. 6 characters)"
                  required
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                />

                <Button 
                  type="submit" 
                  size="lg" 
                  fullWidth 
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </Button>
              </form>
            </div>

            <div className="register-card__footer">
              <p>
                Already have an account?{' '}
                <Button variant="link" onClick={() => navigate('/login')}>Log in</Button>
              </p>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
};

export default RegisterPage;
