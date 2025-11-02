import express from 'express';
import User from '../models/User.model.js';
import Quiz from '../models/Quiz.model.js';
import Attempt from '../models/Attempt.model.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// GET /api/dashboard/stats - Admin/Teacher dashboard stats
router.get('/stats', authenticate, apiLimiter, async (req, res, next) => {
  try {
    // Only teachers and admins should access teacher-level stats
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const [totalUsers, totalQuizzes, totalAttempts] = await Promise.all([
      User.countDocuments(),
      Quiz.countDocuments(),
      Attempt.countDocuments({ is_submitted: true }),
    ]);

    const recentAttempts = await Attempt.find({ is_submitted: true })
      .sort({ submittedAt: -1 })
      .limit(5)
      .populate('studentId', 'name email')
      .populate('quizId', 'title');

    res.json({
      success: true,
      data: {
        totalUsers,
        totalQuizzes,
        totalAttempts,
        recentAttempts,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
