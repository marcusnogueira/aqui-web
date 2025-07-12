import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  if (error) {
    console.error('OAuth Error:', requestUrl.searchParams.get('error_description'))
    return NextResponse.redirect(`${requestUrl.origin}?error=auth_failed&message=${encodeURIComponent(requestUrl.searchParams.get('error_description') || 'Could not authenticate user.')}`)
  }

  if (!code) {
    console.error('OAuth Callback: No code provided.')
    return NextResponse.redirect(`${requestUrl.origin}?error=auth_failed&message=Authorization%20code%20missing.`)
  }

  const cookieStore = cookies()
  
  // Create a proper server client that can set cookies
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
  
  // Exchange code for session
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('Error exchanging code for session:', exchangeError.message)
    return NextResponse.redirect(`${requestUrl.origin}?error=auth_failed&message=${encodeURIComponent(exchangeError.message)}`)
  }

  console.log('Successfully exchanged code for session:', data.user?.email)

  // Redirect to homepage
  return NextResponse.redirect(`${requestUrl.origin}/`)
}
