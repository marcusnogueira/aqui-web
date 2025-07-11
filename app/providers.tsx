'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { I18nextProvider } from 'react-i18next'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import i18n from '@/lib/i18n'
import type { Database } from '@/types/database'
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'

type SupabaseContextType = {
  supabase: SupabaseClient<Database>
  session: Session | null
  user: User | null
  loading: boolean
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

export const useUser = () => {
  const { user, loading } = useSupabase()
  return { user, loading }
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem
      storageKey="aqui-theme"
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  )
}

export function Providers({
  children,
  session: initialSession,
}: {
  children: React.ReactNode
  session: Session | null
}) {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )
  const [session, setSession] = useState<Session | null>(initialSession)
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null)
  const [loading, setLoading] = useState(initialSession === null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <I18nextProvider i18n={i18n}>
      <SupabaseContext.Provider value={{ supabase, session, user, loading }}>
        <ThemeProvider>{children}</ThemeProvider>
      </SupabaseContext.Provider>
    </I18nextProvider>
  )
}
