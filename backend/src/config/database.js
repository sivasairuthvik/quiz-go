import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

// Serverless-friendly mongoose connection helper.
// Reuse a cached connection when possible to avoid creating
// multiple connections across invocations (important on Vercel).
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not defined in environment variables. Please create a .env file in the backend directory with MONGODB_URI=your_connection_string'
    );
  }

  // Use global cache to keep connection between invocations in serverless envs
  const globalAny = globalThis;
  if (globalAny._mongoose && globalAny._mongoose.conn) {
    logger.debug('Using cached MongoDB connection');
    return globalAny._mongoose.conn;
  }

  if (!globalAny._mongoose) globalAny._mongoose = { conn: null, promise: null };

  if (!globalAny._mongoose.promise) {
    logger.info('Creating new MongoDB connection...');
    globalAny._mongoose.promise = mongoose
      .connect(process.env.MONGODB_URI, {
        // optional mongoose options can go here
        // useNewUrlParser, useUnifiedTopology are defaults in newer drivers
      })
      .then((conn) => {
        logger.info(`MongoDB Connected: ${conn.connection.host}`);

        // Set up GridFS for file storage (best-effort)
        (async () => {
          try {
            const { GridFSBucket } = await import('mongodb');
            const bucket = new GridFSBucket(mongoose.connection.db, {
              bucketName: 'pdfs',
            });
            mongoose.connection.db.gridfsBucket = bucket;
            logger.info('GridFS bucket initialized');
          } catch (err) {
            logger.warn('GridFS initialization skipped:', err?.message || err);
          }
        })();

        mongoose.connection.on('error', (err) => {
          logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
          logger.warn('MongoDB disconnected');
        });

        globalAny._mongoose.conn = mongoose.connection;
        return globalAny._mongoose.conn;
      })
      .catch((err) => {
        // Clear the promise so future attempts can retry
        globalAny._mongoose.promise = null;
        logger.error('Database connection failed:', err);
        throw err;
      });
  }

  return globalAny._mongoose.promise;
};

export default connectDB;

