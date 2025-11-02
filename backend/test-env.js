// Test environment variables
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from backend directory
const envPath = join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

console.log('Environment Variables Check:');
console.log('============================');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ Not Set');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✓ Set' : '✗ Not Set');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Not Set (will use default: http://localhost:5173)');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✓ Set' : '✗ Not Set');
console.log('JWT_PRIVATE_KEY:', process.env.JWT_PRIVATE_KEY ? '✓ Set' : '✗ Not Set');
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? '✓ Set' : '✗ Not Set');
console.log('============================');
