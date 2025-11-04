import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
// Import all models to ensure they're registered
import './models/User.model.js';
import './models/Class.model.js';
import './models/Quiz.model.js';
import './models/Question.model.js';
import './models/Attempt.model.js';
import './models/AIFeedback.model.js';
import './models/Notification.model.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import questionRoutes from './routes/question.routes.js';
import attemptRoutes from './routes/attempt.routes.js';
import reportRoutes from './routes/report.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import aiStudyBuddyRoutes from './routes/aiStudyBuddy.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from backend directory
const envPath = join(__dirname, '..', '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  logger.info(`Loaded .env file from: ${envPath}`);
} else {
  dotenv.config();
  logger.warn('.env file not found. Make sure to create backend/.env with required environment variables.');
}
// Check for required environment variables
const requiredEnvVars = ['MONGODB_URI'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
// (uploads static and settings route will be mounted after the app and middleware are set up)
if (missingVars.length > 0 && process.env.NODE_ENV !== 'test') {
  logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  logger.error('Please create backend/.env file with the required variables. See SETUP.md for details.');
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
  },
}));

// Configure CORS with a whitelist and dynamic origin checking so deployed frontend
// origins (Vercel) and localhost are allowed. Also allow common methods and headers.
const whitelist = [process.env.FRONTEND_URL, 'http://localhost:5173', 'https://quiz-go-mantra.vercel.app'].filter(Boolean);
app.use(cors({
  origin: function(origin, callback) {
    // Allow non-browser requests (e.g., server-side tools) when origin is undefined
    if (!origin) return callback(null, true);
    if (whitelist.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
}));
// app.use(cors({
//   origin: true,
//   credentials: true,
// }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploads (logo images etc.) and settings route
const uploadsDir = join(__dirname, '..', 'uploads');
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));
app.use('/api/settings', settingsRoutes);

// Socket.io middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Validate token here if needed
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai-study-buddy', aiStudyBuddyRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    logger.info(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// Error handling
app.use(errorHandler);

// Connect to database and start server
connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });

export default app;

