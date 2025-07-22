/**
 * Auth Client Module
 * 
 * This module provides a unified interface for authentication operations
 * using NextAuth.js. It wraps NextAuth functions to maintain compatibility
 * with existing component imports while centralizing auth logic.
 */

import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react'

/**
 * Social authentication providers
 */
type SocialProvider = 'google' | 'apple'

/**
 * Social sign-in options
 */
interface SocialSignInOptions {
  provider: SocialProvider
  callbackURL?: string
  redirect?: boolean
}

/**
 * Sign-in utilities
 */
export const signIn = {
  /**
   * Sign in with social providers (Google, Apple)
   * @param options - Social sign-in configuration
   * @returns Promise that resolves when sign-in is initiated
   */
  async social(options: SocialSignInOptions): Promise<void> {
    const { provider, callbackURL, redirect = true } = options
    
    try {
      await nextAuthSignIn(provider, {
        callbackUrl: callbackURL || window.location.origin,
        redirect: redirect as true
      })
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
      throw new Error(`Failed to sign in with ${provider}`)
    }
  },

  /**
   * Sign in with credentials (email/password)
   * @param credentials - Email and password
   * @returns Promise that resolves when sign-in is initiated
   */
  async credentials(credentials: { email: string; password: string }): Promise<void> {
    try {
      await nextAuthSignIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        callbackUrl: window.location.origin,
        redirect: true
      })
    } catch (error) {
      console.error('Error signing in with credentials:', error)
      throw new Error('Failed to sign in with credentials')
    }
  }
}

/**
 * Sign out the current user
 * @param callbackUrl - URL to redirect to after sign out
 * @returns Promise that resolves when sign-out is complete
 */
export const signOut = async (callbackUrl?: string): Promise<void> => {
  try {
    await nextAuthSignOut({
      callbackUrl: callbackUrl || window.location.origin
    })
  } catch (error) {
    console.error('Error signing out:', error)
    throw new Error('Failed to sign out')
  }
}

/**
 * Default export for backward compatibility
 */
export default {
  signIn,
  signOut
}