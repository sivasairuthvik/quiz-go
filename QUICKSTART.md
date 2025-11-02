# Quick Start Guide

## Step 1: Create Backend .env File

Create a file named `.env` in the `backend` directory:

```bash
cd backend
copy .env.example .env
```

Or manually create `backend/.env` with:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quizmantra
GEMINI_API_KEY=your-key-here
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
JWT_PRIVATE_KEY=your-secret-key-at-least-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-at-least-32-chars
FRONTEND_URL=http://localhost:5173
PORT=3000
NODE_ENV=development
```

## Step 2: Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Step 3: Get MongoDB Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Get connection string (replace `<password>` with your password)
5. Add to `backend/.env` as `MONGODB_URI`

Example:
```
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/quizmantra?retryWrites=true&w=majority
```

## Step 4: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5173/auth/callback`
6. Copy Client ID and Secret to `backend/.env`

## Step 5: Get Gemini API Key (Optional - for AI features)

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Add to `backend/.env` as `GEMINI_API_KEY`

## Step 6: Generate JWT Secrets

Run this command to generate secure random secrets:

```bash
node -e "console.log('JWT_PRIVATE_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output to your `backend/.env` file.

## Step 7: Run the Application

### Option 1: Run Both Together (Recommended)

From the root directory:

```bash
npm run dev
```

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Step 8: Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/api/health

## Troubleshooting

### "MONGODB_URI is not defined"

**Solution:** Make sure you created `backend/.env` file with `MONGODB_URI=your_connection_string`

### "bad auth : authentication failed"

**Solution:** 
- Check MongoDB username and password are correct
- Make sure special characters in password are URL-encoded
- Verify database user has proper permissions

### "Duplicate schema index" warnings

**Solution:** These are just warnings and won't affect functionality. Already fixed in code.

### OAuth not working

**Solution:**
- Verify redirect URI matches: `http://localhost:5173/auth/callback`
- Check Google Client ID and Secret are correct
- Make sure frontend `.env` has `VITE_GOOGLE_CLIENT_ID`

## Next Steps

- See `SETUP.md` for detailed configuration
- See `README.md` for feature documentation
- See `FIXES_AND_IMPROVEMENTS.md` for known issues and solutions

