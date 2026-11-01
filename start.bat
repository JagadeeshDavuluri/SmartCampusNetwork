@echo off
title Smart Campus Network

echo ========================================
echo   Smart Campus Access Control System
echo ========================================
echo.

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [1/3] Installing dependencies...
    call npm install
    echo.
) else (
    echo [1/3] Dependencies already installed.
)

:: Generate Prisma client
echo [2/3] Generating Prisma client...
call npx prisma generate
echo.

:: Push database schema (creates DB if needed)
echo [3/3] Syncing database...
call npx prisma db push
echo.

echo ========================================
echo   Starting development server...
echo   Frontend + Backend: http://localhost:3000
echo ========================================
echo.

call npm run dev
pause
