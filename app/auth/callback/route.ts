import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

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
  const supabase = createSupabaseServerClient(cookieStore)
  
  // Exchange code for session
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('Error exchanging code for session:', exchangeError.message)
    return NextResponse.redirect(`${requestUrl.origin}?error=auth_failed&message=${encodeURIComponent(exchangeError.message)}`)
  }

  console.log('Successfully exchanged code for session.')

  // The rest of your user creation logic can go here.
  // Redirect to homepage instead of explore

  return NextResponse.redirect(`${requestUrl.origin}/`)
}
