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

export default router;

