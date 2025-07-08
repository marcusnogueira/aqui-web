import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Exchange code for session
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      console.error('Error exchanging code for session:', sessionError)
      return NextResponse.redirect(`${requestUrl.origin}?error=auth_failed`)
    }
    
    // If we have a session and user, ensure they exist in our custom users table
    if (session?.user) {
      try {
        const user = session.user
        
        // Check if user already exists in our custom users table
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()
        
        // If user doesn't exist, create them
        if (checkError && checkError.code === 'PGRST116') {
          console.log('Creating new user record for:', user.email)
          
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
              is_vendor: false,
              active_role: 'customer'
            })
          
          if (insertError) {
            console.error('Error creating user record:', insertError)
            // Don't fail the auth flow, just log the error
          } else {
            console.log('✅ User record created successfully for:', user.email)
          }
        } else if (existingUser) {
          console.log('User already exists in database:', user.email)
        } else if (checkError) {
          console.error('Error checking user existence:', checkError)
        }
        
      } catch (error) {
        console.error('Error in user creation flow:', error)
        // Don't fail the auth flow, just log the error
      }
    }

    // URL to redirect to after sign in process completes
    // Check user's active role and redirect accordingly
    if (session?.user) {
      try {
        const { data: userProfile } = await supabase
          .from('users')
          .select('active_role')
          .eq('id', session.user.id)
          .single()
        
        if (userProfile?.active_role === 'vendor') {
          return NextResponse.redirect(`${requestUrl.origin}/vendor/dashboard`)
        }
      } catch (error) {
        console.error('Error checking user role for redirect:', error)
      }
    }
    
    // Default redirect to explore page (customer view)
    return NextResponse.redirect(`${requestUrl.origin}/explore`)
  }
  
  // If no code, redirect to home
  return NextResponse.redirect(requestUrl.origin)
}