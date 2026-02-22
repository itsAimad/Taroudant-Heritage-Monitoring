# PowerShell script to create a clean repository without bot commits
# This will create a fresh git history with only your commits

Write-Host "Creating clean repository..." -ForegroundColor Green

# Step 1: Remove the current .git folder (backup first if needed)
Write-Host "`nStep 1: Removing old git history..." -ForegroundColor Yellow
if (Test-Path .git) {
    Remove-Item -Recurse -Force .git
    Write-Host "Old git history removed." -ForegroundColor Green
}

# Step 2: Initialize a new git repository
Write-Host "`nStep 2: Initializing new git repository..." -ForegroundColor Yellow
git init
Write-Host "New repository initialized." -ForegroundColor Green

# Step 3: Add all files
Write-Host "`nStep 3: Adding all files..." -ForegroundColor Yellow
git add .

# Step 4: Create initial commit with your name and email
Write-Host "`nStep 4: Creating initial commit..." -ForegroundColor Yellow
git config user.name "itsAimad"
git config user.email "bouyaimad11@gmail.com"
git commit -m "Initial commit: Rampart Sentinel project"
Write-Host "Initial commit created." -ForegroundColor Green

Write-Host "`n✅ Clean repository created successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Create a new repository on GitHub (don't initialize with README)" -ForegroundColor White
Write-Host "2. Add the remote: git remote add origin <your-new-repo-url>" -ForegroundColor White
Write-Host "3. Push: git push -u origin main" -ForegroundColor White

