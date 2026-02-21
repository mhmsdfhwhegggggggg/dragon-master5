#!/bin/bash

echo "🚀 Upstash Redis Setup for Dragon Telegram Pro"
echo ""

echo "Step 1: Opening Upstash website..."
open https://upstash.com

echo ""
echo "Step 2: Follow these steps:"
echo "1. Click 'Sign Up' or 'Login'"
echo "2. Use GitHub, Google, or email"
echo "3. Click 'Create Database'"
echo "4. Name: dragon-telegram-pro"
echo "5. Region: Choose nearest to you"
echo "6. Plan: Free (30,000 commands/day)"
echo "7. Click 'Create'"
echo ""

echo "Step 3: Get Connection String"
echo "1. Go to your database dashboard"
echo "2. Click 'Details' tab"
echo "3. Copy the 'Connection String'"
echo "4. It should look like: redis://:password@host.upstash.io:6379"
echo ""

echo "Step 4: Add to your .env file"
echo "REDIS_URL=redis://:your_password@your_host.upstash.io:6379"
echo ""

echo "Step 5: Test connection"
echo "npm run dev:server"
echo ""

read -p "When you have the connection string, press Enter to continue..."

echo ""
echo "Please enter your Upstash Redis connection string:"
read REDIS_URL

echo ""
echo "Adding to .env file..."
echo "REDIS_URL=$REDIS_URL" >> .env

echo ""
echo "✅ Redis configuration added to .env file"
echo "🚀 Dragon Telegram Pro is ready with Redis!"
