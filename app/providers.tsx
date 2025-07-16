'use client'

import { createContext, useContext, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { I18nextProvider } from 'react-i18next'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { SessionProvider } from 'next-auth/react'
import i18n from '@/lib/i18n'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

// 1. Simplified Supabase Context for data operations only
type SupabaseDataContextType = {
  supabase: SupabaseClient<Database>
}

const SupabaseDataContext = createContext<SupabaseDataContextType | undefined>(undefined)

export const useSupabaseData = () => {
  const context = useContext(SupabaseDataContext)
  if (context === undefined) {
    throw new Error('useSupabaseData must be used within a Providers component')
  }
  return context
}

// 2. ThemeProvider remains the same
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

// 3. Main Providers component updated for NextAuth
export function Providers({ children }: { children: React.ReactNode }) {
  // Keep the Supabase client for data fetching, not for auth
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  return (
    // SessionProvider from NextAuth now wraps everything
    <SessionProvider>
      <I18nextProvider i18n={i18n}>
        <SupabaseDataContext.Provider value={{ supabase }}>
          <ThemeProvider>{children}</ThemeProvider>
        </SupabaseDataContext.Provider>
      </I18nextProvider>
    </SessionProvider>
  )
}