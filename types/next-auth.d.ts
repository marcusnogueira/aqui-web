import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    active_role?: string
  }

  interface Session {
    user: {
      id: string
      email: string
      active_role: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    active_role: string
  }
}