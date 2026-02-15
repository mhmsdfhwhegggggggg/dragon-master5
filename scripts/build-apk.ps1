# Ultra-Simple Build Script
$ErrorActionPreference = "Continue"

Write-Host "🚀 starting FALCON Pro APK Build..." -ForegroundColor Cyan

# Use npx --yes to auto-confirm installation of eas-cli if missing
# Use cmd /c to ensure npx runs correctly even if PATH has issues
$buildCmd = "npx --yes eas-cli build -p android --profile preview"

Write-Host "Executing: $buildCmd" -ForegroundColor Yellow

# Execute the command
cmd /c $buildCmd

# Check result using simple separate checks to avoid syntax confusion
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build request submitted successfully!" -ForegroundColor Green
    Write-Host "🔗 Follow the link above to monitor progress and download the APK." -ForegroundColor Cyan
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please check the error messages above." -ForegroundColor Red
}
