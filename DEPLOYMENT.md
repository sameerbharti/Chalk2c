# Deployment Guide: Chalk2Chat

This guide covers deploying the frontend to Vercel and backend to Render.

## 📋 Prerequisites

- GitHub account with your code pushed
- Vercel account (free tier works)
- Render account (free tier works)
- Supabase project set up
- Environment variables ready

---

## 🚀 Part 1: Deploy Frontend to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "Add New Project"

3. **Import Repository**
   - Select your repository
   - Vercel will auto-detect Vite settings

4. **Configure Project**
   - Framework Preset: **Vite** (auto-detected)
   - Root Directory: `./` (leave as is)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install` (auto-detected)

5. **Add Environment Variables**
   Click "Environment Variables" and add:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
   ```
   
   **Important:** For production, also add these with "Production" selected.

6. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live at `https://your-app.vercel.app`

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY

# Deploy to production
vercel --prod
```

---

## 🔧 Part 2: Deploy Backend to Render

### Important Note

**Option 1 (Recommended):** Deploy Supabase Edge Functions to Supabase (standard approach)
**Option 2:** Deploy as Deno services on Render (alternative approach)

### Option 1: Deploy to Supabase (Recommended)

Supabase Edge Functions are designed to run on Supabase infrastructure. This is the standard and recommended approach.

#### Steps:

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link Your Project**
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (Find your project ref in Supabase dashboard URL)

4. **Set Environment Variables**
   In Supabase Dashboard → Settings → Edge Functions → Secrets:
   - `OPENAI_API_KEY` = your OpenAI API key
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = your service role key

5. **Deploy Functions**
   ```bash
   supabase functions deploy chat
   supabase functions deploy process-ocr
   supabase functions deploy index-content
   supabase functions deploy generate-study-materials
   supabase functions deploy delete-session
   ```

6. **Update Frontend**
   Your frontend already uses Supabase client, so it will automatically use the deployed functions. No code changes needed!

### Option 2: Deploy to Render (Alternative)

If you prefer Render, you can deploy the functions as a unified Deno service.

#### Steps:

1. **Go to Render Dashboard**
   - Visit [render.com](https://render.com)
   - Sign in with GitHub
   - Click "New +" → "Web Service"

2. **Connect Repository**
   - Select your repository
   - Name: `chalk2chat-api`

3. **Configure Service**
   - **Environment:** `Deno`
   - **Build Command:** `echo "No build needed"`
   - **Start Command:** `deno run --allow-net --allow-env render-api/server.ts`
   - **Root Directory:** `render-api` (if using unified server)

4. **Add Environment Variables**
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   OPENAI_API_KEY=your-openai-api-key
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (~3-5 minutes)

6. **Update Frontend**
   You'll need to update the frontend to point to your Render API URL instead of Supabase functions.

---

## 🔄 Updating Frontend for Render Backend

If you deployed backend to Render, update the frontend:

### Update Supabase Client Calls

In `src/hooks/useChat.ts`, `src/hooks/useMultiFileOCR.ts`, etc., change:

```typescript
// Before (Supabase functions)
const { data } = await supabase.functions.invoke('chat', { body: {...} });

// After (Render API)
const { data } = await fetch('https://your-render-api.onrender.com/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({...})
}).then(r => r.json());
```

Or create a helper function:

```typescript
// src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-render-api.onrender.com';

export const apiCall = async (endpoint: string, body: any) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
};
```

Then add to Vercel environment variables:
```
VITE_API_URL=https://your-render-api.onrender.com
```

---

## ✅ Post-Deployment Checklist

### Frontend (Vercel)
- [ ] App loads at Vercel URL
- [ ] Environment variables are set
- [ ] File upload works
- [ ] Chat interface works
- [ ] No console errors

### Backend (Supabase/Render)
- [ ] Health check endpoint works (`/health`)
- [ ] Environment variables are set
- [ ] OCR processing works
- [ ] Chat API responds correctly
- [ ] CORS headers are configured

### Integration
- [ ] Frontend can call backend APIs
- [ ] File upload → OCR → Chat flow works
- [ ] Study materials generation works

---

## 🔍 Troubleshooting

### Vercel Build Fails
- Check Node.js version (should be 18+)
- Verify all dependencies in `package.json`
- Check build logs in Vercel dashboard

### Render Deployment Fails
- Verify Deno runtime is selected
- Check start command is correct
- Verify environment variables are set
- Check Render logs for errors

### CORS Errors
- Ensure backend has CORS headers configured
- Check that frontend URL is allowed in CORS settings

### API Not Responding
- Verify environment variables are set correctly
- Check backend logs for errors
- Test health endpoint first: `https://your-api.onrender.com/health`

---

## 📝 Environment Variables Summary

### Frontend (Vercel)
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
VITE_API_URL=https://your-render-api.onrender.com (if using Render)
```

### Backend (Supabase/Render)
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
```

---

## 🎉 You're Done!

Your app should now be live:
- **Frontend:** `https://your-app.vercel.app`
- **Backend:** Supabase functions or Render API

For updates, just push to GitHub and Vercel/Render will auto-deploy!
