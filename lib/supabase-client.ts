import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { errorHandler, createAuthError, createNetworkError, Result, createResult } from '@/lib/error-handler'

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
export const signInWithGoogle = async (): Promise<Result<any>> => {
  const supabase = createClient()
  
  return errorHandler.wrapAsyncResult(async () => {
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
      throw createAuthError(
        `Google sign-in failed: ${error.message}`,
        'GOOGLE_SIGNIN_FAILED',
        error
      )
    }
    
    return data
  }, 'signInWithGoogle')
}




// Helper function to sign in with Apple
export const signInWithApple = async (): Promise<Result<any>> => {
  const supabase = createClient()
  
  return errorHandler.wrapAsyncResult(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      throw createAuthError(
        `Apple sign-in failed: ${error.message}`,
        'APPLE_SIGNIN_FAILED',
        error
      )
    }
    
    return data
  }, 'signInWithApple')
}

// Helper function to sign out
export const signOut = async (): Promise<Result<void>> => {
  const supabase = createClient()
  
  return errorHandler.wrapAsyncResult(async () => {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw createAuthError(
        `Sign-out failed: ${error.message}`,
        'SIGNOUT_FAILED',
        error
      )
    }
  }, 'signOut')
}

// Helper function to get current user
export const getCurrentUser = async (): Promise<Result<any>> => {
  const supabase = createClient()
  
  return errorHandler.wrapAsyncResult(async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      throw createAuthError(
        `Failed to get current user: ${error.message}`,
        'GET_USER_FAILED',
        error
      )
    }
    
    return user
  }, 'getCurrentUser')
}
