import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema(
  {
    appName: { type: String, default: 'Quiz Mantra' },
    emailNotifications: { type: Boolean, default: true },
    chatbotEnabled: { type: Boolean, default: false },
    theme: { type: String, default: 'light' },
    quizDefaults: {
      difficulty: { type: String, default: 'medium' },
      numberOfQuestions: { type: Number, default: 10 },
    },
    logoUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
export default Settings;
