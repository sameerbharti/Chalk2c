# 🔧 Processing & Indexing Issue - Diagnostic Guide

## ✅ What's Working

- ✅ Functions are deployed (`process-ocr`, `index-content`)
- ✅ API keys are configured (`OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- ✅ Frontend code is correct
- ✅ Database migrations exist

## 🔍 Most Likely Causes

### 1. Database Migrations Not Applied

**Check:**
1. Go to: https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/editor
2. Check if these tables exist:
   - `classroom_sessions`
   - `knowledge_chunks`

**If tables are missing, apply migrations:**
```bash
npx supabase db push --project-ref gwhhwrdcugcagtqkbzwp
```

### 2. Check Browser Console for Errors

**Steps:**
1. Open browser → Press F12
2. Go to **Console** tab
3. Try to upload/process a file
4. Look for red error messages
5. Note the exact error text

**Common errors:**
- `Failed to fetch` → Network/CORS issue
- `Function not found` → Function deployment issue
- `401 Unauthorized` → Authentication issue
- `500 Internal Server Error` → Backend error

### 3. Check Network Tab

**Steps:**
1. Open browser → Press F12
2. Go to **Network** tab
3. Try to upload/process a file
4. Look for requests to `/functions/v1/process-ocr` or `/functions/v1/index-content`
5. Click on the request → Check:
   - **Status code** (should be 200)
   - **Response** tab (see error message)
   - **Headers** tab (check authorization)

### 4. Check Supabase Function Logs

**Steps:**
1. Go to: https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/functions
2. Click on `process-ocr`
3. Click **"Logs"** tab
4. Look for errors when you try to process

**Look for:**
- `OPENAI_API_KEY is not configured`
- `Supabase configuration is missing`
- Database errors
- Validation errors

## 🧪 Quick Tests

### Test 1: Check Database Tables

Run in Supabase SQL Editor:
```sql
SELECT COUNT(*) FROM classroom_sessions;
SELECT COUNT(*) FROM knowledge_chunks;
```

If these fail, tables don't exist → Apply migrations

### Test 2: Test Function from Browser Console

Open browser console (F12) and run:

```javascript
// Test if Supabase client works
const testSupabase = async () => {
  const { data, error } = await supabase
    .from('classroom_sessions')
    .select('count');
  console.log('Supabase test:', { data, error });
};
testSupabase();
```

### Test 3: Test Function Invocation

```javascript
// Test process-ocr function
const testProcessOCR = async () => {
  // First create a session
  const { data: session, error: sessionError } = await supabase
    .from('classroom_sessions')
    .insert({ subject: 'Test', chapter: 'Test', status: 'pending' })
    .select()
    .single();
  
  if (sessionError) {
    console.error('Session creation failed:', sessionError);
    return;
  }
  
  console.log('Session created:', session.id);
  
  // Now test the function
  const { data, error } = await supabase.functions.invoke('process-ocr', {
    body: {
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // 1x1 pixel
      sessionId: session.id,
      skipIndexing: true
    }
  });
  
  console.log('Function result:', { data, error });
};
testProcessOCR();
```

## 🔧 Immediate Fixes

### Fix 1: Apply Database Migrations

```bash
npx supabase db push --project-ref gwhhwrdcugcagtqkbzwp
```

### Fix 2: Check RLS Policies

If RLS is blocking, check policies in Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/auth/policies
2. Verify policies exist for `classroom_sessions` and `knowledge_chunks`
3. Policies should allow public access (for demo)

### Fix 3: Verify Function Secrets

```bash
npx supabase secrets list --project-ref gwhhwrdcugcagtqkbzwp
```

Should show:
- `OPENAI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 📋 What I Need From You

To help fix this, please provide:

1. **Browser Console Errors:**
   - Open F12 → Console tab
   - Copy any red error messages

2. **Network Tab Errors:**
   - Open F12 → Network tab
   - Try to process a file
   - Find the request to `process-ocr`
   - Click it → Check Response tab
   - Copy the error message

3. **Function Logs:**
   - Go to Supabase Dashboard → Functions → `process-ocr` → Logs
   - Copy any error messages

4. **Database Status:**
   - Go to Supabase Dashboard → Database → Tables
   - Tell me if `classroom_sessions` and `knowledge_chunks` tables exist

## 🎯 Most Common Issue

**90% of the time, it's one of these:**

1. **Database tables don't exist** → Apply migrations
2. **RLS blocking access** → Check policies
3. **Function error not visible** → Check function logs
4. **Network/CORS error** → Check browser console

## 🚀 Quick Action Plan

1. ✅ **Check browser console** (F12) - Note any errors
2. ✅ **Check Network tab** - See failed requests
3. ✅ **Check Supabase function logs** - See backend errors
4. ✅ **Verify database tables exist** - Check Supabase Dashboard
5. ✅ **Share the error messages** - So I can help fix it

The functions are deployed and configured correctly, so the issue is likely:
- Database not set up (migrations not applied)
- RLS policies blocking
- A specific error in function execution (check logs)
