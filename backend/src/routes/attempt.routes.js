import express from 'express';
import crypto from 'crypto';
import Attempt from '../models/Attempt.model.js';
import Quiz from '../models/Quiz.model.js';
import Question from '../models/Question.model.js';
import AIFeedback from '../models/AIFeedback.model.js';
import Notification from '../models/Notification.model.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import geminiService from '../services/gemini.service.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// GET /api/attempts - List attempts for current user (or filtered by quizId/studentId)
router.get('/', authenticate, apiLimiter, async (req, res, next) => {
  try {
    const { quizId, studentId, limit = 50 } = req.query;
    const query = {};

    // Students can only list their own attempts
    if (req.user.role === 'student') {
      query.studentId = req.user._id;
    } else if (studentId) {
      query.studentId = studentId;
    }

    if (quizId) query.quizId = quizId;

    const attempts = await Attempt.find(query)
      .populate('quizId', 'title settings')
      .populate('studentId', 'name email')
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit, 10));

    res.json({ success: true, data: attempts });
  } catch (error) {
    next(error);
  }
});

// GET /api/attempts/:id - Get attempt details
router.get('/:id', authenticate, apiLimiter, async (req, res, next) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate('quizId')
      .populate('studentId', 'name email');

    if (!attempt) {
      return res.status(404).json({ success: false, error: 'Attempt not found' });
    }

    // Authorization: students can only view their own attempts
    if (req.user.role === 'student' && attempt.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    res.json({ success: true, data: attempt });
  } catch (error) {
    next(error);
  }
});

// POST /api/attempts/start - Start quiz attempt
router.post('/start', authenticate, apiLimiter, async (req, res, next) => {
  try {
    const { quizId } = req.body;

    if (!quizId) {
      return res.status(400).json({ success: false, error: 'Quiz ID required' });
    }

    const quiz = await Quiz.findById(quizId).populate('questions');

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    if (!quiz.settings.is_published) {
      return res.status(403).json({ success: false, error: 'Quiz is not published' });
    }

    // Check if student already attempted (unless retake allowed)
    if (!quiz.settings.allow_retake && req.user.role === 'student') {
      const existingAttempt = await Attempt.findOne({
        quizId,
        studentId: req.user._id,
        is_submitted: true,
      });

      if (existingAttempt) {
        return res.status(403).json({ success: false, error: 'Quiz already attempted' });
      }
    }

    // Generate start token for fullscreen protection
    const startToken = crypto.randomBytes(32).toString('hex');

    // Create or update attempt
    let attempt = await Attempt.findOne({
      quizId,
      studentId: req.user._id,
      is_submitted: false,
    });

    if (attempt) {
      attempt.startToken = startToken;
    } else {
      attempt = await Attempt.create({
        quizId,
        studentId: req.user._id,
        answers: [],
        score: 0,
        maxScore: quiz.settings.total_marks,
        is_submitted: false,
        startToken,
      });
    }

    await attempt.save();

    // Return quiz with questions (for student)
    const quizData = quiz.toObject();
    // Shuffle questions if enabled
    if (quiz.settings.shuffle_questions) {
      quizData.questions = quiz.questions.sort(() => Math.random() - 0.5);
    }

    // Return the attempt document and the quiz/duration at top-level to match frontend expectations
    res.json({
      success: true,
      data: {
        attempt,
        quiz: quizData,
        duration: quiz.settings.duration_minutes,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/attempts/:id/submit - Submit quiz answers
router.post('/:id/submit', authenticate, apiLimiter, async (req, res, next) => {
  try {
    const { answers, startToken } = req.body;

    const attempt = await Attempt.findById(req.params.id).populate('quizId');

    if (!attempt) {
      return res.status(404).json({ success: false, error: 'Attempt not found' });
    }

    if (attempt.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (attempt.is_submitted) {
      return res.status(400).json({ success: false, error: 'Attempt already submitted' });
    }

    // Validate start token
    if (startToken && attempt.startToken !== startToken) {
      return res.status(403).json({ success: false, error: 'Invalid start token' });
    }

    // Get quiz questions
    const quiz = await Quiz.findById(attempt.quizId).populate('questions');
    const questions = quiz.questions;

    // Auto-grade MCQs
    let score = 0;
    const gradedAnswers = answers.map((answer) => {
      const question = questions.find((q) => q._id.toString() === answer.questionId);
      const isCorrect = question && answer.selectedIndex === question.correctIndex;

      if (isCorrect) {
        score += question.marks || 1;
      }

      return {
        questionId: answer.questionId,
        selectedIndex: answer.selectedIndex,
        timeTakenSeconds: answer.timeTakenSeconds || 0,
        isCorrect,
      };
    });

    // Update attempt with answers (including isCorrect for later reference)
    attempt.answers = gradedAnswers.map((a) => ({
      questionId: a.questionId,
      selectedIndex: a.selectedIndex,
      timeTakenSeconds: a.timeTakenSeconds,
    }));
    
    // Store isCorrect in a separate field for reporting
    attempt.answerResults = gradedAnswers.map((a) => ({
      questionId: a.questionId.toString(),
      isCorrect: a.isCorrect,
    }));
    attempt.score = score;
    attempt.maxScore = quiz.settings.total_marks;
    attempt.is_submitted = true;
    attempt.submittedAt = new Date();
    attempt.startToken = null;
    await attempt.save();

    // Increment quiz attempts count
    try {
      await Quiz.findByIdAndUpdate(quiz._id, { $inc: { 'settings.attempts_count': 1 } });
    } catch (incError) {
      logger.warn('Failed to increment quiz attempts count:', incError.message);
    }

    // Generate AI feedback asynchronously
    try {
      const feedbackData = await geminiService.generateFeedback(attempt, questions);
      attempt.ai_feedback = feedbackData;
      await attempt.save();

      // Store in AI feedback collection
      await AIFeedback.findOneAndUpdate(
        { attemptId: attempt._id },
        {
          attemptId: attempt._id,
          studentId: req.user._id,
          ...feedbackData,
        },
        { upsert: true, new: true }
      );

      logger.info(`Generated AI feedback for attempt ${attempt._id}`);
    } catch (feedbackError) {
      logger.error('AI feedback generation failed:', feedbackError);
      // Don't fail the submission if feedback generation fails
    }

    // Create notification
    await Notification.create({
      userId: req.user._id,
      type: 'result_published',
      title: 'Quiz Submitted',
      body: `Your quiz "${quiz.title}" has been submitted. Score: ${score}/${quiz.settings.total_marks}`,
      is_read: false,
    });

    res.json({
      success: true,
      data: {
        attempt: await Attempt.findById(attempt._id).populate('quizId'),
        score,
        maxScore: quiz.settings.total_marks,
      },
    });
  } catch (error) {
    logger.error('Submit attempt error:', error);
    next(error);
  }
});

// POST /api/attempts/:id/reval - Request revaluation
router.post('/:id/reval', authenticate, authorize('student'), apiLimiter, async (req, res, next) => {
  try {
    const { reason } = req.body;

    const attempt = await Attempt.findById(req.params.id).populate('quizId');

    if (!attempt) {
      return res.status(404).json({ success: false, error: 'Attempt not found' });
    }

    if (attempt.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (!attempt.is_submitted) {
      return res.status(400).json({ success: false, error: 'Attempt not submitted' });
    }

    attempt.revaluationRequests.push({
      teacherId: attempt.quizId.creatorId,
      reason: reason || 'Please review my answers',
      status: 'pending',
      requestedAt: new Date(),
    });

    await attempt.save();

    res.json({
      success: true,
      data: attempt,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

