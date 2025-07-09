import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

// Server-side Supabase client
export const createClient = () => createServerClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value
      },
    },
  }
)

// Helper function to get current user on server
export const getCurrentUserServer = async () => {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting current user on server:', error)
    return null
  }
  
  return user
}

// Helper function to check if user is admin on server
// WARNING: This function is inconsistent with other admin checks in the codebase
export const isUserAdminServer = async (userId: string) => {
  console.warn('⚠️ DEPRECATED: isUserAdminServer from supabase-server.ts is inconsistent. Use proper admin authentication instead.')
  
  const supabase = createClient()
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