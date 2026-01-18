# 🆓 Free AI API Setup Guide

## ✅ Migration Complete: OpenAI → Free Alternatives

The app has been updated to use **free AI APIs** instead of OpenAI:

### Changes Made:

1. **Chat Function** → Now uses **Groq** (free tier)
2. **Study Materials Function** → Now uses **Groq** (free tier)  
3. **OCR/Vision Function** → Now uses **Together AI** (free tier)

## 🔑 Required API Keys (All Free!)

You need to get **2 free API keys**:

### 1. Groq API Key (for Chat & Study Materials)

**Get it here:** https://console.groq.com/

**Steps:**
1. Sign up for free account
2. Go to API Keys section
3. Create a new API key
4. Copy the key

**Free Tier Limits:**
- Fast inference
- Generous rate limits
- No credit card required

### 2. Together AI API Key (for Vision/OCR)

**Get it here:** https://api.together.xyz/

**Steps:**
1. Sign up for free account
2. Go to API Keys section
3. Create a new API key
4. Copy the key

**Free Tier Limits:**
- Free credits available
- Vision model support
- Good for OCR tasks

## 🔧 Setting Up API Keys

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/settings/functions
2. Scroll to **Secrets** section
3. Add these secrets:

```
GROQ_API_KEY = your-groq-api-key-here
TOGETHER_API_KEY = your-together-api-key-here
```

### Option 2: Via CLI

```bash
# Set Groq API key
npx supabase secrets set GROQ_API_KEY=your-key-here --project-ref gwhhwrdcugcagtqkbzwp

# Set Together AI API key
npx supabase secrets set TOGETHER_API_KEY=your-key-here --project-ref gwhhwrdcugcagtqkbzwp
```

## 📋 What Changed

### Before (OpenAI):
- ❌ Required paid OpenAI API key
- ❌ Cost per request
- ❌ Rate limits on free tier

### After (Free APIs):
- ✅ **Groq** - Free, fast, no credit card needed
- ✅ **Together AI** - Free tier with vision support
- ✅ No payment required
- ✅ Good performance

## 🧪 Testing

After setting up the keys:

1. **Test Chat:**
   - Upload a file
   - Ask a question
   - Should work with Groq

2. **Test OCR:**
   - Upload an image
   - Should extract text using Together AI

3. **Test Study Materials:**
   - Generate summary/quiz
   - Should work with Groq

## 🐛 Troubleshooting

### Error: "GROQ_API_KEY is not configured"
**Fix:** Set the key in Supabase Dashboard → Functions → Secrets

### Error: "TOGETHER_API_KEY is not configured"
**Fix:** Set the key in Supabase Dashboard → Functions → Secrets

### Error: "Rate limits exceeded"
**Fix:** Wait a moment and try again. Free tiers have rate limits.

### Error: "Invalid API key"
**Fix:** Verify the key is correct and copied completely (no extra spaces)

## 📝 Summary

**All functions now use free AI APIs!**

- ✅ Chat → Groq (free)
- ✅ Study Materials → Groq (free)
- ✅ OCR/Vision → Together AI (free)

**Next Steps:**
1. Get free API keys from Groq and Together AI
2. Set them in Supabase Dashboard → Functions → Secrets
3. Redeploy functions (if needed)
4. Test the app!

## 🔄 Redeploy Functions (Optional)

If you want to redeploy the updated functions:

```bash
npx supabase functions deploy chat --project-ref gwhhwrdcugcagtqkbzwp
npx supabase functions deploy process-ocr --project-ref gwhhwrdcugcagtqkbzwp
npx supabase functions deploy generate-study-materials --project-ref gwhhwrdcugcagtqkbzwp
```

But the functions should work once you set the new API keys!
