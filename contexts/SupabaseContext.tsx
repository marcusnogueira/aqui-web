'use client'

import { createContext, useContext } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type SupabaseContextType = {
  supabase: SupabaseClient<Database>
}

export const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export const useSupabaseContext = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabaseContext must be used within a SupabaseProvider')
  }
  return context
}