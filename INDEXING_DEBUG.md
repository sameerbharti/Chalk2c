# 🔍 Indexing Debug Guide

## ✅ Improvements Made

I've improved error handling in the indexing functions to provide better feedback:

1. **Better error messages** - Now shows specific errors
2. **Validation** - Checks for empty text before indexing
3. **Detailed logging** - Errors logged to console with details
4. **User feedback** - Toast notifications show what went wrong

## 🧪 How to Debug

### Step 1: Check Browser Console
1. Open browser → F12 → Console tab
2. Try to index content
3. Look for error messages (they're now more detailed)

### Step 2: Check Network Tab
1. Open F12 → Network tab
2. Try to index
3. Find request to `/functions/v1/index-content`
4. Check:
   - **Status code** (should be 200)
   - **Request payload** (verify text is sent)
   - **Response** (see error message if any)

### Step 3: Check Function Logs
1. Go to: https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/functions
2. Click `index-content`
3. Click "Logs" tab
4. Look for errors when you try to index

## 🔍 Common Issues

### Issue: "Text is empty"
**Cause:** No text provided to index
**Fix:** Make sure text is extracted and not empty

### Issue: "Function error: ..."
**Cause:** Function call failed
**Fix:** Check function logs in Supabase Dashboard

### Issue: "Indexing failed - no success response"
**Cause:** Function returned but without success flag
**Fix:** Check function response format

### Issue: "Validation failed"
**Cause:** Invalid input (empty text, invalid UUID)
**Fix:** Check that text is not empty and sessionId is valid

## 🧪 Test Function Directly

Open browser console (F12) and run:

```javascript
// Test indexing
const testIndex = async () => {
  // Create a test session first
  const { data: session, error: sessionError } = await supabase
    .from('classroom_sessions')
    .insert({ 
      subject: 'Test', 
      chapter: 'Test', 
      status: 'pending',
      raw_extracted_text: 'Test text content'
    })
    .select()
    .single();
  
  if (sessionError) {
    console.error('❌ Session creation failed:', sessionError);
    return;
  }
  
  console.log('✅ Session created:', session.id);
  
  // Test indexing
  const { data, error } = await supabase.functions.invoke('index-content', {
    body: {
      sessionId: session.id,
      text: 'This is a test text to index. It should create knowledge chunks for testing purposes.',
      subject: 'Test Subject',
      chapter: 'Test Chapter'
    }
  });
  
  console.log('📊 Index result:', { data, error });
  
  if (error) {
    console.error('❌ Error:', error);
  } else if (data?.error) {
    console.error('❌ Function error:', data.error);
  } else if (data?.success) {
    console.log(`✅ Success! Created ${data.chunksCreated} chunks`);
  } else {
    console.warn('⚠️ Unexpected response:', data);
  }
};
testIndex();
```

## 📋 Checklist

- [ ] Text is not empty when clicking "Confirm & Index"
- [ ] SessionId is valid UUID
- [ ] Function is deployed (check `npx supabase functions list`)
- [ ] Database tables exist (`classroom_sessions`, `knowledge_chunks`)
- [ ] RLS policies allow inserts
- [ ] Browser console shows no errors
- [ ] Network tab shows successful request (200 status)
- [ ] Function logs show no errors

## 🎯 Next Steps

1. **Try indexing again** - The improved error handling will show what's wrong
2. **Check browser console** - Look for detailed error messages
3. **Check function logs** - See backend errors
4. **Test function directly** - Use the test code above
5. **Share error messages** - If still not working, share the exact error you see

The indexing function should now provide much better error messages to help identify the issue!
