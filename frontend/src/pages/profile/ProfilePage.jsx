import React, { useState, useContext, useEffect } from 'react';
import md5 from 'blueimp-md5';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import styles from './ProfilePage.module.css';
import AuthContext from '../../context/AuthContext';
import { useParams } from 'react-router-dom';
import { authAPI } from '../../utils/api';

const ProfilePage = () => {
  const { user, updateUser, deleteAccount, logout, isAdmin, isTeacher, isStudent } = useContext(AuthContext);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.profile?.bio || '',
    institution: user?.profile?.institution || '',
    grade: user?.profile?.grade || '',
    location: user?.profile?.location || '',
    mobileNumber: user?.mobileNumber || '',
    subjects: user?.preferences?.subjects?.join(', ') || '',
    difficulty: user?.preferences?.difficulty || '',
    notifications: user?.preferences?.notifications?.email || false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { id } = useParams();
  const [displayUser, setDisplayUser] = useState(user);
  const [loadingUser, setLoadingUser] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (id && user && id !== user._id) {
        try {
          setLoadingUser(true);
          const res = await authAPI.getUserById(id);
          if (!mounted) return;
          setDisplayUser(res.data.data);
        } catch (err) {
          console.error('Failed to load user', err);
          setDisplayUser(null);
        } finally {
          setLoadingUser(false);
        }
      } else {
        setDisplayUser(user);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id, user]);

  if (loadingUser) return <div className={styles.loading}>Loading profile...</div>;
  if (!displayUser) return <div className={styles.loading}>User not found</div>;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEdit = () => {
    setEditMode(true);
    setSuccess('');
    setError('');
  };

  const handleCancel = () => {
    setEditMode(false);
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.profile?.bio || '',
      institution: user?.profile?.institution || '',
      grade: user?.profile?.grade || '',
      location: user?.profile?.location || '',
      mobileNumber: user?.mobileNumber || '',
      subjects: user?.preferences?.subjects?.join(', ') || '',
      difficulty: user?.preferences?.difficulty || '',
      notifications: user?.preferences?.notifications?.email || false,
    });
    setError('');
    setSuccess('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    // Prepare update payload
    const payload = {
      name: form.name,
      profile: {
        bio: form.bio,
        institution: form.institution,
        grade: form.grade,
        location: form.location,
      },
      mobileNumber: form.mobileNumber,
      preferences: {
        subjects: form.subjects.split(',').map(s => s.trim()).filter(Boolean),
        difficulty: form.difficulty,
        notifications: { email: form.notifications },
      },
    };
    const result = await updateUser(payload);
    setLoading(false);
    if (result.success) {
      setSuccess('Profile updated successfully!');
      setEditMode(false);
    } else {
      setError(result.error || 'Failed to update profile');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    setLoading(true);
    setError('');
    setSuccess('');
    const result = await deleteAccount();
    setLoading(false);
    if (result.success) {
      setSuccess('Account deleted. Logging out...');
      setTimeout(() => logout(), 1500);
    } else {
      setError(result.error || 'Failed to delete account');
    }
  };

  return (
    <div className={styles.profilePage}>
      <h2>Profile</h2>
      <Card className={styles.profileCard}>
        <div className={styles.profileInfo}>
              {/* Use Gravatar as fallback if profilePicture is missing */}
              <img
                src={
                  displayUser.profilePicture && displayUser.profilePicture.length > 5
                    ? (displayUser.profilePicture.startsWith('http') || displayUser.profilePicture.startsWith('data:') ? displayUser.profilePicture : `${import.meta.env.VITE_API_URL}${displayUser.profilePicture}`)
                    : (displayUser.email ? `https://www.gravatar.com/avatar/${md5(displayUser.email.trim().toLowerCase())}?d=identicon` : '/default-avatar.png')
                }
                alt="avatar"
                className="profile-avatar"
              />
          <div>
            <h3>{displayUser.name}</h3>
            <p className={styles.role}>{displayUser.role}</p>
            <p>{displayUser.email}</p>
          </div>
        </div>
        {success && <div className={styles.success}>{success}</div>}
        {error && <div className={styles.error}>{error}</div>}
        {editMode ? (
          <form className={styles.profileForm} onSubmit={handleSave}>
            <label>Name:<input name="name" value={form.name} onChange={handleChange} required /></label>
            <label>Email:<input name="email" value={form.email} disabled /></label>
            <label>Bio:<textarea name="bio" value={form.bio} onChange={handleChange} /></label>
            <label>Institution:<input name="institution" value={form.institution} onChange={handleChange} /></label>
            <label>Grade:<input name="grade" value={form.grade} onChange={handleChange} /></label>
            <label>Location:<input name="location" value={form.location} onChange={handleChange} /></label>
            <label>Mobile Number:<input name="mobileNumber" value={form.mobileNumber} onChange={handleChange} placeholder="Mobile Number" /></label>
            <label>Subjects:<input name="subjects" value={form.subjects} onChange={handleChange} placeholder="Comma separated" /></label>
            <label>Difficulty:
              <select name="difficulty" value={form.difficulty} onChange={handleChange}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <label>
              Email Notifications:
              <input type="checkbox" name="notifications" checked={form.notifications} onChange={handleChange} />
            </label>
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" disabled={loading}>Save</Button>
              <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
            </div>
          </form>
        ) : (
          <div className={styles.profileDetails}>
            <p><strong>Bio:</strong> {displayUser.profile?.bio || '-'}</p>
            <p><strong>Institution:</strong> {displayUser.profile?.institution || '-'}</p>
            <p><strong>Grade:</strong> {displayUser.profile?.grade || '-'}</p>
            <p><strong>Location:</strong> {displayUser.profile?.location || '-'}</p>
            <p><strong>Mobile Number:</strong> {displayUser.mobileNumber || '-'}</p>
            <p><strong>Subjects:</strong> {displayUser.preferences?.subjects?.join(', ') || '-'}</p>
            <p><strong>Difficulty:</strong> {displayUser.preferences?.difficulty || '-'}</p>
            <p><strong>Email Notifications:</strong> {displayUser.preferences?.notifications?.email ? 'Enabled' : 'Disabled'}</p>
            <div className={styles.formActions}>
              {/* Only allow editing/deleting if viewing own profile */}
              {displayUser._id === user?._id ? (
                <>
                  <Button variant="primary" onClick={handleEdit}>Edit Profile</Button>
                  <Button variant="outline" onClick={handleDelete} className={styles.deleteBtn}>Delete Account</Button>
                </>
              ) : (
                <Button variant="ghost">Back</Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProfilePage;