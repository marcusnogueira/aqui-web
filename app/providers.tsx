'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n'
import type { Database } from '@/types/database'

const supabase = createClientComponentClient<Database>()

interface AppContextType {
  user: any
  loading: boolean
}

const AppContext = createContext<AppContextType>({
  user: null,
  loading: true,
})

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <I18nextProvider i18n={i18n}>
        <AppContext.Provider value={{ user, loading }}>
          {children}
        </AppContext.Provider>
      </I18nextProvider>
    </SessionContextProvider>
  )
}