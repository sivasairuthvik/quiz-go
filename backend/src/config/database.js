import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables. Please create a .env file in the backend directory with MONGODB_URI=your_connection_string');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Set up GridFS for file storage
    try {
      const { GridFSBucket } = await import('mongodb');
      const bucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'pdfs',
      });
      mongoose.connection.db.gridfsBucket = bucket;
      logger.info('GridFS bucket initialized');
    } catch (error) {
      logger.warn('GridFS initialization skipped:', error.message);
    }

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    return mongoose.connection;
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

export default connectDB;

