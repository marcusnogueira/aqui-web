# Supabase Edge Functions

This directory contains the Supabase Edge Functions for the Aqui project, separated from the Next.js frontend to prevent Vercel build conflicts.

## Directory Structure

```
supabase-functions/
├── config.toml              # Supabase configuration
├── functions/
│   ├── _shared/
│   │   └── cron.ts          # Shared cron configuration
│   └── auto-end-sessions/
│       └── index.ts         # Auto-end live sessions function
└── README.md
```

## Deployment

### Prerequisites

1. Install Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Link to your project: `supabase link --project-ref YOUR_PROJECT_REF`

### Deploy Functions

From the project root directory:

```bash
# Navigate to the supabase-functions directory
cd ../supabase-functions

# Deploy the auto-end-sessions function
supabase functions deploy auto-end-sessions

# Deploy all functions
supabase functions deploy
```

### Function URLs

After deployment, functions are accessible at:
```
https://YOUR_PROJECT_REF.functions.supabase.co/auto-end-sessions
```

### Local Development

```bash
# Start local Supabase (from this directory)
supabase start

# Serve functions locally
supabase functions serve

# Test function locally
curl -X POST 'http://localhost:54321/functions/v1/auto-end-sessions' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Environment Variables

Ensure these environment variables are set in your Supabase project:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Cron Jobs

The `auto-end-sessions` function should be configured to run every 5 minutes:
1. Go to your Supabase dashboard
2. Navigate to Edge Functions
3. Set up a cron trigger with schedule: `*/5 * * * *`

## Notes

- Frontend fetch calls remain unchanged - they still call the same function URLs
- This separation prevents Vercel from trying to compile Deno files
- All function logic and dependencies remain the same