# 🔑 API Key Configuration Check

## Required API Keys

### 1. Backend (Supabase Edge Functions)

#### ✅ OPENAI_API_KEY
- **Status:** Should be set in Supabase secrets
- **Required by:** All 3 main functions:
  - `chat` function
  - `process-ocr` function  
  - `generate-study-materials` function
- **Check:** Run `npx supabase secrets list`
- **Set via:** `npx supabase secrets set OPENAI_API_KEY=your-key`
- **Or via Dashboard:** https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/settings/functions

#### ⚠️ SUPABASE_SERVICE_ROLE_KEY
- **Status:** May need to be set manually
- **Required by:** All functions (for database access)
- **Note:** Supabase usually provides this automatically, but functions explicitly check for it
- **Get from:** https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/settings/api
- **Look for:** `service_role` key (NOT `anon` key)
- **Set via Dashboard:** https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/settings/functions

#### ✅ SUPABASE_URL
- **Status:** Automatically available to Edge Functions
- **Value:** `https://gwhhwrdcugcagtqkbzwp.supabase.co`
- **Note:** Functions get this automatically, no action needed

### 2. Frontend (React App)

#### ⚠️ VITE_SUPABASE_URL
- **Status:** Must be in `.env` file
- **Required:** Yes
- **Value:** `https://gwhhwrdcugcagtqkbzwp.supabase.co`
- **Location:** `.env` file in project root

#### ⚠️ VITE_SUPABASE_PUBLISHABLE_KEY
- **Status:** Must be in `.env` file
- **Required:** Yes
- **Value:** Your Supabase `anon` key (public key)
- **Get from:** https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/settings/api
- **Location:** `.env` file in project root

## 🔍 How to Check API Key Issues

### Step 1: Check Backend Secrets

```bash
npx supabase secrets list --project-ref gwhhwrdcugcagtqkbzwp
```

**Expected output:**
```
OPENAI_API_KEY                    [hidden]
SUPABASE_SERVICE_ROLE_KEY         [hidden] (if set)
```

### Step 2: Check Frontend .env File

```bash
# Check if .env exists
cat .env
```

**Expected content:**
```env
VITE_SUPABASE_URL=https://gwhhwrdcugcagtqkbzwp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

### Step 3: Test Backend Functions

1. Go to: https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/functions
2. Click on `chat` function
3. Click **"Invoke function"**
4. Use this test payload:
```json
{
  "sessionId": "00000000-0000-0000-0000-000000000000",
  "question": "test",
  "messages": []
}
```

**If you see:**
- ✅ Success → API keys are working
- ❌ "OPENAI_API_KEY is not configured" → Backend secret missing
- ❌ "Supabase configuration is missing" → Service role key issue

## 🐛 Common API Key Issues

### Issue 1: "OPENAI_API_KEY is not configured"
**Symptom:** Backend functions return this error

**Fix:**
```bash
npx supabase secrets set OPENAI_API_KEY=sk-proj-... --project-ref gwhhwrdcugcagtqkbzwp
```

Or via Dashboard:
1. Go to: https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/settings/functions
2. Scroll to **Secrets**
3. Add: `OPENAI_API_KEY` = `your-openai-key`

### Issue 2: "Supabase configuration is missing"
**Symptom:** Functions can't access database

**Fix:**
1. Get service_role key from: https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/settings/api
2. Set it in Dashboard: https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/settings/functions
3. Add secret: `SUPABASE_SERVICE_ROLE_KEY` = `your-service-role-key`

### Issue 3: Frontend can't connect
**Symptom:** "Failed to fetch" or network errors

**Fix:**
1. Create `.env` file in project root
2. Add:
   ```env
   VITE_SUPABASE_URL=https://gwhhwrdcugcagtqkbzwp.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```
3. Restart dev server: `npm run dev`

### Issue 4: Wrong key type
**Symptom:** Functions work but database operations fail

**Problem:** Using `anon` key instead of `service_role` key

**Fix:** 
- Frontend uses `anon` key ✅
- Backend functions need `service_role` key ✅
- Make sure you're using the right key in the right place!

## 📋 Quick Checklist

### Backend Secrets (Supabase Dashboard)
- [ ] `OPENAI_API_KEY` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (if needed)
- [ ] Functions are deployed

### Frontend Environment (.env file)
- [ ] `.env` file exists in project root
- [ ] `VITE_SUPABASE_URL` is set correctly
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` is set (anon key)
- [ ] Dev server restarted after creating `.env`

## 🔐 Security Notes

1. **Never commit `.env` file** - It's in `.gitignore` ✅
2. **Never commit API keys** - They're in Supabase secrets ✅
3. **Use `anon` key for frontend** - Public key, safe to expose
4. **Use `service_role` key for backend** - Private key, keep secret
5. **Use `OPENAI_API_KEY` for backend** - Private key, keep secret

## 🧪 Test Your Setup

### Test Backend:
```bash
# Test chat function
curl -X POST https://gwhhwrdcugcagtqkbzwp.supabase.co/functions/v1/chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","question":"hello","messages":[]}'
```

### Test Frontend:
1. Run `npm run dev`
2. Open browser console (F12)
3. Check for Supabase initialization messages
4. Try uploading a file or using chat

## 📞 Need Help?

If API keys are still not working:
1. Check Supabase Dashboard → Functions → Logs
2. Check browser console for frontend errors
3. Verify all keys are correct (no typos, no extra spaces)
4. Make sure you restarted dev server after creating `.env`
