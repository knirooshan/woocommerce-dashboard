#!/bin/bash

# Pre-deployment Build Script
# Run this before uploading to production server

echo "========================================"
echo "WooCommerce Dashboard - Build Script"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -d "client" ] || [ ! -d "server" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Step 1: Building Client..."
cd client || exit

# Install dependencies
echo "Installing client dependencies..."
npm install

# Build for production
echo "Building production bundle..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Client build failed!"
    exit 1
fi

echo "✅ Client build complete! Files in client/dist/"
echo ""

cd ..

echo "📦 Step 2: Preparing Server..."
cd server || exit

# Install production dependencies only
echo "Installing server dependencies..."
npm install --production

if [ $? -ne 0 ]; then
    echo "❌ Server dependency installation failed!"
    exit 1
fi

echo "✅ Server dependencies installed!"
echo ""

cd ..

echo "========================================"
echo "✅ Build Complete!"
echo "========================================"
echo ""
echo "📋 Next Steps:"
echo "1. Update client/src/config/api.js with production URL"
echo "2. Create server/.env file with production credentials"
echo "3. Upload client/dist/* to your domain root"
echo "4. Upload server/* to your domain/api folder"
echo "5. Configure Node.js app in cPanel/DirectAdmin"
echo "6. Setup .htaccess for routing"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
echo ""
