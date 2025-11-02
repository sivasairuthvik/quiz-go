# Quiz Mantra 🧠

**AI-powered quiz platform for smarter learning**

Quiz Mantra is a comprehensive quiz management system that enables teachers to create AI-generated quizzes from PDFs, students to attempt quizzes with real-time feedback, and admins to monitor performance analytics.

## 🎯 Features

- **Google OAuth2 Authentication** with JWT tokens (access + refresh)
- **AI-Powered Quiz Generation** using Google Gemini 2.5 Pro from PDF uploads
- **Adaptive Dashboard** with role-based UI (Student/Teacher/Admin)
- **Fullscreen Quiz Player** with timer and auto-submit protection
- **Auto-Grading** for MCQs with AI-generated feedback
- **Rich Analytics** with Recharts visualizations
- **Glassmorphic UI** with orange/black/purple neon theme
- **Real-time Notifications** via Socket.io
- **PDF Storage** using MongoDB GridFS

## 🏗️ Tech Stack

### Frontend
- React 18
- Vite
- Pure CSS (CSS Modules)
- Recharts
- Framer Motion (limited)
- Socket.io Client

### Backend
- Node.js
- Express.js
- MongoDB (with GridFS)
- Google Gemini 2.5 Pro
- Google OAuth2
- Socket.io
- pdf-parse

### Deployment
- Vercel (Frontend + Backend Serverless Functions)
- MongoDB Atlas

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB)
- Google Cloud Console account (for OAuth2)
- Google AI Studio account (for Gemini API)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd quiz-mantra
```

2. **Install dependencies**
```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

3. **Set up environment variables**

Create `backend/.env`:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/quizmantra
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_PRIVATE_KEY=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
SENDGRID_API_KEY=your-sendgrid-key (optional)
FRONTEND_URL=http://localhost:5173
PORT=3000
NODE_ENV=development
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

4. **Configure Google OAuth**

- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select existing
- Enable Google+ API
- Create OAuth 2.0 credentials
- Add authorized redirect URIs:
  - `http://localhost:3000/api/auth/google/callback` (dev)
  - `https://your-domain.vercel.app/api/auth/google/callback` (prod)

5. **Get Gemini API Key**

- Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create a new API key for Gemini 2.5 Pro

6. **Run development servers**

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## 📁 Project Structure

```
quiz-mantra/
├── frontend/           # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── styles/
│   │   └── App.jsx
│   └── vite.config.js
├── backend/            # Express.js API
│   ├── src/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── utils/
│   └── vercel.json
├── package.json
└── README.md
```

## 🧪 Testing

```bash
npm test
```

## 📦 Building for Production

```bash
npm run build
```

## 🚢 Deployment

### Vercel Deployment

1. **Push to GitHub**
2. **Import project to Vercel**
3. **Configure environment variables in Vercel dashboard**
4. **Deploy**

The project includes `vercel.json` configurations for serverless functions.

### MongoDB Atlas Setup

- Create a cluster on MongoDB Atlas
- Enable GridFS for file storage
- Whitelist Vercel IP ranges or allow all (0.0.0.0/0) for development
- Get connection string and add to `MONGODB_URI`

## 🔐 Security Best Practices

- Never expose `GEMINI_API_KEY` to frontend
- Use HTTPS in production
- Enable rate limiting on public endpoints
- Validate and sanitize all inputs
- Use secure cookies for refresh tokens
- Rotate JWT secrets regularly

## 📝 API Documentation

### Authentication

- `POST /api/auth/google` - OAuth callback, returns JWT tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Revoke refresh token

### Quizzes

- `GET /api/quizzes` - List quizzes (filtered by role)
- `POST /api/quizzes` - Create quiz (teacher/admin)
- `POST /api/quizzes/upload-pdf` - Upload PDF and generate quiz
- `GET /api/quizzes/:id` - Get quiz details

### Attempts

- `POST /api/attempts/start` - Start quiz attempt
- `POST /api/attempts/:id/submit` - Submit answers, get AI feedback

### Reports

- `GET /api/reports/student/:id` - Student performance report
- `GET /api/reports/teacher/:id` - Teacher analytics

See `backend/src/routes/` for complete API documentation.

## 🤖 AI Integration

### PDF to Quiz Generation

1. Teacher uploads PDF (max 25MB)
2. Server extracts text using pdf-parse
3. Text is sent to Gemini 2.5 Pro with specialized prompt
4. Gemini returns structured JSON with MCQs
5. Questions are stored as draft for teacher review

### AI Feedback

After quiz submission:
- Auto-grade MCQs locally
- Send attempt data to Gemini
- Generate personalized feedback (strengths, weak areas, tips)
- Store in `ai_feedback` collection

## 🎨 UI Theme

- **Primary Color**: Orange (#ff7a18)
- **Accent**: Purple neon glow
- **Background**: Deep black/dark gradient
- **Glass Effect**: Backdrop blur with rgba overlays
- **Typography**: System fonts for performance

## 📊 Database Schema

See `backend/src/models/` for Mongoose schemas:
- Users (with Google OAuth)
- Quizzes (with scheduling)
- Questions (manual or AI-generated)
- Attempts (with answers and scores)
- AI Feedback (per attempt)
- Notifications
- Files (GridFS)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License

## 🆘 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for smarter learning**


