# Backend Health Check Script

Write-Host "🔍 Checking Backend Status..." -ForegroundColor Cyan
Write-Host ""

# Check functions
Write-Host "📋 Listing Functions..." -ForegroundColor Yellow
npx supabase functions list
Write-Host ""

# Check secrets
Write-Host "🔐 Checking Secrets..." -ForegroundColor Yellow
npx supabase secrets list
Write-Host ""

# Check recent logs
Write-Host "📝 Recent Chat Function Logs..." -ForegroundColor Yellow
npx supabase functions logs chat --limit 3
Write-Host ""

Write-Host "✅ Backend Status Check Complete" -ForegroundColor Green
Write-Host ""
Write-Host "If you see errors in logs, check:" -ForegroundColor Yellow
Write-Host "  1. OpenAI API key has credits" -ForegroundColor White
Write-Host "  2. All secrets are set correctly" -ForegroundColor White
Write-Host "  3. Database tables exist" -ForegroundColor White
