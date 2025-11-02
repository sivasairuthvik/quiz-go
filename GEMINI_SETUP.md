# Gemini API Setup Guide

## Error: "API key not valid"

This error occurs when the Gemini API key is missing, invalid, or not properly configured.

## Quick Fix

### Step 1: Get a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

### Step 2: Add to backend/.env

Open `backend/.env` and add/update:

```env
GEMINI_API_KEY=your-actual-api-key-here
GEMINI_MODEL=gemini-1.5-pro
```

**Important:** 
- Replace `your-actual-api-key-here` with the key from Google AI Studio
- The key should start with `AIza...`
- Make sure there are no extra spaces or quotes

### Step 3: Restart Backend Server

```bash
cd backend
npm start
```

## Verify API Key Works

After setting up, try uploading a PDF again. If you still get errors:

1. **Check the API key format:**
   - Should be ~39 characters
   - Starts with `AIza`
   - No spaces or line breaks

2. **Check API quota:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Check if API is enabled
   - Verify quota limits

3. **Test the key:**
   - You can test it directly at Google AI Studio
   - Or check backend logs for more details

## Alternative: Manual Quiz Creation

If you don't have a Gemini API key or want to skip AI features:

1. Use "Manual Entry" mode when creating quizzes
2. The app will work without Gemini API
3. AI feedback will use default messages

## Features That Require Gemini API

- ✅ PDF to Quiz (AI generation) - **Requires API key**
- ✅ AI Study Buddy - **Requires API key**  
- ✅ AI Feedback - Works with default feedback if API key missing

## Troubleshooting

### "API key not valid"
- ✅ Check key is correct (no typos)
- ✅ Make sure key is in `backend/.env` (not frontend)
- ✅ Verify key hasn't been revoked
- ✅ Check for extra spaces/quotes in .env file

### "Model not found"
- Try `GEMINI_MODEL=gemini-pro` instead of `gemini-1.5-pro`
- Some models may not be available in all regions

### API Quota Exceeded
- Check your Google Cloud Console for quota limits
- Free tier has rate limits
- Consider upgrading if needed

## Getting Help

If issues persist:
1. Check backend logs for detailed error messages
2. Verify API key at Google AI Studio directly
3. Ensure API is enabled in Google Cloud Console
4. Check network connectivity

