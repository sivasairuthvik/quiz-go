import express from 'express';
import multer from 'multer';
import Quiz from '../models/Quiz.model.js';
import Question from '../models/Question.model.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { apiLimiter, uploadLimiter } from '../middleware/rateLimiter.js';
import pdfService from '../services/pdf.service.js';
import geminiService from '../services/gemini.service.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/quizzes - List quizzes (filtered by role)
router.get('/', authenticate, apiLimiter, async (req, res, next) => {
  try {
    const { classId, published, scheduled, creatorId } = req.query;
    const query = {};

    if (req.user.role === 'student') {
      // Students see only published quizzes in their classes
      query['settings.is_published'] = true;
      if (classId) {
        query['settings.allowed_classes'] = classId;
      }
    } else if (req.user.role === 'teacher') {
      // Teachers see their own quizzes + published ones in their classes
      if (creatorId && creatorId === req.user._id.toString()) {
        query.creatorId = req.user._id;
      } else {
        query['settings.is_published'] = true;
      }
    } else if (req.user.role === 'admin') {
      // Admins see all
      if (creatorId) {
        query.creatorId = creatorId;
      }
    }

    if (published !== undefined) {
      query['settings.is_published'] = published === 'true';
    }

    const quizzes = await Quiz.find(query)
      .populate('creatorId', 'name email')
      .populate('questions')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: quizzes,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/quizzes/:id - Get quiz details
router.get('/:id', authenticate, apiLimiter, async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('creatorId', 'name email')
      .populate('questions')
      .populate('settings.allowed_classes');

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    // Hide questions from students until attempt starts
    if (req.user.role === 'student' && !quiz.settings.is_published) {
      quiz.questions = [];
    }

    res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/quizzes - Create quiz (teacher/admin)
router.post('/', authenticate, authorize('teacher', 'admin'), apiLimiter, async (req, res, next) => {
  try {
    const { title, description, questions, settings, status, metadata } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    // Determine if questions are IDs or full objects from frontend
    let questionIds = [];
    if (Array.isArray(questions) && questions.length > 0) {
      const looksLikeIdsOnly = questions.every((q) => typeof q === 'string' || (q && typeof q === 'object' && q._id && typeof q._id === 'string'));

      if (looksLikeIdsOnly) {
        // Normalize to array of ids
        const ids = questions.map((q) => (typeof q === 'string' ? q : q._id));
        const existing = await Question.find({ _id: { $in: ids } }).select('_id');
        if (existing.length !== ids.length) {
          return res.status(400).json({ success: false, error: 'Some question IDs are invalid or missing' });
        }
        questionIds = ids;
      } else {
        // Create questions from embedded objects
        const created = [];
        for (const q of questions) {
          // Map frontend shapes to backend schema
          const stem = (q.stem || q.question || q.question_text || '').toString().trim();
          if (!stem) continue;

          let choices = [];
          let correctIndex = 0;
          if (Array.isArray(q.options) && q.options.length > 0) {
            const filtered = q.options.filter((o) => o && typeof o.text === 'string' && o.text.trim());
            choices = filtered.map((o) => ({ text: o.text }));
            const idxByFlag = filtered.findIndex((o) => o.isCorrect === true);
            if (idxByFlag >= 0) correctIndex = idxByFlag;
            else if (q.correctIndex !== undefined) correctIndex = Number(q.correctIndex) || 0;
            else if (q.correctAnswer) {
              const idxByText = filtered.findIndex((o) => o.text === q.correctAnswer);
              correctIndex = idxByText >= 0 ? idxByText : 0;
            }
          } else if (q.type === 'true-false') {
            choices = [{ text: 'True' }, { text: 'False' }];
            if (typeof q.correctAnswer === 'boolean') correctIndex = q.correctAnswer ? 0 : 1;
          } else {
            // Fallback single choice from free-text answer (not ideal but prevents failure)
            choices = [{ text: 'Answer' }, { text: 'Other' }];
            correctIndex = 0;
          }

          const doc = await Question.create({
            quizId: null, // will update after quiz created
            source: 'manual',
            stem,
            choices,
            correctIndex,
            marks: Number(q.points || q.marks || 1),
            difficulty: (q.difficulty || metadata?.difficulty || 'medium').toLowerCase(),
            explanation: (q.explanation || '').toString(),
            createdBy: req.user._id,
          });
          created.push(doc._id);
        }
        questionIds = created;
      }
    }

    // Map settings from frontend shape to backend shape
    const safeSettings = settings || {};
    const mappedSettings = {
      duration_minutes: Number(safeSettings.timeLimit ?? safeSettings.duration_minutes ?? 60),
      shuffle_questions: Boolean(safeSettings.shuffleQuestions ?? safeSettings.shuffle_questions ?? false),
      allow_retake: Boolean(safeSettings.allowRetake ?? safeSettings.allow_retake ?? false),
      is_published: status === 'published' ? true : Boolean(safeSettings.is_published ?? false),
      difficulty_overall: (metadata?.difficulty || safeSettings.difficulty || 'medium').toLowerCase(),
    };

    const quiz = await Quiz.create({
      title: title.trim(),
      description: (description || '').toString(),
      creatorId: req.user._id,
      questions: questionIds,
      settings: mappedSettings,
    });

    // Update created questions with quizId
    if (questionIds.length > 0) {
      await Question.updateMany({ _id: { $in: questionIds } }, { $set: { quizId: quiz._id } });
    }

    await quiz.populate('creatorId', 'name email');
    await quiz.populate('questions');

    res.status(201).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/quizzes/:id - Edit quiz (teacher/admin)
router.put('/:id', authenticate, authorize('teacher', 'admin'), apiLimiter, async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    // Only creator or admin can edit
    if (quiz.creatorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const { title, description, questions, settings } = req.body;

    // Validate provided question IDs (if any)
    if (questions && questions.length > 0) {
      const existing = await Question.find({ _id: { $in: questions } }).select('_id');
      if (existing.length !== questions.length) {
        return res.status(400).json({ success: false, error: 'Some question IDs are invalid or missing' });
      }
    }

    if (title) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (questions) quiz.questions = questions;
    if (settings) quiz.settings = { ...quiz.settings, ...settings };

    await quiz.save();
    await quiz.populate('creatorId', 'name email');
    await quiz.populate('questions');

    res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/quizzes/:id/publish - Publish quiz
router.post('/:id/publish', authenticate, authorize('teacher', 'admin'), apiLimiter, async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    if (quiz.creatorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    quiz.settings.is_published = true;
    quiz.settings.scheduledAt = new Date();
    await quiz.save();

    res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/quizzes/upload-pdf - Upload PDF and generate quiz
router.post('/upload-pdf', authenticate, authorize('teacher', 'admin'), uploadLimiter, upload.single('pdf'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No PDF file provided' });
    }

    // Validate PDF
    pdfService.validatePDF(req.file);

    // Extract text from PDF
    const text = await pdfService.extractTextFromBuffer(req.file.buffer);
    logger.info(`Extracted ${text.length} characters from PDF`);

    if (text.length < 100) {
      return res.status(400).json({ success: false, error: 'PDF contains too little text' });
    }

    // Store PDF in GridFS
    const fileId = await pdfService.storePDF(req.file.buffer, req.file.originalname, req.user._id);
    logger.info(`Stored PDF with ID: ${fileId}`);

    // Generate MCQs using Gemini
    let aiQuestions = [];
    let aiError = null;
    try {
      aiQuestions = await geminiService.generateMCQsFromText(text, 10);
      logger.info(`Generated ${aiQuestions.length} questions from PDF`);
    } catch (error) {
      // Keep the full error for debugging
      aiError = error;
      // Log the full error object/stack to server logs (helps when error.message is empty)
      logger.error('AI generation failed:', error && error.stack ? error.stack : error);
      // We'll fallback to creating an empty draft quiz and return a helpful message
    }

    // Create questions in database (if AI succeeded)
    const questionIds = [];
    if (aiQuestions && aiQuestions.length > 0) {
      for (const qData of aiQuestions) {
        const question = await Question.create({
          quizId: null, // Draft quiz
          source: 'ai',
          stem: qData.stem,
          choices: qData.choices,
          correctIndex: qData.correctIndex,
          marks: qData.marks,
          difficulty: qData.difficulty,
          explanation: qData.explanation,
          createdBy: req.user._id,
        });
        questionIds.push(question._id);
      }
    }

    // Create draft quiz (may have zero questions if AI failed)
    const quiz = await Quiz.create({
      title: req.file.originalname.replace('.pdf', ''),
      description: `AI-generated quiz from PDF: ${req.file.originalname}`,
      creatorId: req.user._id,
      questions: questionIds,
      settings: {
        is_published: false,
      },
    });

    await quiz.populate('questions');

    // Construct a helpful message for the client. For debugging, include a non-sensitive excerpt of the error.
    const message = aiError
      ? `AI generation failed: ${aiError.message || 'see server logs for details'}. A draft quiz was created without questions. You can add questions manually.`
      : `Generated ${aiQuestions.length} questions from PDF`;

    res.status(201).json({
      success: true,
      data: {
        quiz,
        fileId,
        message,
        // Return limited error details for debugging (stack may contain sensitive info - remove in production)
        aiError: aiError ? (aiError.stack ? aiError.stack.split('\n').slice(0,5).join('\n') : String(aiError)) : null,
      },
    });
  } catch (error) {
    logger.error('PDF upload error:', error);
    next(error);
  }
});

export default router;

