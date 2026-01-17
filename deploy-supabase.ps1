# Supabase Deployment Script for Windows PowerShell
# Run this script after logging in to Supabase CLI

Write-Host "🚀 Starting Supabase Backend Deployment..." -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is available
Write-Host "📦 Checking Supabase CLI..." -ForegroundColor Yellow
$supabaseVersion = npx supabase --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Supabase CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
Write-Host ""

# Check if logged in
Write-Host "🔐 Checking authentication..." -ForegroundColor Yellow
$loginCheck = npx supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in. Please run: npx supabase login" -ForegroundColor Red
    Write-Host "   Then run this script again." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Authenticated" -ForegroundColor Green
Write-Host ""

# Link project
Write-Host "🔗 Linking project..." -ForegroundColor Yellow
npx supabase link --project-ref msfunkvsvasbkrqqsbty
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to link project" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Project linked" -ForegroundColor Green
Write-Host ""

# Apply migrations
Write-Host "📊 Applying database migrations..." -ForegroundColor Yellow
npx supabase db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to apply migrations" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Migrations applied" -ForegroundColor Green
Write-Host ""

# Deploy functions
Write-Host "⚡ Deploying Edge Functions..." -ForegroundColor Yellow
Write-Host ""

$functions = @("chat", "process-ocr", "index-content", "generate-study-materials", "delete-session")

foreach ($func in $functions) {
    Write-Host "  Deploying $func..." -ForegroundColor Cyan
    npx supabase functions deploy $func
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Failed to deploy $func" -ForegroundColor Red
    } else {
        Write-Host "  ✅ $func deployed successfully" -ForegroundColor Green
    }
    Write-Host ""
}

Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Make sure you've set the following secrets in Supabase Dashboard:" -ForegroundColor Yellow
Write-Host "   - OPENAI_API_KEY" -ForegroundColor White
Write-Host "   - SUPABASE_URL" -ForegroundColor White
Write-Host "   - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor White
Write-Host ""
Write-Host "   Go to: Settings → Edge Functions → Secrets" -ForegroundColor Cyan
