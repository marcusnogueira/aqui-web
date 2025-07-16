import NextAuth from "next-auth"
import { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import Apple from "next-auth/providers/apple"
import { createClient } from '@supabase/supabase-js'
import { USER_ROLES } from '@/lib/constants'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Apple provider temporarily disabled - uncomment when Apple credentials are configured
    // Apple({
    //   clientId: process.env.APPLE_CLIENT_ID!,
    //   clientSecret: process.env.APPLE_CLIENT_SECRET!,
    // }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Use Supabase Auth to sign in the user
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email as string,
          password: credentials.password as string,
        });

        if (error || !data.user) {
          console.error("Supabase sign-in error:", error?.message);
          return null;
        }
        
        // Fetch user active_role from your 'users' table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('active_role')
          .eq('id', data.user.id)
          .single();

        if (userError || !userData) {
          console.error("Error fetching user active_role:", userError?.message);
          // Decide how to handle users without a role. For now, we'll deny access.
          return null;
        }

        return {
          id: data.user.id,
          email: data.user.email,
          active_role: userData.active_role,
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth providers, check if the user exists in your database
      if (account?.provider === 'google' || account?.provider === 'apple') {
        const { data: existingUser, error } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single();

        // If user doesn't exist, create a new one with auto-generated UUID
        if (!existingUser) {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              email: user.email,
              external_id: user.id, // Store OAuth provider ID
              active_role: USER_ROLES.CUSTOMER, // Default to customer role using constants
            });
          
          if (insertError) {
            console.error('Error creating new OAuth user:', insertError.message);
            return false; // Prevent sign-in if user creation fails
          }
        }
      }
      return true; // Allow sign-in
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        token.id = user.id;
        // For OAuth, we need to fetch the active_role from our database
        if (account.provider === 'google' || account.provider === 'apple') {
          const { data: userData } = await supabase
            .from('users')
            .select('active_role')
            .eq('email', user.email) // Use email since OAuth users get auto-generated IDs
            .single();
          token.active_role = userData?.active_role || USER_ROLES.CUSTOMER;
        } else {
          // For credentials, the active_role is already on the user object
          token.active_role = user.active_role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.active_role = token.active_role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
