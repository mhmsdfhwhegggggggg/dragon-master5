@echo off
echo Starting Redis for Dragon Telegram Pro...
echo.

REM Check if Docker is running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not running
    echo Please install Docker Desktop first
    pause
    exit /b 1
)

REM Start Redis container
echo Starting Redis container on port 6379...
docker run -d --name dragon-redis -p 6379:6379 redis:7-alpine

if %errorlevel% neq 0 (
    echo ERROR: Failed to start Redis container
    pause
    exit /b 1
)

echo.
echo Redis is now running on port 6379
echo You can now start the Dragon Telegram Pro server
echo.
pause
