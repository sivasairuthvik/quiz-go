# Quiz Mantra - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
# Root level
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment Variables

#### Backend (`backend/.env`)

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/quizmantra

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-pro

# Google OAuth2
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT Secrets
JWT_PRIVATE_KEY=your-jwt-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars

# Email (Optional)
SENDGRID_API_KEY=your-sendgrid-key

# URLs
FRONTEND_URL=http://localhost:5173
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info
```

#### Frontend (`frontend/.env`)

```env
# Development
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Production (set in Vercel)
# VITE_API_URL=https://quiz-go-mantra-backend.vercel.app
```

### 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:5173/auth/callback` (development)
   - `https://your-domain.vercel.app/auth/callback` (production)

### 4. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `backend/.env` as `GEMINI_API_KEY`

### 5. Set Up MongoDB

1. Create a MongoDB Atlas account or use local MongoDB
2. Create a database named `quizmantra`
3. Add connection string to `backend/.env` as `MONGODB_URI`

### 6. Run Development Servers

```bash
# From root directory
npm run dev

# Or separately:
# Backend (terminal 1)
cd backend
npm run dev

# Frontend (terminal 2)
cd frontend
npm run dev
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173

### 7. Seed Demo Data (Optional)

```bash
cd backend
npm run seed
```

This creates:
- 1 admin user (admin@example.com)
- 2 teacher users
- 10 student users
- 4 sample quizzes

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Build

```bash
cd frontend
npm run build
npm run preview
```

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### MongoDB Atlas Setup

- Whitelist Vercel IP addresses or allow all (0.0.0.0/0) for development
- Ensure GridFS is enabled (enabled by default)

## Troubleshooting

### Backend won't start
- Check MongoDB connection string
- Verify all environment variables are set
- Check port 3000 is available

### Frontend won't start
- Check port 5173 is available
- Verify VITE_API_URL is correct
- Clear browser cache

### OAuth not working
- Verify redirect URI matches Google Console settings
- Check CORS settings
- Ensure frontend URL matches in backend .env

### Gemini API errors
- Verify API key is valid
- Check model name (use gemini-1.5-pro or gemini-pro)
- Check API quota

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use secure JWT secrets (32+ characters)
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up MongoDB Atlas with proper security
- [ ] Configure Vercel environment variables
- [ ] Test all features end-to-end
- [ ] Set up error monitoring
- [ ] Configure email service (optional)

