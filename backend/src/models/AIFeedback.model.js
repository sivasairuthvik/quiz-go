import mongoose from 'mongoose';

const aiFeedbackSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attempt',
      required: true,
      unique: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    weak_topics: [
      {
        topic: String,
        score: Number,
      },
    ],
    improvement_tips: {
      type: String,
      required: true,
    },
    recommended_actions: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('AIFeedback', aiFeedbackSchema);

