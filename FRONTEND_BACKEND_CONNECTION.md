# Frontend-Backend Connection Status

## ✅ Connection Status: **CONFIGURED BUT NEEDS ENV VARIABLES**

### Backend Status: ✅ DEPLOYED
- ✅ All 5 Edge Functions deployed to Supabase
- ✅ Database tables created
- ✅ Secrets configured (OPENAI_API_KEY set)
- ✅ Functions available at: `https://gwhhwrdcugcagtqkbzwp.supabase.co/functions/v1/`

### Frontend Status: ⚠️ NEEDS ENVIRONMENT VARIABLES

The frontend code is **already configured** to connect to the backend, but needs environment variables:

#### Required Environment Variables:

1. **`VITE_SUPABASE_URL`**
   - Value: `https://gwhhwrdcugcagtqkbzwp.supabase.co`

2. **`VITE_SUPABASE_PUBLISHABLE_KEY`**
   - Value: Your Supabase anon/public key
   - Get it from: https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/settings/api
   - Look for the **`anon`** key (public key)

## How Frontend Connects to Backend

The frontend uses the Supabase client to call Edge Functions:

```typescript
// Example from useChat.ts
const { data, error } = await supabase.functions.invoke('chat', {
  body: { sessionId, question, messages, difficulty }
});
```

### Functions Being Called:

1. ✅ **`chat`** - Called from `src/hooks/useChat.ts`
2. ✅ **`process-ocr`** - Called from `src/hooks/useOCR.ts` and `useMultiFileOCR.ts`
3. ✅ **`index-content`** - Called from `src/hooks/useOCR.ts` and `useMultiFileOCR.ts`
4. ✅ **`generate-study-materials`** - Called from `src/hooks/useStudyMaterials.ts`
5. ✅ **`delete-session`** - Called from `src/components/SessionsSidebar.tsx`

## Setup Instructions

### For Local Development:

1. **Create/Update `.env` file** in project root:
   ```env
   VITE_SUPABASE_URL=https://gwhhwrdcugcagtqkbzwp.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
   ```

2. **Get your anon key:**
   - Go to: https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/settings/api
   - Copy the **`anon`** key (public key)

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

### For Production (Vercel):

1. **Go to Vercel Dashboard**
   - Navigate to your project settings
   - Go to **Environment Variables**

2. **Add these variables:**
   - `VITE_SUPABASE_URL` = `https://gwhhwrdcugcagtqkbzwp.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = your anon key

3. **Redeploy** (or it will auto-deploy)

## Testing the Connection

### Test 1: Check Environment Variables
```bash
# In your frontend code, add this temporarily:
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
```

### Test 2: Test Function Call
1. Start your frontend: `npm run dev`
2. Upload an image
3. Check browser console for errors
4. If you see CORS or connection errors, the env vars are missing

### Test 3: Direct Function Test
Open browser console and run:
```javascript
// This should work if env vars are set
const { data, error } = await supabase.functions.invoke('chat', {
  body: {
    sessionId: 'test-id',
    question: 'Hello'
  }
});
console.log('Response:', data, error);
```

## Connection Flow

```
Frontend (React)
    ↓
Supabase Client (src/integrations/supabase/client.ts)
    ↓
supabase.functions.invoke('function-name')
    ↓
Supabase Edge Functions (Backend)
    ↓
OpenAI API / Database
```

## Troubleshooting

### Issue: "Failed to fetch" or CORS errors
- ✅ Check `VITE_SUPABASE_URL` is set correctly
- ✅ Check `VITE_SUPABASE_PUBLISHABLE_KEY` is set correctly
- ✅ Restart dev server after setting env vars

### Issue: "Function not found"
- ✅ Verify functions are deployed: https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/functions
- ✅ Check function name matches exactly (case-sensitive)

### Issue: "Unauthorized" or "Permission denied"
- ✅ Check you're using the `anon` key, not `service_role` key
- ✅ Verify Row Level Security policies allow access

### Issue: Functions return errors
- ✅ Check Supabase function logs in dashboard
- ✅ Verify `OPENAI_API_KEY` secret is set in Supabase
- ✅ Check OpenAI API key has credits

## Quick Checklist

- [ ] Backend functions deployed ✅
- [ ] Backend secrets configured ✅
- [ ] Frontend env vars set (VITE_SUPABASE_URL) ⚠️ NEEDS SETUP
- [ ] Frontend env vars set (VITE_SUPABASE_PUBLISHABLE_KEY) ⚠️ NEEDS SETUP
- [ ] Test connection

## Next Steps

1. **Set environment variables** (see above)
2. **Test locally** with `npm run dev`
3. **Deploy frontend** to Vercel (if not already)
4. **Set env vars in Vercel** for production
5. **Test end-to-end flow**

Once env vars are set, frontend and backend will be fully connected! 🎉
