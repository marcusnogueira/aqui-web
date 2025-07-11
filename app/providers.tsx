'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { I18nextProvider } from 'react-i18next'
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

export function Providers({
  children,
  session,
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
  const [user, setUser] = useState<User | null>(session?.user ?? null)
  const [loading, setLoading] = useState(session === null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
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
        {children}
      </SupabaseContext.Provider>
    </I18nextProvider>
  )
}
