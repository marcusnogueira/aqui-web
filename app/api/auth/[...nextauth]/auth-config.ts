// app/api/auth/[...nextauth]/auth-config.ts
import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/',
    error: '/',
  },
  callbacks: {
    authorized({ auth }) {
      // ✅ Allow access if user is signed in
      return !!auth?.user
    },
  },
  providers: [], // Providers not needed for middleware
} satisfies NextAuthConfig
