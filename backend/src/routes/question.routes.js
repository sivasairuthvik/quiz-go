import express from 'express';
import Question from '../models/Question.model.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// GET /api/questions/bank - Get question bank (teacher)
router.get('/bank', authenticate, authorize('teacher', 'admin'), apiLimiter, async (req, res, next) => {
  try {
    const questions = await Question.find({
      $or: [
        { createdBy: req.user._id },
        { quizId: null }, // Bank questions
      ],
    })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: questions,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/questions - Create question (teacher/admin)
router.post('/', authenticate, authorize('teacher', 'admin'), apiLimiter, async (req, res, next) => {
  try {
    const { stem, choices, correctIndex, marks, difficulty, explanation, topic_tags } = req.body;

    const question = await Question.create({
      stem,
      choices,
      correctIndex,
      marks: marks || 1,
      difficulty: difficulty || 'medium',
      explanation: explanation || '',
      topic_tags: topic_tags || [],
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
});

// PUT /api/questions/:id - Edit question
router.put('/:id', authenticate, authorize('teacher', 'admin'), apiLimiter, async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    // Only creator or admin can edit
    if (question.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const { stem, choices, correctIndex, marks, difficulty, explanation, topic_tags } = req.body;

    if (stem) question.stem = stem;
    if (choices) question.choices = choices;
    if (correctIndex !== undefined) question.correctIndex = correctIndex;
    if (marks !== undefined) question.marks = marks;
    if (difficulty) question.difficulty = difficulty;
    if (explanation !== undefined) question.explanation = explanation;
    if (topic_tags) question.topic_tags = topic_tags;

    await question.save();

    res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

