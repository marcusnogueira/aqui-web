export const runtime = 'nodejs'

import NextAuth, {
  type Session,
  type DefaultSession,
  type NextAuthConfig,
} from 'next-auth'

import { getToken } from 'next-auth/jwt'
import { cookies } from 'next/headers'

import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
import CredentialsProvider from 'next-auth/providers/credentials'

import bcrypt from 'bcryptjs'
import crypto from 'crypto'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { USER_ROLES } from '@/lib/constants'
import { Database } from '@/lib/database.types'

type UserRow = Database['public']['Tables']['users']['Row']

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET ?? 'fallback_secret',

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID ?? '',
      clientSecret: process.env.APPLE_CLIENT_SECRET ?? '',
    }),
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const { email, password } = credentials as { email?: string; password?: string };
        if (!email || !password) return null;

        const cookieStore = await cookies()
        const supabase = createSupabaseServerClient(cookieStore)
        const { data: user } = await supabase
          .from('users')
          .select('id, email, password_hash, full_name, active_role')
          .eq('email', email)
          .single<UserRow>()

        if (!user || !user.password_hash) return null

        const valid = await bcrypt.compare(password, user.password_hash as string)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.full_name ?? '',
          active_role: user.active_role ?? USER_ROLES.CUSTOMER,
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        token.provider = account.provider
        token.email = user.email ?? ''
        token.supabaseAccessToken = account.access_token ?? ''
        token.supabaseRefreshToken = account.refresh_token ?? ''

        const cookieStore = await cookies()
        const supabase = createSupabaseServerClient(cookieStore)
        const { data: existing } = await supabase
          .from('users')
          .select('id, active_role')
          .eq('email', user.email ?? '')
          .single()

        if (existing?.id) {
          token.id = existing.id
          token.active_role = existing.active_role ?? USER_ROLES.CUSTOMER
        } else {
          const id = crypto.randomUUID()
          const { data: inserted } = await supabase
            .from('users')
            .insert({
              id,
              email: user.email ?? '',
              full_name: user.name ?? '',
              active_role: USER_ROLES.CUSTOMER,
            })
            .select('id, active_role')
            .single()

          token.id = inserted?.id ?? ''
          token.active_role = inserted?.active_role ?? USER_ROLES.CUSTOMER
        }
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? '') as string
        session.user.active_role = (token.active_role ?? USER_ROLES.CUSTOMER) as string
        session.supabaseAccessToken = token.supabaseAccessToken ?? ''
        session.supabaseRefreshToken = token.supabaseRefreshToken ?? ''
      }

      return session as Session & {
        user: DefaultSession['user'] & {
          id: string
          active_role: string
        }
        supabaseAccessToken?: string
        supabaseRefreshToken?: string
      }
    },
  },

  pages: {
    signIn: '/',
    error: '/',
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

export async function getSession() {
  const token = await getToken({ req: { cookies } as any })
  return token
}
