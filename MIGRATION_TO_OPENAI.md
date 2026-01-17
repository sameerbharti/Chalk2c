# Migration from Lovable API to OpenAI API

## ✅ Changes Made

All Lovable API dependencies have been removed and replaced with OpenAI API.

### Updated Functions

1. **`supabase/functions/chat/index.ts`**
   - Changed `LOVABLE_API_KEY` → `OPENAI_API_KEY`
   - Changed endpoint: `https://ai.gateway.lovable.dev/v1/chat/completions` → `https://api.openai.com/v1/chat/completions`
   - Changed model: `google/gemini-3-flash-preview` → `gpt-4o`

2. **`supabase/functions/process-ocr/index.ts`**
   - Changed `LOVABLE_API_KEY` → `OPENAI_API_KEY`
   - Changed endpoint: `https://ai.gateway.lovable.dev/v1/chat/completions` → `https://api.openai.com/v1/chat/completions`
   - Changed model: `google/gemini-2.5-pro` → `gpt-4o` (supports vision for images and PDFs)

3. **`supabase/functions/generate-study-materials/index.ts`**
   - Changed `LOVABLE_API_KEY` → `OPENAI_API_KEY`
   - Changed endpoint: `https://ai.gateway.lovable.dev/v1/chat/completions` → `https://api.openai.com/v1/chat/completions`
   - Changed model: `google/gemini-3-flash-preview` → `gpt-4o`

### Updated Documentation

- `SUPABASE_DEPLOYMENT.md`
- `DEPLOYMENT_CHECKLIST.md`
- `DEPLOY_VIA_DASHBOARD.md`
- `DEPLOYMENT.md`
- `deploy-supabase.ps1`
- `render.yaml`
- `render-api/README.md`

## 🔑 Getting Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign in or create an account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key (you won't be able to see it again!)

## 📝 Deployment Steps

### For Supabase Edge Functions:

1. **Set the secret in Supabase Dashboard:**
   - Go to **Settings** → **Edge Functions** → **Secrets**
   - Add secret: `OPENAI_API_KEY` = `your-openai-api-key`

2. **Deploy functions:**
   ```bash
   npx supabase functions deploy chat
   npx supabase functions deploy process-ocr
   npx supabase functions deploy index-content
   npx supabase functions deploy generate-study-materials
   npx supabase functions deploy delete-session
   ```

### For Render (Alternative):

Update environment variables in Render dashboard:
- `OPENAI_API_KEY` = your OpenAI API key

## 💰 Cost Considerations

OpenAI API pricing:
- **GPT-4o**: ~$5 per 1M input tokens, ~$15 per 1M output tokens
- Check current pricing at: https://openai.com/pricing

**Note:** GPT-4o supports vision capabilities needed for OCR, so it can handle both text and image/PDF processing.

## 🔄 Model Alternatives

If you want to use different models, you can change the `model` parameter in each function:

- **For chat:** `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`
- **For OCR/Vision:** `gpt-4o`, `gpt-4-turbo` (both support vision)
- **For study materials:** `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`

## ✅ Verification

After deployment, test each function to ensure they work correctly:

1. **Chat function:** Send a test question
2. **OCR function:** Upload a test image
3. **Study materials:** Generate a test summary/quiz

All functions should now use OpenAI API instead of Lovable API.
