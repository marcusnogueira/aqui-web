// NOTE: This guard is not perfect, but it's a good first line of defense.
// For a more robust solution, consider using a library like `server-only`.
if (typeof window !== 'undefined') {
  throw new Error('This file should only be used on the server.');
}

import { createServerClient } from '@supabase/ssr'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import type { Database } from '@/lib/database.types'

// Server-side Supabase client that accepts cookies
export const createSupabaseServerClient = (cookieStore: ReadonlyRequestCookies) => {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // In server components, we can't set cookies
          // This is handled by middleware or client-side code
        },
        remove(name: string, options: any) {
          // In server components, we can't remove cookies
          // This is handled by middleware or client-side code
        },
      },
    }
  )
}