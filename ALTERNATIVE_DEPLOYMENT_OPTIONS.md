# Alternative Backend Deployment Options

If Supabase Edge Functions don't work for you, here are alternative deployment methods:

## Option 1: Supabase Dashboard (Manual Upload) ✅ Easiest

If CLI deployment fails, you can deploy directly via the Supabase Dashboard:

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/functions

2. **For each function:**
   - Click **Create a new function**
   - Name it (e.g., `chat`)
   - Copy the entire code from `supabase/functions/chat/index.ts`
   - Paste into the code editor
   - Click **Deploy**

3. **Set secrets** (same as before):
   - Settings → Edge Functions → Secrets
   - Add: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

**Pros:** No CLI needed, visual interface  
**Cons:** Manual copy-paste for each function

---

## Option 2: Vercel Serverless Functions

Deploy as Vercel serverless functions:

### Setup:

1. **Create API routes in your frontend project:**
   ```
   api/
     chat/
       route.ts
     process-ocr/
       route.ts
     index-content/
       route.ts
     generate-study-materials/
       route.ts
     delete-session/
       route.ts
   ```

2. **Convert functions to Next.js API routes:**
   - Adapt the Deno code to Node.js
   - Use `@vercel/node` runtime
   - Set environment variables in Vercel dashboard

3. **Deploy:**
   - Push to GitHub
   - Vercel auto-deploys

**Pros:** Same platform as frontend, easy integration  
**Cons:** Need to convert Deno code to Node.js

---

## Option 3: Render (Deno Service)

Deploy as a unified Deno service on Render:

### Setup:

1. **Create unified server** (`render-api/server.ts`):
   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
   
   serve(async (req) => {
     const url = new URL(req.url);
     const path = url.pathname;
     
     if (path === "/chat") {
       // Import and run chat handler
     } else if (path === "/process-ocr") {
       // Import and run OCR handler
     }
     // ... etc
   });
   ```

2. **Deploy to Render:**
   - Use `render.yaml` configuration
   - Set environment variables
   - Deploy as Deno web service

**Pros:** Keeps Deno code, unified API  
**Cons:** Need to create unified server, separate from Supabase

---

## Option 4: Cloudflare Workers

Deploy as Cloudflare Workers:

### Setup:

1. **Install Wrangler CLI:**
   ```bash
   npm install -g wrangler
   ```

2. **Create `wrangler.toml`:**
   ```toml
   name = "chalk2chat-api"
   main = "src/index.ts"
   compatibility_date = "2024-01-01"
   ```

3. **Adapt functions for Cloudflare Workers:**
   - Use Cloudflare Workers runtime
   - Set environment variables via `wrangler secret put`

4. **Deploy:**
   ```bash
   wrangler deploy
   ```

**Pros:** Fast, global CDN, free tier available  
**Cons:** Need to adapt code for Workers runtime

---

## Option 5: Railway

Deploy as Deno service on Railway:

### Setup:

1. **Create `Procfile`:**
   ```
   web: deno run --allow-net --allow-env --allow-read render-api/server.ts
   ```

2. **Connect GitHub repo to Railway**

3. **Set environment variables in Railway dashboard**

4. **Deploy automatically on push**

**Pros:** Simple, auto-deploys, good free tier  
**Cons:** Need unified server setup

---

## Option 6: Fly.io

Deploy as Deno app on Fly.io:

### Setup:

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Create `fly.toml`:**
   ```toml
   app = "chalk2chat-api"
   primary_region = "iad"
   
   [build]
     builder = "deno"
   
   [[services]]
     internal_port = 8000
     protocol = "tcp"
   ```

3. **Deploy:**
   ```bash
   fly launch
   fly secrets set OPENAI_API_KEY=xxx
   ```

**Pros:** Good for Deno, global deployment  
**Cons:** More complex setup

---

## Recommendation

**For your use case, I recommend:**

1. **First choice:** ✅ **Supabase Dashboard** (manual upload) - Easiest, no CLI issues
2. **Second choice:** **Vercel Serverless** - If you want everything in one place
3. **Third choice:** **Render** - If you want to keep Deno code as-is

---

## Quick Comparison

| Platform | Difficulty | Cost | Deno Support | Setup Time |
|----------|-----------|------|--------------|------------|
| Supabase Dashboard | ⭐ Easy | Free tier | ✅ Native | 10 min |
| Vercel | ⭐⭐ Medium | Free tier | ❌ Node.js | 30 min |
| Render | ⭐⭐ Medium | Free tier | ✅ Yes | 20 min |
| Cloudflare | ⭐⭐⭐ Hard | Free tier | ⚠️ Adapted | 45 min |
| Railway | ⭐⭐ Medium | Free tier | ✅ Yes | 15 min |
| Fly.io | ⭐⭐⭐ Hard | Free tier | ✅ Yes | 30 min |

---

## Current Status

✅ **All functions are already deployed to Supabase!**

You just need to:
1. Set the 3 secrets in Supabase Dashboard
2. Test the functions
3. You're done!

If you run into issues, use **Option 1 (Supabase Dashboard)** to manually redeploy.
