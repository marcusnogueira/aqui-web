/**
 * NextAuth Context Helper
 * 
 * This module provides utilities for setting user context in RLS policies
 * when using NextAuth instead of Supabase Auth.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { auth } from '@/app/api/auth/[...nextauth]/auth';

/**
 * Sets the current user context for RLS policies
 * This replaces the automatic context setting that Supabase Auth provided
 * 
 * NOTE: Run scripts/nextauth_rls_functions.sql in your Supabase dashboard first!
 */
export async function setUserContext(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  role: 'authenticated' | 'service_role' = 'authenticated'
) {
  try {
    // Call the RLS function to set user context
    // @ts-ignore - RLS functions need to be created in database first
    await supabase.rpc('set_auth_user_id', { user_id: userId });
    // @ts-ignore - RLS functions need to be created in database first
    await supabase.rpc('set_auth_role', { role });
  } catch (error) {
    console.error('Failed to set user context:', error);
    // Don't throw - let the request continue but log the error
  }
}

/**
 * Clears the current user context
 * Should be called at the end of API requests
 * 
 * NOTE: Run scripts/nextauth_rls_functions.sql in your Supabase dashboard first!
 */
export async function clearUserContext(
  supabase: ReturnType<typeof createSupabaseServerClient>
) {
  try {
    // Call the RLS function to clear context
    // @ts-ignore - RLS functions need to be created in database first
    await supabase.rpc('clear_auth_context');
  } catch (error) {
    console.error('Failed to clear user context:', error);
    // Don't throw - this is cleanup
  }
}

/**
 * Sets service role context for admin operations
 * 
 * NOTE: Run scripts/nextauth_rls_functions.sql in your Supabase dashboard first!
 */
export async function setServiceRoleContext(
  supabase: ReturnType<typeof createSupabaseServerClient>
) {
  try {
    // Set service role context for admin operations
    // @ts-ignore - RLS functions need to be created in database first
    await supabase.rpc('set_auth_role', { role: 'service_role' });
  } catch (error) {
    console.error('Failed to set service role context:', error);
  }
}

/**
 * Higher-order function that wraps API route handlers with automatic user context management
 */
export function withUserContext<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const [request] = args;
    let supabase: ReturnType<typeof createSupabaseServerClient> | null = null;
    
    try {
      // Get the current session
      const session = await auth();
      
      // If we have a session and this looks like it uses Supabase
      if (session?.user?.id && typeof request === 'object' && 'cookies' in request) {
        const { cookies } = await import('next/headers');
        supabase = createSupabaseServerClient(await cookies());
        
        // Set user context for RLS
        await setUserContext(supabase, session.user.id);
      }
      
      // Call the original handler
      const result = await handler(...args);
      
      return result;
    } finally {
      // Always clear context when done
      if (supabase) {
        await clearUserContext(supabase);
      }
    }
  };
}

/**
 * Utility for admin routes that need service role context
 */
export async function withServiceRoleContext<T>(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  operation: () => Promise<T>
): Promise<T> {
  try {
    // Set service role context
    await setServiceRoleContext(supabase);
    
    // Perform the operation
    const result = await operation();
    
    return result;
  } finally {
    // Clear context
    await clearUserContext(supabase);
  }
}

/**
 * Gets the current NextAuth session and validates it
 */
export async function getCurrentSession() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }
  
  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      active_role: session.user.active_role
    }
  };
}

/**
 * Validates that the current user has the required role
 */
export async function requireRole(requiredRole: string) {
  const session = await getCurrentSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }
  
  if (session.user.active_role !== requiredRole) {
    throw new Error(`Role '${requiredRole}' required`);
  }
  
  return session;
}

/**
 * Validates admin access (either admin role or service role context)
 */
export async function requireAdmin() {
  const session = await getCurrentSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }
  
  // Check if user has admin role or if this is a service role request
  if (session.user.active_role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  return session;
}