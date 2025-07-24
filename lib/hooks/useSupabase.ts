'use client'

import { useSupabaseContext } from '@/contexts/SupabaseContext'

/**
 * Hook to access the shared, authenticated Supabase client
 * @returns SupabaseClient instance that is properly authenticated
 */
export const useSupabase = () => {
  const { supabase } = useSupabaseContext()
  return supabase
}