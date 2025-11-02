import express from 'express';
import Notification from '../models/Notification.model.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// GET /api/notifications - List user notifications
router.get('/', authenticate, apiLimiter, async (req, res, next) => {
  try {
    const { limit = 50, unread } = req.query;

    const query = { userId: req.user._id };
    if (unread === 'true') {
      query.is_read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications/mark-read - Mark notifications as read
router.post('/mark-read', authenticate, apiLimiter, async (req, res, next) => {
  try {
    const { notificationIds } = req.body;

    if (notificationIds && Array.isArray(notificationIds)) {
      await Notification.updateMany(
        { _id: { $in: notificationIds }, userId: req.user._id },
        { is_read: true }
      );
    } else {
      // Mark all as read
      await Notification.updateMany(
        { userId: req.user._id, is_read: false },
        { is_read: true }
      );
    }

    res.json({
      success: true,
      message: 'Notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

