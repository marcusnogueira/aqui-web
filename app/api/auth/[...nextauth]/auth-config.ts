import type { NextAuthConfig } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'

export const authConfig: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID ?? '',
      clientSecret: process.env.APPLE_CLIENT_SECRET ?? '',
    }),
  ],
  pages: {
    signIn: '/',
    error: '/',
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.supabaseAccessToken = account.access_token ?? ''
        token.supabaseRefreshToken = account.refresh_token ?? ''
      }

      if (user) {
        token.id = (user as any).id ?? ''
        token.active_role = (user as any).active_role ?? 'customer'
        token.is_vendor = (user as any).is_vendor ?? false
      }

      return token
    },
    async session({ session, token }) {
      session.supabaseAccessToken = token.supabaseAccessToken ?? ''
      session.supabaseRefreshToken = token.supabaseRefreshToken ?? ''
      session.user.id = token.id ?? ''
      session.user.active_role = token.active_role ?? 'customer'
      session.user.is_vendor = token.is_vendor ?? false
      return session
    },
    authorized({ auth }) {
      return !!auth?.user
    },
  },
}
