# Migration Guide: Supabase Auth to NextAuth.js

This guide provides a step-by-step process for migrating your application's authentication from Supabase Auth to NextAuth.js (`next-auth@beta`).

## Step 1: Install Dependencies

First, add the `next-auth` library to your project.

```bash
npm install next-auth@beta
```

## Step 2: Configure Environment Variables

NextAuth.js requires an `AUTH_SECRET` to sign and encrypt JWTs and cookies.

1.  Generate a strong secret using the command below:
    ```bash
    openssl rand -base64 32
    ```
2.  Create a `.env` file by copying your existing `.env.example`.
3.  Add the generated secret to your `.env` file. You should also add the `AUTH_URL` which is your application's base URL.

    ```env
    # .env
    AUTH_SECRET="your-generated-secret-here"
    AUTH_URL="http://localhost:3000"

    # Keep your existing Supabase variables for now
    NEXT_PUBLIC_SUPABASE_URL="..."
    NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
    SUPABASE_SERVICE_ROLE_KEY="..."
    ```

## Step 3: Create the NextAuth API Route

The file `app/api/auth/[...nextauth]/route.ts` is the core of NextAuth. It handles all authentication requests. We will configure it to use a `CredentialsProvider` that validates users against your existing Supabase database.

The file `app/api/auth/[...nextauth]/auth.ts` has been created for you with this configuration. It uses your existing Supabase client to verify user credentials.

## Step 4: Update Middleware

Your `middleware.ts` file needs to be updated to use NextAuth's middleware for protecting routes. This is simpler and more integrated than manually checking for a Supabase session.

**Old `middleware.ts` (example):**
```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  await supabase.auth.getSession()
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

**New `middleware.ts`:**
```typescript
export { auth as middleware } from "@/app/api/auth/[...nextauth]/auth"

export const config = {
  // Matcher stays the same or can be adjusted to your needs
  matcher: [
    '/admin/:path*',
    '/vendor/dashboard/:path*',
  ],
}
```
*You will need to replace the content of `middleware.ts` with the new version above.*

## Step 5: Wrap Your App in `SessionProvider`

To use the `useSession` hook on the client-side, you need to wrap your root layout in a `SessionProvider`.

Update your `app/providers.tsx` file to include it.

**`app/providers.tsx`:**
```tsx
'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}
```

Then, ensure your `app/layout.tsx` uses these providers.

**`app/layout.tsx`:**
```tsx
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

## Step 6: Update Components and Pages

Now, you need to replace all instances of Supabase Auth with NextAuth helpers.

### Client Components (using `useSession`)

Update components that fetch session data on the client.

**Example: `components/Navigation.tsx`**

**Before:**
```tsx
import { useSupabaseClient } from '@supabase/auth-helpers-react';
// ...
const supabase = useSupabaseClient();
const { data: { session } } = await supabase.auth.getSession();
// ... logic based on session
```

**After:**
```tsx
'use client'
import { useSession, signIn, signOut } from 'next-auth/react';
// ...
const { data: session, status } = useSession();
const isAuthenticated = status === 'authenticated';
// ... logic based on isAuthenticated and session object

// To sign in:
// onClick={() => signIn('credentials', { email: '...', password: '...' })}

// To sign out:
// onClick={() => signOut()}
```

### Server Components & API Routes (using `auth`)

Update server-side code that fetches session data.

**Example: A Server Component page**

**Before:**
```tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
// ...
const supabase = createServerComponentClient({ cookies });
const { data: { session } } = await supabase.auth.getSession();
// ... logic based on session
```

**After:**
```tsx
import { auth } from '@/app/api/auth/[...nextauth]/auth';
// ...
const session = await auth();
// ... logic based on session
```

### Summary of Replacements:

-   `createMiddlewareClient` -> `auth` (in `middleware.ts`)
-   `useSupabaseClient` or `createClientComponentClient` for auth -> `useSession` hook
-   `createServerComponentClient` for auth -> `auth` helper
-   `supabase.auth.getSession()` -> `useSession()` (client) or `auth()` (server)
-   `supabase.auth.signInWithPassword(...)` -> `signIn('credentials', { email, password, redirect: false })`
-   `supabase.auth.signOut()` -> `signOut()`

By following these steps, you can incrementally migrate your application to NextAuth.js while leveraging your existing user data in Supabase.
