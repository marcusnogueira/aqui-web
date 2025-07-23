import NextAuth, { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    active_role?: string
    is_vendor?: boolean
  }

  interface Session {
    user: {
      id: string
      email: string
      active_role: string
      is_vendor: boolean
    } & DefaultSession['user']
    supabaseAccessToken?: string
    supabaseRefreshToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    active_role: string
    is_vendor: boolean
    supabaseAccessToken?: string
    supabaseRefreshToken?: string
  }
}
