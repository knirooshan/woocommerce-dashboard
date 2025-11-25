@echo off
REM Pre-deployment Build Script for Windows
REM Run this before uploading to production server

echo ========================================
echo WooCommerce Dashboard - Build Script
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "client" (
    echo Error: Please run this script from the project root directory
    exit /b 1
)
if not exist "server" (
    echo Error: Please run this script from the project root directory
    exit /b 1
)

echo Step 1: Building Client...
cd client

REM Install dependencies
echo Installing client dependencies...
call npm install

REM Build for production
echo Building production bundle...
call npm run build

if %errorlevel% neq 0 (
    echo Client build failed!
    exit /b 1
)

echo Client build complete! Files in client/dist/
echo.

cd ..

echo Step 2: Preparing Server...
cd server

REM Install production dependencies only
echo Installing server dependencies...
call npm install --production

if %errorlevel% neq 0 (
    echo Server dependency installation failed!
    exit /b 1
)

echo Server dependencies installed!
echo.

cd ..

echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Update client/src/config/api.js with production URL
echo 2. Create server/.env file with production credentials
echo 3. Upload client/dist/* to your domain root
echo 4. Upload server/* to your domain/api folder
echo 5. Configure Node.js app in cPanel/DirectAdmin
echo 6. Setup .htaccess for routing
echo.
echo See DEPLOYMENT.md for detailed instructions
echo.

pause
