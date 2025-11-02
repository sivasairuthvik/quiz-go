import express from 'express';
import multer from 'multer';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import Settings from '../models/Settings.model.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    cb(null, name);
  },
});

const upload = multer({ storage });

// GET /api/settings - public
router.get('/', async (req, res, next) => {
  try {
    let settings = await Settings.findOne().lean();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

// PUT /api/settings - admin only
router.put('/', authenticate, authorize('admin'), apiLimiter, async (req, res, next) => {
  try {
    const update = req.body || {};
    const settings = await Settings.findOneAndUpdate({}, update, { new: true, upsert: true, setDefaultsOnInsert: true }).lean();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

// POST /api/settings/logo - upload site logo (admin only)
router.post('/logo', authenticate, authorize('admin'), apiLimiter, upload.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    // Store relative URL to file
    const logoUrl = `/uploads/${req.file.filename}`;
    const settings = await Settings.findOneAndUpdate({}, { logoUrl }, { new: true, upsert: true, setDefaultsOnInsert: true }).lean();

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

export default router;
