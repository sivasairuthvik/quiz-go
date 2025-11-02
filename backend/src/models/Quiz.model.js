import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    settings: {
      duration_minutes: {
        type: Number,
        default: 60,
        min: 1,
      },
      total_marks: {
        type: Number,
        default: 0,
        min: 0,
      },
      pass_marks: {
        type: Number,
        default: 0,
        min: 0,
      },
      difficulty_overall: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
      },
      shuffle_questions: {
        type: Boolean,
        default: false,
      },
      is_published: {
        type: Boolean,
        default: false,
      },
      scheduledAt: {
        type: Date,
        default: null,
      },
      allowed_classes: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Class',
        },
      ],
      allow_retake: {
        type: Boolean,
        default: false,
      },
      // Count of total attempts submitted for this quiz
      attempts_count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Calculate total marks before save
quizSchema.pre('save', async function (next) {
  if (this.isModified('questions') && this.questions.length > 0) {
    const Question = mongoose.model('Question');
    const questions = await Question.find({ _id: { $in: this.questions } });
    this.settings.total_marks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  }
  next();
});

export default mongoose.model('Quiz', quizSchema);

