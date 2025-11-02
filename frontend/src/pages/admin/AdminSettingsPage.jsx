import React, { useEffect, useState, useRef } from 'react';
import { settingsAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './AdminSettingsPage.css';

const AdminSettingsPage = () => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({});
  const fileRef = useRef();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await settingsAPI.getSettings();
        setSettings(res.data.data);
        setForm({
          appName: res.data.data.appName || '',
          emailNotifications: !!res.data.data.emailNotifications,
          chatbotEnabled: !!res.data.data.chatbotEnabled,
          theme: res.data.data.theme || 'light',
          quizDefaults: res.data.data.quizDefaults || { difficulty: 'medium', numberOfQuestions: 10 },
        });
      } catch (err) {
        console.error('Failed to load settings', err);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('quizDefaults.')) {
      const key = name.split('.')[1];
      setForm((f) => ({ ...f, quizDefaults: { ...f.quizDefaults, [key]: type === 'number' ? parseInt(value || 0) : value } }));
    } else if (type === 'checkbox') {
      setForm((f) => ({ ...f, [name]: checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = {
        appName: form.appName,
        emailNotifications: !!form.emailNotifications,
        chatbotEnabled: !!form.chatbotEnabled,
        theme: form.theme,
        quizDefaults: form.quizDefaults,
      };
      const res = await settingsAPI.updateSettings(payload);
      setSettings(res.data.data);
      toast.success('Settings saved');
    } catch (err) {
      console.error('Save settings error', err);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    try {
      setLoading(true);
      const res = await settingsAPI.uploadLogo(formData);
      setSettings(res.data.data);
      toast.success('Logo uploaded');
      fileRef.current.value = '';
    } catch (err) {
      console.error('Logo upload failed', err);
      toast.error('Logo upload failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="admin-settings-page">
        <h1>System Settings</h1>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="admin-settings-page">
      <div className="settings-header">
        <h1>System Settings</h1>
        <div className="settings-actions">
          <button className="btn btn-ghost" onClick={() => window.location.reload()}>Refresh</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>Save</button>
        </div>
      </div>

      <div className="settings-grid">
        <section className="settings-card">
          <h3>General</h3>
          <label className="form-row">
            <span>Application Name</span>
            <input name="appName" value={form.appName || ''} onChange={handleChange} />
          </label>
          <label className="form-row">
            <span>Theme</span>
            <select name="theme" value={form.theme || 'light'} onChange={handleChange}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="form-row checkbox-row">
            <span>Email Notifications</span>
            <input type="checkbox" name="emailNotifications" checked={!!form.emailNotifications} onChange={handleChange} />
          </label>
          <label className="form-row checkbox-row">
            <span>Chatbot Enabled</span>
            <input type="checkbox" name="chatbotEnabled" checked={!!form.chatbotEnabled} onChange={handleChange} />
          </label>
        </section>

        <section className="settings-card">
          <h3>Quiz Defaults</h3>
          <label className="form-row">
            <span>Default Difficulty</span>
            <select name="quizDefaults.difficulty" value={(form.quizDefaults && form.quizDefaults.difficulty) || 'medium'} onChange={handleChange}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <label className="form-row">
            <span>Number of Questions</span>
            <input name="quizDefaults.numberOfQuestions" type="number" min="1" max="200" value={(form.quizDefaults && form.quizDefaults.numberOfQuestions) || 10} onChange={handleChange} />
          </label>
        </section>

        <section className="settings-card">
          <h3>Branding</h3>
          <div className="logo-preview">
            {settings?.logoUrl ? (
              // If logoUrl is absolute, use it directly; otherwise construct from VITE_API_URL
              <img src={settings.logoUrl.startsWith('http') ? settings.logoUrl : `${import.meta.env.VITE_API_URL}${settings.logoUrl}`} alt="Logo" />
            ) : (
              <div className="logo-placeholder">No logo</div>
            )}
          </div>
          <label className="form-row">
            <span>Upload Logo</span>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} />
          </label>
        </section>
      </div>
    </div>
  );
};

export default AdminSettingsPage;