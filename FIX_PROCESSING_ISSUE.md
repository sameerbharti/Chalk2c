# 🔧 Fix Processing & Indexing Issues

## ✅ Status Check

### Functions Deployed: ✅ YES
- ✅ `process-ocr` - ACTIVE (Version 2)
- ✅ `index-content` - ACTIVE (Version 2)
- ✅ `chat` - ACTIVE
- ✅ `generate-study-materials` - ACTIVE
- ✅ `delete-session` - ACTIVE

### API Keys: ✅ CONFIGURED
- ✅ `OPENAI_API_KEY` - Set
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Set

## 🔍 Most Likely Issues

### Issue 1: Database Tables Missing or Wrong Permissions

**Check:**
1. Go to: https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/editor
2. Verify these tables exist:
   - `classroom_sessions`
   - `knowledge_chunks`

**If tables are missing:**
- Run database migrations
- Check `supabase/migrations/` folder

### Issue 2: Row Level Security (RLS) Blocking

**Check:**
1. Go to: https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/auth/policies
2. Check if RLS is enabled on tables
3. Functions use `SUPABASE_SERVICE_ROLE_KEY` which should bypass RLS, but verify

**Fix:** If RLS is blocking, either:
- Disable RLS for these tables (for now)
- Or create policies that allow service role access

### Issue 3: Function Errors Not Visible

**Check Function Logs:**
1. Go to: https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/functions
2. Click on `process-ocr`
3. Click "Logs" tab
4. Look for recent errors

### Issue 4: Browser Console Errors

**Check:**
1. Open browser console (F12)
2. Look for:
   - Network tab → Check failed requests
   - Console tab → Check error messages
   - Look for 401, 403, 404, 500 errors

## 🧪 Quick Diagnostic Steps

### Step 1: Check Browser Console
Open browser → F12 → Console tab
- Look for red errors
- Note any error messages
- Check Network tab for failed requests

### Step 2: Check Function Logs
1. Go to Supabase Dashboard
2. Functions → `process-ocr` → Logs
3. Look for errors when you try to process

### Step 3: Test Function Directly
Try calling the function from browser console:

```javascript
// In browser console (F12)
const testCall = async () => {
  const { data, error } = await supabase.functions.invoke('process-ocr', {
    body: {
      imageBase64: 'test',
      sessionId: '00000000-0000-0000-0000-000000000000',
      skipIndexing: true
    }
  });
  console.log('Result:', data);
  console.log('Error:', error);
};
testCall();
```

### Step 4: Check Database
1. Go to: https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/editor
2. Check if `classroom_sessions` table exists
3. Try inserting a test row manually

## 🐛 Common Error Messages

### "Function not found" or 404
**Cause:** Function not deployed or wrong URL
**Fix:** Functions are deployed ✅, check URL in code

### "OPENAI_API_KEY is not configured"
**Cause:** Secret not set
**Fix:** Already set ✅

### "Supabase configuration is missing"
**Cause:** Service role key not available to function
**Fix:** Check Supabase Dashboard → Functions → Secrets

### "Failed to create session"
**Cause:** Database table missing or permissions issue
**Fix:** Check database tables and RLS policies

### "CORS policy" error
**Cause:** Function not responding correctly
**Fix:** Functions have CORS headers ✅

## 🔧 Immediate Actions

### 1. Check Database Tables
```sql
-- Run in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('classroom_sessions', 'knowledge_chunks');
```

### 2. Check RLS Policies
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('classroom_sessions', 'knowledge_chunks');
```

### 3. Test Function Invocation
Check browser Network tab when uploading a file:
- Look for request to `/functions/v1/process-ocr`
- Check status code (should be 200)
- Check response body for errors

## 📋 What to Report

If still not working, please provide:
1. **Browser console errors** (screenshot or copy text)
2. **Network tab errors** (failed requests)
3. **Function logs** from Supabase Dashboard
4. **Specific error message** you see

## 🎯 Next Steps

1. **Open browser console** (F12) and try to process a file
2. **Note the exact error message** you see
3. **Check Network tab** for failed requests
4. **Check Supabase function logs** for backend errors
5. **Share the error details** so I can help fix it

The functions are deployed and API keys are set, so the issue is likely:
- Database permissions (RLS)
- Missing database tables
- Function runtime error (check logs)
- Frontend error (check browser console)
