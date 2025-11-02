# Deploy Frontend to Vercel

## Using Vercel CLI (Recommended for Testing)

1. Install Vercel CLI globally:
```bash
npm install -g vercel
```

2. Navigate to frontend folder:
```bash
cd frontend
```

3. Deploy:
```bash
vercel --prod
```

4. Follow the prompts and it will deploy correctly.

## Or Update Existing Project

If you already have a Vercel project:

1. Go to: https://vercel.com/dashboard
2. Select your frontend project
3. Settings → General → Root Directory
4. Set to: `frontend`
5. Settings → Environment Variables
6. Add: `VITE_API_URL` = `https://quiz-go-mantra-backend.vercel.app`
7. Deployments → Click "Redeploy"
