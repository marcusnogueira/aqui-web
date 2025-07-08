#!/bin/bash

# Supabase Edge Functions Deployment Script
# This script deploys the edge functions from the separated directory

set -e  # Exit on any error

echo "🚀 Deploying Supabase Edge Functions..."

# Check if we're in the right directory
if [ ! -f "config.toml" ]; then
    echo "❌ Error: config.toml not found. Make sure you're in the supabase-functions directory."
    exit 1
fi

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed."
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo "❌ Error: Not logged in to Supabase."
    echo "Login with: supabase login"
    exit 1
fi

# Deploy functions
echo "📦 Deploying auto-end-sessions function..."
supabase functions deploy auto-end-sessions

if [ $? -eq 0 ]; then
    echo "✅ Successfully deployed auto-end-sessions function!"
    echo ""
    echo "🔗 Function URL: https://YOUR_PROJECT_REF.functions.supabase.co/auto-end-sessions"
    echo ""
    echo "⏰ Don't forget to set up the cron job in your Supabase dashboard:"
    echo "   Schedule: */5 * * * * (every 5 minutes)"
    echo "   Function: auto-end-sessions"
else
    echo "❌ Failed to deploy auto-end-sessions function"
    exit 1
fi

echo "🎉 Deployment complete!"