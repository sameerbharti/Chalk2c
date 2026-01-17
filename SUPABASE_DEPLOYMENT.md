# Supabase Backend Deployment Guide

This guide will help you deploy your backend functions and database migrations to Supabase.

## Prerequisites

- Supabase account with project: `msfunkvsvasbkrqqsbty`
- Access to your Supabase project dashboard
- Your Supabase project URL and service role key

## Step 1: Login to Supabase CLI

Open your terminal and run:

```bash
npx supabase login
```

This will open a browser window for authentication. Follow the prompts to complete login.

## Step 2: Link Your Project

After logging in, link your local project to your Supabase project:

```bash
npx supabase link --project-ref msfunkvsvasbkrqqsbty
```

## Step 3: Apply Database Migrations

Deploy your database schema:

```bash
npx supabase db push
```

This will apply both migration files:
- `20260114105120_d55ea9d3-a500-4741-892f-69694eefb7f3.sql` - Creates tables and policies
- `20260115192507_18c7c619-7089-4ef4-952c-017cad94e395.sql` - Additional schema updates

## Step 4: Set Environment Variables (Secrets)

Before deploying functions, you need to set secrets in Supabase. You can do this via:

### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions** → **Secrets**
3. Add the following secrets:
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `SUPABASE_URL` - Your Supabase project URL (e.g., `https://msfunkvsvasbkrqqsbty.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (found in Settings → API)

### Option B: Using CLI
```bash
npx supabase secrets set OPENAI_API_KEY=your_openai_api_key
npx supabase secrets set SUPABASE_URL=https://msfunkvsvasbkrqqsbty.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 5: Deploy Edge Functions

Deploy all 5 Edge Functions:

```bash
# Deploy chat function
npx supabase functions deploy chat

# Deploy process-ocr function
npx supabase functions deploy process-ocr

# Deploy index-content function
npx supabase functions deploy index-content

# Deploy generate-study-materials function
npx supabase functions deploy generate-study-materials

# Deploy delete-session function
npx supabase functions deploy delete-session
```

Or deploy all at once:
```bash
npx supabase functions deploy
```

## Step 6: Verify Deployment

After deployment, verify your functions are live:

1. Go to **Edge Functions** in your Supabase dashboard
2. You should see all 5 functions listed:
   - `chat`
   - `process-ocr`
   - `index-content`
   - `generate-study-materials`
   - `delete-session`

3. Test a function by clicking on it and using the "Invoke" button

## Alternative: Deploy via Supabase Dashboard

If you prefer using the dashboard:

### Database Migrations:
1. Go to **SQL Editor** in Supabase dashboard
2. Copy the contents of each migration file
3. Run them in order:
   - First: `20260114105120_d55ea9d3-a500-4741-892f-69694eefb7f3.sql`
   - Second: `20260115192507_18c7c619-7089-4ef4-952c-017cad94e395.sql`

### Edge Functions:
1. Go to **Edge Functions** in Supabase dashboard
2. For each function:
   - Click "Create a new function"
   - Name it (e.g., `chat`)
   - Copy the code from `supabase/functions/chat/index.ts`
   - Paste and deploy

## Function URLs

After deployment, your functions will be available at:
- `https://msfunkvsvasbkrqqsbty.supabase.co/functions/v1/chat`
- `https://msfunkvsvasbkrqqsbty.supabase.co/functions/v1/process-ocr`
- `https://msfunkvsvasbkrqqsbty.supabase.co/functions/v1/index-content`
- `https://msfunkvsvasbkrqqsbty.supabase.co/functions/v1/generate-study-materials`
- `https://msfunkvsvasbkrqqsbty.supabase.co/functions/v1/delete-session`

## Troubleshooting

### If CLI login fails:
- Make sure you have a Supabase account
- Try using an access token: `npx supabase login --token YOUR_TOKEN`
- Get your token from: https://supabase.com/dashboard/account/tokens

### If deployment fails:
- Check that all secrets are set correctly
- Verify your project ref is correct: `msfunkvsvasbkrqqsbty`
- Check function logs in the Supabase dashboard

### If functions return errors:
- Verify environment variables are set in Supabase dashboard
- Check function logs for detailed error messages
- Ensure database migrations have been applied

## Next Steps

After successful deployment:
1. Update your frontend environment variables to point to your Supabase project
2. Test each function endpoint
3. Monitor function logs for any issues
