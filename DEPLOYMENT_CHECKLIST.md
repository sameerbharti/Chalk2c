# Supabase Deployment Checklist

Use this checklist to ensure everything is deployed correctly.

## Pre-Deployment

- [ ] You have a Supabase account
- [ ] You have access to project: `msfunkvsvasbkrqqsbty`
- [ ] You have your OpenAI API key ready
- [ ] You have your Supabase Service Role Key ready

## Step 1: CLI Setup

- [ ] Run `npx supabase login` (opens browser for authentication)
- [ ] Successfully logged in
- [ ] Run `npx supabase link --project-ref msfunkvsvasbkrqqsbty`
- [ ] Project linked successfully

## Step 2: Database Migrations

- [ ] Run `npx supabase db push`
- [ ] Both migrations applied successfully:
  - [ ] `20260114105120_d55ea9d3-a500-4741-892f-69694eefb7f3.sql`
  - [ ] `20260115192507_18c7c619-7089-4ef4-952c-017cad94e395.sql`
- [ ] Verify in Supabase Dashboard → Table Editor:
  - [ ] `classroom_sessions` table exists
  - [ ] `knowledge_chunks` table exists
  - [ ] `chat_messages` table exists

## Step 3: Environment Variables (Secrets)

Go to Supabase Dashboard → Settings → Edge Functions → Secrets

- [ ] `OPENAI_API_KEY` is set
- [ ] `SUPABASE_URL` is set (e.g., `https://msfunkvsvasbkrqqsbty.supabase.co`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set

## Step 4: Deploy Edge Functions

- [ ] `chat` function deployed
- [ ] `process-ocr` function deployed
- [ ] `index-content` function deployed
- [ ] `generate-study-materials` function deployed
- [ ] `delete-session` function deployed

Verify in Supabase Dashboard → Edge Functions:
- [ ] All 5 functions are listed
- [ ] All functions show "Active" status

## Step 5: Testing

Test each function endpoint:

- [ ] **chat**: Test with a sample request
- [ ] **process-ocr**: Test with a sample image
- [ ] **index-content**: Test with sample text
- [ ] **generate-study-materials**: Test with session IDs
- [ ] **delete-session**: Test with a session ID

## Step 6: Frontend Integration

- [ ] Update frontend `.env` or environment variables:
  - [ ] `VITE_SUPABASE_URL` is set
  - [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` is set
- [ ] Frontend can successfully call Edge Functions
- [ ] Test complete flow: Upload → OCR → Chat

## Troubleshooting

If something fails:

1. **CLI Login Issues:**
   - Get access token from: https://supabase.com/dashboard/account/tokens
   - Use: `npx supabase login --token YOUR_TOKEN`

2. **Migration Errors:**
   - Check SQL Editor in dashboard for error messages
   - Verify tables don't already exist (may need to drop first)

3. **Function Deployment Errors:**
   - Check function logs in dashboard
   - Verify secrets are set correctly
   - Check function code for syntax errors

4. **Function Runtime Errors:**
   - Check Edge Function logs in dashboard
   - Verify all environment variables are set
   - Test function with sample payload

## Quick Commands Reference

```bash
# Login
npx supabase login

# Link project
npx supabase link --project-ref msfunkvsvasbkrqqsbty

# Apply migrations
npx supabase db push

# Set secrets (one at a time)
npx supabase secrets set OPENAI_API_KEY=your_key
npx supabase secrets set SUPABASE_URL=https://msfunkvsvasbkrqqsbty.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key

# Deploy all functions
npx supabase functions deploy

# Deploy specific function
npx supabase functions deploy chat

# View function logs
npx supabase functions logs chat
```

## Your Function URLs

After deployment, your functions will be at:

- Chat: `https://msfunkvsvasbkrqqsbty.supabase.co/functions/v1/chat`
- Process OCR: `https://msfunkvsvasbkrqqsbty.supabase.co/functions/v1/process-ocr`
- Index Content: `https://msfunkvsvasbkrqqsbty.supabase.co/functions/v1/index-content`
- Generate Study Materials: `https://msfunkvsvasbkrqqsbty.supabase.co/functions/v1/generate-study-materials`
- Delete Session: `https://msfunkvsvasbkrqqsbty.supabase.co/functions/v1/delete-session`
