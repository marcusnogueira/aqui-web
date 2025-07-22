import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

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

// Helper function to sign in with Google (using NextAuth)
export const signInWithGoogle = async () => {
  const { signIn } = await import('@/lib/auth/auth-client')
  
  try {
    await signIn.social({
      provider: 'google',
      callbackURL: `${window.location.origin}/auth/callback`
    })
    return { success: true }
  } catch (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }
}

// Helper function to sign in with Apple (using NextAuth)
export const signInWithApple = async () => {
  const { signIn } = await import('@/lib/auth/auth-client')
  
  try {
    await signIn.social({
      provider: 'apple',
      callbackURL: `${window.location.origin}/auth/callback`
    })
    return { success: true }
  } catch (error) {
    console.error('Error signing in with Apple:', error)
    throw error
  }
}

// Helper function to sign out (using NextAuth)
export const signOut = async () => {
  const { signOut } = await import('@/lib/auth/auth-client')
  
  try {
    await signOut()
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// Helper function to get current user from NextAuth session
export const getCurrentUser = async () => {
  try {
    // Fetch session from NextAuth API
    const response = await fetch('/api/auth/session')
    if (!response.ok) {
      return null
    }
    
    const session = await response.json()
    
    if (!session?.user) {
      return null
    }
    
    // Return user data in a format compatible with existing code
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name || '',
      image: session.user.image || null
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}