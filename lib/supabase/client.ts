import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

// Client-side Supabase client
export const createClient = () => createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)


// Auth functions migrated to NextAuth.js
// Use these NextAuth.js functions instead:
// import { signIn, signOut, useSession } from 'next-auth/react'

// Helper function to sign in with Google (using NextAuth.js)
export const signInWithGoogle = async () => {
  const { signIn } = await import('next-auth/react')
  return await signIn('google', { callbackUrl: window.location.origin })
}

// Helper function to sign in with Apple (using NextAuth.js)
export const signInWithApple = async () => {
  const { signIn } = await import('next-auth/react')
  return await signIn('apple', { callbackUrl: window.location.origin })
}

// Helper function to sign out (using NextAuth.js)
export const signOut = async () => {
  const { signOut: nextAuthSignOut } = await import('next-auth/react')
  return await nextAuthSignOut({ callbackUrl: window.location.origin })
}

// Helper function to get current user (using NextAuth.js)
export const getCurrentUser = async () => {
  try {
    const response = await fetch('/api/auth/session')
    if (!response.ok) return null
    
    const session = await response.json()
    return session?.user || null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}