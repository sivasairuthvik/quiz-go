import pdfParse from 'pdf-parse';
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const MAX_PDF_SIZE = 25 * 1024 * 1024; // 25MB

export class PDFService {
  async extractTextFromBuffer(buffer) {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      logger.error('PDF extraction error:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  async storePDF(buffer, filename, uploaderId) {
    try {
      const db = mongoose.connection.db;
      const { GridFSBucket } = await import('mongodb');
      const bucket = new GridFSBucket(db, { bucketName: 'pdfs' });

      return new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(filename, {
          metadata: {
            uploaderId,
            originalName: filename,
            size: buffer.length,
            mime: 'application/pdf',
            uploadedAt: new Date(),
          },
        });

        uploadStream.end(buffer);
        uploadStream.on('finish', () => {
          resolve(uploadStream.id);
        });
        uploadStream.on('error', reject);
      });
    } catch (error) {
      logger.error('PDF storage error:', error);
      throw new Error(`Failed to store PDF: ${error.message}`);
    }
  }

  async getPDF(fileId) {
    try {
      const db = mongoose.connection.db;
      const { GridFSBucket } = await import('mongodb');
      const bucket = new GridFSBucket(db, { bucketName: 'pdfs' });

      const chunks = [];
      return new Promise((resolve, reject) => {
        const downloadStream = bucket.openDownloadStream(fileId);
        downloadStream.on('data', (chunk) => chunks.push(chunk));
        downloadStream.on('end', () => resolve(Buffer.concat(chunks)));
        downloadStream.on('error', reject);
      });
    } catch (error) {
      logger.error('PDF retrieval error:', error);
      throw new Error(`Failed to retrieve PDF: ${error.message}`);
    }
  }

  validatePDF(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > MAX_PDF_SIZE) {
      throw new Error(`PDF size exceeds ${MAX_PDF_SIZE / 1024 / 1024}MB limit`);
    }

    if (file.mimetype !== 'application/pdf') {
      throw new Error('File must be a PDF');
    }

    return true;
  }
}

export default new PDFService();

