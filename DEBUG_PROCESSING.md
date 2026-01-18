# 🔍 Debugging Processing & Indexing Issues

## Common Issues and Solutions

### Issue 1: Functions Not Deployed
**Symptom:** "Function not found" or 404 errors

**Check:**
```bash
npx supabase functions list --project-ref gwhhwrdcugcagtqkbzwp
```

**Fix:** Deploy functions if missing:
```bash
npx supabase functions deploy process-ocr --project-ref gwhhwrdcugcagtqkbzwp
npx supabase functions deploy index-content --project-ref gwhhwrdcugcagtqkbzwp
```

### Issue 2: API Key Missing
**Symptom:** "OPENAI_API_KEY is not configured" error

**Check:**
```bash
npx supabase secrets list --project-ref gwhhwrdcugcagtqkbzwp
```

**Fix:** Set the key if missing:
```bash
npx supabase secrets set OPENAI_API_KEY=your-key --project-ref gwhhwrdcugcagtqkbzwp
```

### Issue 3: Service Role Key Missing
**Symptom:** "Supabase configuration is missing" error

**Check:** Verify in Supabase Dashboard → Settings → Functions → Secrets

**Fix:** Set SUPABASE_SERVICE_ROLE_KEY in dashboard

### Issue 4: CORS Errors
**Symptom:** "CORS policy" errors in browser console

**Check:** Functions should have CORS headers (they do ✅)

**Fix:** Usually means function isn't deployed or URL is wrong

### Issue 5: Authentication Errors
**Symptom:** 401 Unauthorized errors

**Check:** 
- Frontend .env has correct anon key
- Anon key matches current project

**Fix:** Update .env with correct anon key

## Testing Functions Directly

### Test process-ocr:
```bash
curl -X POST https://gwhhwrdcugcagtqkbzwp.supabase.co/functions/v1/process-ocr \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "base64_encoded_image",
    "sessionId": "test-session-id",
    "skipIndexing": true
  }'
```

### Test index-content:
```bash
curl -X POST https://gwhhwrdcugcagtqkbzwp.supabase.co/functions/v1/index-content \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-id",
    "text": "Sample text to index",
    "subject": "Test",
    "chapter": "Chapter 1"
  }'
```

## Browser Console Debugging

### Check for Errors:
1. Open browser console (F12)
2. Look for:
   - Network errors (404, 500, etc.)
   - CORS errors
   - Authentication errors
   - Function invocation errors

### Expected Flow:
1. Upload file → Creates session
2. Calls `process-ocr` → Extracts text
3. User reviews/edits text
4. Calls `index-content` → Creates chunks

## Quick Fixes

### Fix 1: Redeploy Functions
```bash
npx supabase functions deploy process-ocr --project-ref gwhhwrdcugcagtqkbzwp
npx supabase functions deploy index-content --project-ref gwhhwrdcugcagtqkbzwp
```

### Fix 2: Check Function Logs
1. Go to: https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/functions
2. Click on function name
3. Check "Logs" tab for errors

### Fix 3: Verify Database Tables
Functions need these tables:
- `classroom_sessions`
- `knowledge_chunks`

Check if they exist in Supabase Dashboard → Database → Tables

## Next Steps

1. Check browser console for specific errors
2. Check Supabase function logs
3. Verify functions are deployed
4. Test functions directly with curl
5. Check database tables exist
