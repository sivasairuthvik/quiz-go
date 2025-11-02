# Authentication Migration - Google OAuth to Email/Password

## Changes Made

### ✅ Backend Changes

1. **User Model** (`backend/src/models/User.model.js`)
   - ✅ Removed `googleId` field
   - ✅ Added `password` field (hashed with bcrypt)
   - ✅ Added password hashing middleware (pre-save)
   - ✅ Added `comparePassword` method

2. **Auth Routes** (`backend/src/routes/auth.routes.js`)
   - ✅ Removed Google OAuth route (`POST /api/auth/google`)
   - ✅ Added registration route (`POST /api/auth/register`)
   - ✅ Added login route (`POST /api/auth/login`)
   - ✅ Kept refresh token and logout routes
   - ✅ Added input validation with express-validator

3. **Dependencies**
   - ✅ Removed `google-auth-library` package
   - ✅ Using `bcryptjs` (already in dependencies) for password hashing

### ✅ Frontend Changes

1. **Landing Page** (`frontend/src/pages/LandingPage.jsx`)
   - ✅ Removed Google OAuth callback handling
   - ✅ Added Login/Register form toggle
   - ✅ Split into LoginForm and RegisterForm components

2. **New Components**
   - ✅ `LoginForm.jsx` - Email/password login form
   - ✅ `RegisterForm.jsx` - Registration form with role selection
   - ✅ Styled with glassmorphic design

3. **Auth Context** (`frontend/src/contexts/AuthContext.jsx`)
   - ✅ Updated `login()` to accept email/password
   - ✅ Added `register()` method

4. **Routes**
   - ✅ Removed `/auth/callback` route

### ✅ Other Changes

- ✅ Updated CSP headers (removed Google OAuth domains)
- ✅ Updated seed script to create users with passwords
- ✅ Removed LandingHero component (replaced with forms)

## New API Endpoints

### POST /api/auth/register
**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student" // optional, defaults to "student"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "student"
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### POST /api/auth/login
**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "student"
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

## Demo Accounts (After Running Seed)

After running `npm run seed` in backend:

- **Admin:**
  - Email: `admin@example.com`
  - Password: `admin123`

- **Teacher 1:**
  - Email: `teacher1@example.com`
  - Password: `teacher123`

- **Teacher 2:**
  - Email: `teacher2@example.com`
  - Password: `teacher123`

- **Students:**
  - Email: `student1@example.com` through `student10@example.com`
  - Password: `student123` (for all)

## Environment Variables

### Removed (No longer needed):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `VITE_GOOGLE_CLIENT_ID` (frontend)

### Still Required:
- `MONGODB_URI`
- `GEMINI_API_KEY` (for AI features)
- `JWT_PRIVATE_KEY`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL`
- `PORT`
- `NODE_ENV`

## Migration Steps for Existing Users

If you have existing users in the database:

1. **Option 1: Reset all users**
   ```bash
   # Delete all users and reseed
   # In MongoDB:
   db.users.deleteMany({})
   npm run seed
   ```

2. **Option 2: Manually update users**
   - Users with `googleId` need to register with email/password
   - Or manually add password hash to existing users

## Testing

1. **Register a new user:**
   - Go to landing page
   - Click "Sign Up"
   - Fill form and submit

2. **Login:**
   - Enter email and password
   - Click "Sign In"

3. **Use demo accounts:**
   - Login with `admin@example.com` / `admin123`
   - Or any seeded account

## Security Notes

- ✅ Passwords are hashed with bcrypt (salt rounds: 10)
- ✅ Passwords minimum length: 6 characters
- ✅ Email validation
- ✅ Input sanitization
- ✅ Rate limiting on auth endpoints
- ✅ Password field excluded from queries by default

