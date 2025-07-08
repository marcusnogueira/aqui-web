import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

// Server-side Supabase client
export const createServerClient = () => createServerComponentClient<Database>({ cookies })

// Helper function to get current user on server
export const getCurrentUserServer = async () => {
  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting current user on server:', error)
    return null
  }
  
  return user
}

// Helper function to check if user is admin on server
export const isUserAdminServer = async (userId: string) => {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', userId)
    .single()
  
  if (error) {
    console.error('Error checking admin status on server:', error)
    return false
  }
  
  return !!data
}