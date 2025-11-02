# Vercel Deployment Configuration

## Separate Deployments Setup

This project uses **two separate Vercel deployments**:

### 1. Backend Deployment
- **URL**: https://quiz-go-mantra-backend.vercel.app
- **Project**: Deploy from `backend` folder or root with backend vercel.json

### 2. Frontend Deployment  
- **URL**: https://quiz-go-mantra.vercel.app
- **Project**: Deploy from `frontend` folder or root with frontend vercel.json

---

## Backend Environment Variables (Vercel)

Set these in your **backend** Vercel project settings:

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/quizmantra

# Frontend URL (IMPORTANT for CORS)
FRONTEND_URL=https://quiz-go-mantra.vercel.app

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-pro

# Google OAuth2
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT Secrets (use strong random strings)
JWT_PRIVATE_KEY=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# Email (Optional)
SENDGRID_API_KEY=your-sendgrid-key

# Environment
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

---

## Frontend Environment Variables (Vercel)

Set these in your **frontend** Vercel project settings:

```env
# Backend API URL
VITE_API_URL=https://quiz-go-mantra-backend.vercel.app

# Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Optional: CopilotKit
VITE_COPILOT_PUBLIC_KEY=your-copilot-api-key
```

---

## Google OAuth Redirect URIs

Add these to your Google Cloud Console OAuth 2.0 credentials:

1. Development (localhost):
   - `http://localhost:5173/auth/callback`
   - `http://localhost:3000/api/auth/google/callback`

2. Production:
   - `https://quiz-go-mantra.vercel.app/auth/callback`
   - `https://quiz-go-mantra-backend.vercel.app/api/auth/google/callback`

**Note**: For local testing, make sure both frontend and backend are running:
- Frontend: `http://localhost:5173` (cd frontend && npm run dev)
- Backend: `http://localhost:3000` (cd backend && npm run dev)

---

## Deployment Steps

### Deploy Backend

1. Go to Vercel Dashboard
2. Import your repository
3. Set **Root Directory** to `backend` (or use backend/vercel.json)
4. Add all backend environment variables
5. Deploy

### Deploy Frontend

1. Go to Vercel Dashboard
2. Import your repository (or create new project)
3. Set **Root Directory** to `frontend` (or use frontend/vercel.json)
4. Add all frontend environment variables
5. Deploy

---

## MongoDB Atlas Setup

1. **Network Access**: Add `0.0.0.0/0` to allow connections from anywhere (or add Vercel IPs)
2. **Database User**: Create user with read/write permissions
3. **Connection String**: Use in `MONGODB_URI` with URL-encoded password

---

## Testing Your Deployment

1. Backend health check:
   ```
   https://quiz-go-mantra-backend.vercel.app/api/health
   ```

2. Frontend:
   ```
   https://quiz-go-mantra.vercel.app
   ```

3. Check browser console for any CORS errors

---

## Troubleshooting

### CORS Errors
- Verify `FRONTEND_URL` is set correctly in backend Vercel env vars
- Check it matches your frontend URL exactly (with https://)

### API Connection Failed
- Verify `VITE_API_URL` is set in frontend Vercel env vars
- Check backend is deployed and accessible

### OAuth Not Working
- Verify both redirect URIs are added in Google Console
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in backend env vars
- Ensure `VITE_GOOGLE_CLIENT_ID` in frontend matches backend

### MongoDB Connection Failed
- Check MongoDB Atlas network access allows Vercel IPs
- Verify connection string is correct
- Ensure password is URL-encoded if it contains special characters

---

## Local Development

For local development, use `.env` files:

### Backend `.env`
```env
FRONTEND_URL=http://localhost:5173
MONGODB_URI=your-connection-string
# ... other vars
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your-client-id
```
