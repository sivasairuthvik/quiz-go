import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      default: null,
    },
    source: {
      type: String,
      enum: ['manual', 'ai', 'import'],
      default: 'manual',
    },
    stem: {
      type: String,
      required: true,
      trim: true,
    },
    choices: [
      {
        text: {
          type: String,
          required: true,
        },
        meta: {
          type: String,
          default: '',
        },
      },
    ],
    correctIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    marks: {
      type: Number,
      default: 1,
      min: 0,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    topic_tags: [String],
    explanation: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Validation
questionSchema.pre('validate', function (next) {
  if (this.choices.length < 2 || this.choices.length > 6) {
    next(new Error('Choices must be between 2 and 6'));
  }
  if (this.correctIndex >= this.choices.length || this.correctIndex < 0) {
    next(new Error('Correct index must be within choices range'));
  }
  next();
});

export default mongoose.model('Question', questionSchema);

