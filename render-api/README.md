# Render API Deployment

This directory contains the backend API for Render deployment (alternative to Supabase Edge Functions).

## ⚠️ Important Note

**Recommended Approach:** Deploy Supabase Edge Functions directly to Supabase. This is the standard and recommended method.

**Alternative Approach:** Use this Render setup if you prefer Render for backend hosting.

## Setup

1. Copy Supabase functions to handlers:
   ```bash
   cp -r supabase/functions/chat render-api/handlers/chat
   cp -r supabase/functions/process-ocr render-api/handlers/process-ocr
   cp -r supabase/functions/index-content render-api/handlers/index-content
   cp -r supabase/functions/generate-study-materials render-api/handlers/generate-study-materials
   cp -r supabase/functions/delete-session render-api/handlers/delete-session
   ```

2. Create a unified server (see DEPLOYMENT.md for details)

3. Deploy to Render using render.yaml configuration

## Environment Variables

Set these in Render dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LOVABLE_API_KEY`
