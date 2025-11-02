import express from 'express';
import User from '../models/User.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../utils/logger.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// POST /api/auth/oauth - Exchange provider idToken for local tokens (supports Google id_token)
router.post('/oauth', authLimiter, async (req, res, next) => {
  try {
    const { provider, idToken } = req.body;

    if (!provider || !idToken) {
      return res.status(400).json({ success: false, error: 'Provider and idToken are required' });
    }

    let profile = null;

    if (provider === 'google') {
      // Validate Google id_token via tokeninfo endpoint
      const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
      const resp = await fetch(tokenInfoUrl);
      if (!resp.ok) {
        const txt = await resp.text();
        logger.error('Google tokeninfo error:', txt);
        return res.status(401).json({ success: false, error: 'Invalid Google id_token' });
      }

      const info = await resp.json();

      // Optional: verify audience if GOOGLE_CLIENT_ID provided
      if (process.env.GOOGLE_CLIENT_ID && info.aud && info.aud !== process.env.GOOGLE_CLIENT_ID) {
        logger.warn('Google id_token audience mismatch', info.aud);
        return res.status(401).json({ success: false, error: 'Invalid Google token audience' });
      }

      profile = {
        provider: 'google',
        providerId: info.sub,
        email: info.email,
        emailVerified: info.email_verified === 'true' || info.email_verified === true,
        name: info.name || info.email.split('@')[0],
        providerData: info,
      };
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported provider' });
    }

    if (!profile.email) {
      return res.status(400).json({ success: false, error: 'Email not available from provider' });
    }

    // Find or create user
    let user = await User.findOne({ email: profile.email }).select('+password');

    if (user) {
      // If existing local user without provider info, attach provider info
      let changed = false;
      if (!user.provider || user.provider === 'local') {
        user.provider = profile.provider;
        user.providerId = profile.providerId;
        user.providerData = profile.providerData || {};
        user.emailVerified = user.emailVerified || profile.emailVerified;
        changed = true;
      }
      if (changed) await user.save();
    } else {
      // Create new user record (no local password)
      user = await User.create({
        email: profile.email,
        name: profile.name || profile.email.split('@')[0],
        role: 'student',
        provider: profile.provider,
        providerId: profile.providerId,
        providerData: profile.providerData || {},
        emailVerified: !!profile.emailVerified,
        lastLogin: new Date(),
      });
    }

    // Generate tokens and persist refresh token
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      data: {
        user: { id: user._id, email: user.email, name: user.name, role: user.role },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('OAuth login error:', error);
    next(error);
  }
});

// POST /api/auth/register - Register new user
router.post('/register', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { email, password, name, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      name,
      role: role || 'student',
      lastLogin: new Date(),
    });

    // Generate JWT tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
});

// POST /api/auth/login - Login with email and password
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', authLimiter, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user._id, user.role);

    // Rotate refresh token
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    next(error);
  }
});

// POST /api/auth/logout - Revoke refresh token
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
});

export default router;

