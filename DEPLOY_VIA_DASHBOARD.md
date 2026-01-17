# Deploy Supabase Backend via Dashboard (Alternative Method)

Since CLI linking is having access issues, you can deploy everything directly through the Supabase Dashboard. This is actually easier and doesn't require CLI access!

## Step 1: Verify Your Project Access

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Make sure you can see your project
3. Check the project URL - it should be something like: `https://YOUR-PROJECT-REF.supabase.co`
4. The project ref is in the URL: `https://supabase.com/dashboard/project/YOUR-PROJECT-REF`

## Step 2: Apply Database Migrations via SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**

### Migration 1: Create Tables and Policies

Copy and paste the entire contents of:
`supabase/migrations/20260114105120_d55ea9d3-a500-4741-892f-69694eefb7f3.sql`

Then click **Run** (or press Ctrl+Enter)

### Migration 2: Add Delete Policies

Copy and paste the entire contents of:
`supabase/migrations/20260115192507_18c7c619-7089-4ef4-952c-017cad94e395.sql`

Then click **Run**

### Verify Tables Created

Go to **Table Editor** and verify these tables exist:
- ✅ `classroom_sessions`
- ✅ `knowledge_chunks`
- ✅ `chat_messages`

## Step 3: Set Environment Variables (Secrets)

1. Go to **Settings** → **Edge Functions** → **Secrets**
2. Click **Add a new secret** for each:

   **Secret 1:**
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key (get it from https://platform.openai.com/api-keys)

   **Secret 2:**
   - Name: `SUPABASE_URL`
   - Value: Your Supabase project URL (e.g., `https://msfunkvsvasbkrqqsbty.supabase.co`)

   **Secret 3:**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Your service role key (found in **Settings** → **API** → **service_role** key)

## Step 4: Deploy Edge Functions via Dashboard

For each function, follow these steps:

### Function 1: chat

1. Go to **Edge Functions** (left sidebar)
2. Click **Create a new function**
3. Function name: `chat`
4. Copy the entire code from: `supabase/functions/chat/index.ts`
5. Paste it into the code editor
6. Click **Deploy**

### Function 2: process-ocr

1. Click **Create a new function**
2. Function name: `process-ocr`
3. Copy code from: `supabase/functions/process-ocr/index.ts`
4. Paste and **Deploy**

### Function 3: index-content

1. Click **Create a new function**
2. Function name: `index-content`
3. Copy code from: `supabase/functions/index-content/index.ts`
4. Paste and **Deploy**

### Function 4: generate-study-materials

1. Click **Create a new function**
2. Function name: `generate-study-materials`
3. Copy code from: `supabase/functions/generate-study-materials/index.ts`
4. Paste and **Deploy**

### Function 5: delete-session

1. Click **Create a new function**
2. Function name: `delete-session`
3. Copy code from: `supabase/functions/delete-session/index.ts`
4. Paste and **Deploy**

## Step 5: Verify Deployment

1. Go to **Edge Functions**
2. You should see all 5 functions listed:
   - ✅ chat
   - ✅ process-ocr
   - ✅ index-content
   - ✅ generate-study-materials
   - ✅ delete-session

3. Each function should show "Active" status

## Step 6: Test Functions

You can test each function directly in the dashboard:

1. Click on a function (e.g., `chat`)
2. Click **Invoke function**
3. Add a test payload (JSON)
4. Click **Invoke** to test

## Troubleshooting

### If you can't see the project:
- Make sure you're logged into the correct Supabase account
- Check if the project is in an organization you have access to
- Verify the project ref in the URL matches `msfunkvsvasbkrqqsbty`

### If migrations fail:
- Check if tables already exist (you may need to drop them first)
- Look at the error message in SQL Editor
- Make sure you're running migrations in order

### If functions fail to deploy:
- Check that all secrets are set correctly
- Look at function logs for error messages
- Verify the code was copied completely

### If functions return errors:
- Check Edge Function logs in the dashboard
- Verify all environment variables (secrets) are set
- Test with a simple payload first

## Your Function URLs

After deployment, your functions will be available at:

- Chat: `https://YOUR-PROJECT-REF.supabase.co/functions/v1/chat`
- Process OCR: `https://YOUR-PROJECT-REF.supabase.co/functions/v1/process-ocr`
- Index Content: `https://YOUR-PROJECT-REF.supabase.co/functions/v1/index-content`
- Generate Study Materials: `https://YOUR-PROJECT-REF.supabase.co/functions/v1/generate-study-materials`
- Delete Session: `https://YOUR-PROJECT-REF.supabase.co/functions/v1/delete-session`

Replace `YOUR-PROJECT-REF` with your actual project reference (e.g., `msfunkvsvasbkrqqsbty`).
