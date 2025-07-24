'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SupabaseContext } from '@/contexts/SupabaseContext'
import type { Session } from 'next-auth'

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode
  session: Session | null
}) {
  // Create a single, memoized Supabase client instance
  const supabase = useMemo(() => createClient(), [])

  return (
    <SessionProvider session={session}>
      <SupabaseContext.Provider value={{ supabase }}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </SupabaseContext.Provider>
    </SessionProvider>
  )
}
