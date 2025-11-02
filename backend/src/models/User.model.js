import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, // unique: true automatically creates an index
      lowercase: true,
      trim: true,
    },
    // For OAuth users password may be absent. Only required for local auth users.
    password: {
      type: String,
      minlength: 6,
      select: false, // Don't return password by default
    },
    // OAuth provider information (e.g. 'google')
    provider: {
      type: String,
      enum: ['local', 'google', 'other'],
      default: 'local',
    },
    providerId: {
      type: String,
      default: null,
    },
    providerData: {
      type: Object,
      default: {},
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      default: 'student',
    },
    classes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
      },
    ],
    preferences: {
      theme: {
        type: String,
        default: 'dark',
      },
      preferred_topics: [String],
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash password when it's present and modified
  if (!this.password || !this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  // If no password is set (OAuth user), comparison always fails
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes (email is automatically indexed via unique: true above)
userSchema.index({ role: 1 });

export default mongoose.model('User', userSchema);

