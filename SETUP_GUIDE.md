# Quick Setup Guide - Fix App Issues

## 🔧 Most Common Issue: Missing Environment Variables

The app requires environment variables to connect to Supabase. If they're missing, the app won't work.

### Step 1: Create `.env` File

Create a file named `.env` in the root directory (same level as `package.json`):

```env
VITE_SUPABASE_URL=https://gwhhwrdcugcagtqkbzwp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

### Step 2: Get Your Supabase Anon Key

1. Go to: https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/settings/api
2. Find the **"Project API keys"** section
3. Copy the **`anon`** key (public key, NOT service_role)
4. Paste it in your `.env` file

### Step 3: Restart Development Server

After creating/updating `.env`:
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

## ✅ Verify Setup

Open browser console (F12) and you should see:
```
✅ Supabase client initialized
📍 Supabase URL: https://gwhhwrdcugcagtqkbzwp.supabase.co
🔑 Key configured: Yes
```

If you see errors about missing variables, check your `.env` file.

## 🐛 Other Common Issues

### Issue: "Failed to fetch" or Network Errors
- ✅ Check `.env` file exists and has correct values
- ✅ Restart dev server after creating `.env`
- ✅ Check browser console for specific errors

### Issue: "Function not found"
- ✅ Verify functions are deployed in Supabase Dashboard
- ✅ Check function names match exactly

### Issue: "Unauthorized" Errors
- ✅ Make sure you're using the `anon` key, not `service_role`
- ✅ Check Supabase Row Level Security policies

## 📝 Complete .env File Example

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://gwhhwrdcugcagtqkbzwp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZnVua3ZzdmFzYmtycXFzYnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODU3NTgsImV4cCI6MjA4Mzk2MTc1OH0.0qL51vmEHCN0nly9V4Sv4UIFPtEhkbVPZ8DH2EiQE7U
```

Replace the `VITE_SUPABASE_PUBLISHABLE_KEY` with your actual anon key from Supabase Dashboard.
