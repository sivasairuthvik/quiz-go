import express from 'express';
import Attempt from '../models/Attempt.model.js';
import Quiz from '../models/Quiz.model.js';
import User from '../models/User.model.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// GET /api/reports/student/:id - Student performance report
router.get('/student/:id', authenticate, apiLimiter, async (req, res, next) => {
  try {
    const studentId = req.params.id === 'me' ? req.user._id : req.params.id;

    // Students can only view their own reports
    if (req.user.role === 'student' && studentId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // Teachers/admins can view any student
    if (req.user.role !== 'student' || studentId === req.user._id.toString()) {
      const attempts = await Attempt.find({ studentId, is_submitted: true })
        .populate('quizId', 'title')
        .sort({ submittedAt: -1 });

      const totalAttempts = attempts.length;
      const avgScore = attempts.reduce((sum, a) => sum + (a.score / a.maxScore) * 100, 0) / totalAttempts || 0;
      const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
      const totalMaxScore = attempts.reduce((sum, a) => sum + a.maxScore, 0);

      // Category breakdown
      const categoryBreakdown = {};
      attempts.forEach((attempt) => {
        attempt.answers.forEach((answer) => {
          // This would require topic tags in questions
          const category = 'General'; // Placeholder
          if (!categoryBreakdown[category]) {
            categoryBreakdown[category] = { correct: 0, total: 0 };
          }
          categoryBreakdown[category].total++;
          if (answer.isCorrect) categoryBreakdown[category].correct++;
        });
      });

      res.json({
        success: true,
        data: {
          studentId,
          totalAttempts,
          avgScore: Math.round(avgScore * 100) / 100,
          totalScore,
          totalMaxScore,
          attempts,
          categoryBreakdown,
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/teacher/:id - Teacher analytics
router.get('/teacher/:id', authenticate, authorize('teacher', 'admin'), apiLimiter, async (req, res, next) => {
  try {
    const teacherId = req.params.id === 'me' ? req.user._id : req.params.id;

    const quizzes = await Quiz.find({ creatorId: teacherId });

    const quizIds = quizzes.map((q) => q._id);
    const attempts = await Attempt.find({ quizId: { $in: quizIds }, is_submitted: true })
      .populate('studentId', 'name email')
      .populate('quizId', 'title');

    const quizStats = quizzes.map((quiz) => {
      const quizAttempts = attempts.filter((a) => a.quizId._id.toString() === quiz._id.toString());
      const avgScore = quizAttempts.length > 0
        ? quizAttempts.reduce((sum, a) => sum + (a.score / a.maxScore) * 100, 0) / quizAttempts.length
        : 0;

      return {
        quizId: quiz._id,
        title: quiz.title,
        totalAttempts: quizAttempts.length,
        avgScore: Math.round(avgScore * 100) / 100,
      };
    });

    res.json({
      success: true,
      data: {
        teacherId,
        totalQuizzes: quizzes.length,
        totalAttempts: attempts.length,
        quizStats,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/subject/:subject - Subject-wise report
router.get('/subject/:subject', authenticate, authorize('teacher', 'admin'), apiLimiter, async (req, res, next) => {
  try {
    // This would filter by subject metadata
    res.json({
      success: true,
      data: {
        subject: req.params.subject,
        message: 'Subject report - implement based on metadata',
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

