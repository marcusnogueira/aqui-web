// Cron job configuration for auto-ending live sessions
// This should be set up in your Supabase dashboard or deployment configuration

// Example cron schedule: Run every 5 minutes
// 0 */5 * * * *

// To set up the cron job:
// 1. Go to your Supabase dashboard
// 2. Navigate to Edge Functions
// 3. Set up a cron trigger for the auto-end-sessions function
// 4. Use the schedule: "*/5 * * * *" (every 5 minutes)

export const CRON_SCHEDULE = {
  AUTO_END_SESSIONS: '*/5 * * * *', // Every 5 minutes
}

export const CRON_FUNCTIONS = {
  AUTO_END_SESSIONS: 'auto-end-sessions',
}