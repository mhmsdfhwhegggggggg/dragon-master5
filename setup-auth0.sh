#!/bin/bash

echo "🚀 Auth0 Setup for Dragon Telegram Pro"
echo ""

echo "Step 1: Opening Auth0 website..."
open https://auth0.com

echo ""
echo "Step 2: Follow these steps:"
echo "1. Click 'Sign Up'"
echo "2. Choose 'Free' plan"
echo "3. Complete registration with email"
echo "4. Go to 'Applications' → 'Create Application'"
echo "5. Choose 'Single Page Web Applications'"
echo "6. Name: Dragon Telegram Pro"
echo "7. Click 'Create'"
echo ""

echo "Step 3: Configure Application"
echo "1. Go to 'Settings' → 'Basic Information'"
echo "2. Add these URLs:"
echo "   - Allowed Callback URLs: http://localhost:3000/api/oauth/callback"
echo "   - Allowed Logout URLs: http://localhost:3000"
echo "   - Allowed Web Origins: http://localhost:3000"
echo "3. Click 'Save Changes'"
echo ""

echo "Step 4: Get Credentials"
echo "1. Copy these values:"
echo "   - Domain: your-tenant.auth0.com"
echo "   - Client ID: your_client_id_here"
echo "   - Client Secret: your_client_secret_here"
echo ""

echo "Step 5: Add to .env file"
echo "AUTH0_DOMAIN=your-tenant.auth0.com"
echo "AUTH0_CLIENT_ID=your_client_id_here"
echo "AUTH0_CLIENT_SECRET=your_client_secret_here"
echo "AUTH0_CALLBACK_URL=http://localhost:3000/api/oauth/callback"
echo ""

read -p "When you have the credentials, press Enter to continue..."

echo ""
echo "Please enter your Auth0 Domain:"
read AUTH0_DOMAIN

echo ""
echo "Please enter your Auth0 Client ID:"
read AUTH0_CLIENT_ID

echo ""
echo "Please enter your Auth0 Client Secret:"
read AUTH0_CLIENT_SECRET

echo ""
echo "Adding to .env file..."
echo "AUTH0_DOMAIN=$AUTH0_DOMAIN" >> .env
echo "AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID" >> .env
echo "AUTH0_CLIENT_SECRET=$AUTH0_CLIENT_SECRET" >> .env
echo "AUTH0_CALLBACK_URL=http://localhost:3000/api/oauth/callback" >> .env
echo "OAUTH_SERVER_URL=https://$AUTH0_DOMAIN" >> .env

echo ""
echo "✅ Auth0 configuration added to .env file"
echo "🚀 Dragon Telegram Pro is ready with Auth0!"
