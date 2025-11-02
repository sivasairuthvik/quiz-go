import express from 'express';
import User from '../models/User.model.js';
import '../models/Class.model.js'; // Ensure Class model is registered
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// GET /api/users - List users (admin only)
router.get('/', authenticate, authorize('admin'), apiLimiter, async (req, res, next) => {
  try {
    const { limit = 100, page = 1, role, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }

    const perPage = Math.min(parseInt(limit, 10) || 100, 1000);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * perPage;

    const [users, total] = await Promise.all([
      User.find(query).select('-refreshToken -__v -password').skip(skip).limit(perPage).lean(),
      User.countDocuments(query),
    ]);

    res.json({ success: true, data: users, total, page: parseInt(page, 10), perPage });
  } catch (error) {
    next(error);
  }
});

// POST /api/users - Create a new user (admin only)
router.post('/', authenticate, authorize('admin'), apiLimiter, async (req, res, next) => {
  try {
    const { name, email, role = 'student', password } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required' });
    }

    // Validate role
    const allowedRoles = ['student', 'teacher', 'admin'];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    // Check existing user
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already in use' });
    }

    // Optional temp password generation if not provided
    let tempPassword = null;
    let toSetPassword = password;
    if (!toSetPassword) {
      // Generate a random 10-char temp password with letters and numbers
      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';
      tempPassword = Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
      toSetPassword = tempPassword;
    }

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role,
      password: toSetPassword,
      provider: 'local',
      emailVerified: true, // since admin created
    });

    await user.save();

    const safe = await User.findById(user._id).select('-password -refreshToken -__v').lean();

    res.status(201).json({ success: true, data: safe, tempPassword });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/me - Get current user profile
router.get('/me', authenticate, apiLimiter, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-refreshToken -__v')
      .populate('classes')
      .lean(); // Use lean() to avoid schema issues

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id - Get user by ID (admin only)
router.get('/:id', authenticate, authorize('admin'), apiLimiter, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-refreshToken -__v')
      .populate('classes')
      .lean(); // Use lean() to avoid schema issues

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id/role - Update a user's role (admin only)
router.put('/:id/role', authenticate, authorize('admin'), apiLimiter, async (req, res, next) => {
  try {
    const { role } = req.body || {};
    const allowedRoles = ['student', 'teacher', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password -refreshToken -__v');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

export default router;

