import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { errorHandler, ErrorType, ErrorSeverity } from '@/lib/error-handler'

// Client-side Supabase client
export const createClient = () => createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Google OAuth configuration
export const googleOAuthConfig = {
  client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
  redirect_uri: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
}

// Helper function to sign in with Google
export const signInWithGoogle = async () => {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  
  if (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }
  
  return data
}

// Helper function to sign out
export const signOut = async () => {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// Helper function to get current user
export const getCurrentUser = async () => {
  return errorHandler.wrapAsync(async () => {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      throw errorHandler.create(
        ErrorType.AUTHENTICATION,
        `Failed to get current user: ${error.message}`,
        ErrorSeverity.MEDIUM,
        'GET_USER_FAILED',
        error
      )
    }
    
    return user
  }, 'getCurrentUser')
}

// Helper function to check if user is admin
export const isUserAdmin = async (userId: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error checking admin status:', error)
    return false
  }
  
  return !!data?.is_admin
}