# 🚨 Quick Fix for App Issues

## The Problem
The app is not working because **environment variables are missing**.

## ✅ Solution (2 minutes)

### Step 1: Create `.env` file
Create a file named `.env` in the root directory (where `package.json` is):

```env
VITE_SUPABASE_URL=https://gwhhwrdcugcagtqkbzwp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZnVua3ZzdmFzYmtycXFzYnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODU3NTgsImV4cCI6MjA4Mzk2MTc1OH0.0qL51vmEHCN0nly9V4Sv4UIFPtEhkbVPZ8DH2EiQE7U
```

**Note:** The key above is the anon key you provided earlier. If it doesn't work, get a fresh one from:
https://supabase.com/dashboard/project/gwhhwrdcugcagtqkbzwp/settings/api

### Step 2: Restart Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 3: Check Browser Console
Open browser console (F12). You should see:
```
✅ Supabase client initialized
📍 Supabase URL: https://gwhhwrdcugcagtqkbzwp.supabase.co
🔑 Key configured: Yes
```

## ✅ What I Fixed

1. **Added error handling** - App now shows clear error if env vars are missing
2. **Added SetupWarning component** - Visual warning at top of page if not configured
3. **Improved Supabase client** - Better error messages and validation
4. **Created setup guides** - SETUP_GUIDE.md and QUICK_FIX.md

## 🐛 If Still Not Working

1. **Check `.env` file exists** in root directory
2. **Verify no typos** in variable names (must be exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`)
3. **Restart dev server** after creating `.env`
4. **Check browser console** for specific error messages
5. **Verify Supabase functions are deployed** - Check dashboard

## 📞 Need Help?

Check these files:
- `SETUP_GUIDE.md` - Detailed setup instructions
- `FRONTEND_BACKEND_CONNECTION.md` - Connection troubleshooting
- Browser console - Shows specific errors
