import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
          required: true,
        },
        selectedIndex: {
          type: Number,
          required: true,
        },
        timeTakenSeconds: {
          type: Number,
          default: 0,
        },
      },
    ],
    answerResults: [
      {
        questionId: String,
        isCorrect: Boolean,
      },
    ],
    score: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    ai_feedback: {
      summary: String,
      weak_topics: [
        {
          topic: String,
          score: Number,
          advice: String,
        },
      ],
      improvement_tips: String,
      recommended_actions: String,
    },
    is_submitted: {
      type: Boolean,
      default: false,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    revaluationRequests: [
      {
        teacherId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        reason: String,
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
        response: String,
        requestedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    startToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
attemptSchema.index({ quizId: 1, studentId: 1 });
attemptSchema.index({ studentId: 1, submittedAt: -1 });

export default mongoose.model('Attempt', attemptSchema);

