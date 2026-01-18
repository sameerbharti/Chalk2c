# 🔧 Fix Indexing Issues

## Common Indexing Problems

### Issue 1: Function Not Deployed
**Check:**
```bash
npx supabase functions list --project-ref gwhhwrdcugcagtqkbzwp
```

**Fix:** Deploy if missing:
```bash
npx supabase functions deploy index-content --project-ref gwhhwrdcugcagtqkbzwp
```

### Issue 2: Database Tables Missing
**Check:**
1. Go to: https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/editor
2. Verify these tables exist:
   - `classroom_sessions`
   - `knowledge_chunks`

**Fix:** Apply migrations if missing:
```bash
npx supabase db push
```

### Issue 3: RLS Policies Blocking
**Check:** Supabase Dashboard → Auth → Policies

**Fix:** Verify policies allow service role to insert chunks

### Issue 4: Empty Text Being Indexed
**Symptom:** Indexing succeeds but creates 0 chunks

**Cause:** Text might be empty or too short

**Fix:** Check that `editedText` has content before indexing

### Issue 5: Function Error Not Visible
**Check Function Logs:**
1. Go to: https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/functions
2. Click `index-content`
3. Check "Logs" tab for errors

## 🧪 Debugging Steps

### Step 1: Check Browser Console
1. Open browser → F12 → Console tab
2. Try to index content
3. Look for error messages

### Step 2: Check Network Tab
1. Open F12 → Network tab
2. Try to index
3. Find request to `/functions/v1/index-content`
4. Check:
   - Status code (should be 200)
   - Response tab (see error message)
   - Request payload (verify data is sent)

### Step 3: Test Function Directly
Open browser console (F12) and run:

```javascript
// Test indexing function
const testIndex = async () => {
  // First, create a test session
  const { data: session, error: sessionError } = await supabase
    .from('classroom_sessions')
    .insert({ 
      subject: 'Test', 
      chapter: 'Test', 
      status: 'pending' 
    })
    .select()
    .single();
  
  if (sessionError) {
    console.error('Session creation failed:', sessionError);
    return;
  }
  
  console.log('Session created:', session.id);
  
  // Now test indexing
  const { data, error } = await supabase.functions.invoke('index-content', {
    body: {
      sessionId: session.id,
      text: 'This is a test text to index. It should create chunks.',
      subject: 'Test',
      chapter: 'Test Chapter'
    }
  });
  
  console.log('Index result:', { data, error });
};
testIndex();
```

### Step 4: Check Function Logs
1. Go to Supabase Dashboard → Functions → `index-content` → Logs
2. Look for errors when you try to index
3. Check for:
   - Database errors
   - Validation errors
   - Permission errors

## 🔍 Common Error Messages

### "Validation failed"
**Cause:** Invalid input (empty text, invalid sessionId)
**Fix:** Check that text is not empty and sessionId is valid UUID

### "Supabase configuration is missing"
**Cause:** Service role key not available
**Fix:** Check Supabase Dashboard → Functions → Secrets

### "Error inserting chunks"
**Cause:** Database error or RLS blocking
**Fix:** Check database tables and RLS policies

### "Function not found"
**Cause:** Function not deployed
**Fix:** Deploy the function

## 🔧 Quick Fixes

### Fix 1: Redeploy Function
```bash
npx supabase functions deploy index-content --project-ref gwhhwrdcugcagtqkbzwp
```

### Fix 2: Verify Database
Check if tables exist and have correct structure

### Fix 3: Check RLS Policies
Ensure service role can insert into `knowledge_chunks`

## 📋 What to Check

1. ✅ Function is deployed
2. ✅ Database tables exist
3. ✅ RLS policies allow inserts
4. ✅ Text is not empty when indexing
5. ✅ SessionId is valid UUID
6. ✅ Browser console shows no errors
7. ✅ Network tab shows successful request

## 🎯 Next Steps

1. **Check browser console** for specific errors
2. **Check function logs** in Supabase Dashboard
3. **Test function directly** using browser console
4. **Verify database** tables and permissions
5. **Share error messages** you see

The indexing function doesn't use AI, so it should work regardless of the Gemma migration. The issue is likely:
- Function not deployed
- Database permissions
- Empty text being sent
- Network/connection issue
