'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Session } from 'next-auth'

function SupabaseSessionSync() {
  console.log('🔥 SupabaseSessionSync mounted')

  const { data: session } = useSession()
  const supabase = createClient()

  useEffect(() => {
    console.log('🟡 NextAuth session:', session)

    if (session?.supabaseAccessToken) {
      supabase.auth.setSession({
        access_token: session.supabaseAccessToken,
        refresh_token: session.supabaseRefreshToken || ''
      }).then(async ({ error }) => {
        if (error) {
          console.error('❌ Failed to set Supabase session:', error)
        } else {
          console.log('✅ Supabase session set successfully')

          const { data, error: getError } = await supabase.auth.getSession()
          console.log('🧪 Supabase session:', data.session)
          if (!data.session) {
            console.error('❌ Supabase session is still null after setSession')
          }
        }
      })
    }
  }, [session?.supabaseAccessToken, session?.supabaseRefreshToken])

  return null
}

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode
  session: Session | null
}) {
  return (
    <SessionProvider session={session}>
      <SupabaseSessionSync />
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={true}
        disableTransitionOnChange={false}
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
