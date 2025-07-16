# NextAuth Migration Plan: Code-Level Changes

This document provides a detailed breakdown of the files and lines of code that need to be changed to complete the migration from Supabase Auth to NextAuth.js.

---

## 1. Server-Side Code (API Routes & Pages)

**Pattern:** Replace `supabase.auth.getUser()` with the `auth()` helper from NextAuth.js.

- **File:** `app/api/search/vendors/click/route.ts:21`
  - **Original:** `const { data: { user }, error: userError } = await supabase.auth.getUser()`
  - **Change To:** `const session = await auth(); const user = session?.user;` (You will need to import `auth` from `@/app/api/auth/[...nextauth]/auth`)

- **File:** `app/api/search/vendors/route.ts:114` & `157`
  - **Original:** `const { data: { user } } = await supabase.auth.getUser()`
  - **Change To:** `const session = await auth(); const user = session?.user;`

- **File:** `app/api/user/become-vendor/route.ts:36`
  - **Original:** `const { data: { user }, error: authError } = await supabase.auth.getUser()`
  - **Change To:** `const session = await auth(); const user = session?.user;`

- **File:** `app/api/user/switch-role/route.ts:24`
  - **Original:** `const { data: { user }, error: authError } = await supabase.auth.getUser()`
  - **Change To:** `const session = await auth(); const user = session?.user;`

- **File:** `app/auth/callback/route.ts:45`
  - **Original:** `const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)`
  - **Change To:** This entire route should likely be removed. NextAuth handles the OAuth callback flow automatically via the `[...nextauth]` route.

- **File:** `app/page.tsx:190`
  - **Original:** `const { data: { user: authUser } } = await supabase.auth.getUser()`
  - **Change To:** `const session = await auth(); const authUser = session?.user;`

- **File:** `app/vendor/[id]/page.tsx:63`
  - **Original:** `const { data: { user: authUser } } = await supabase.auth.getUser();`
  - **Change To:** `const session = await auth(); const authUser = session?.user;`

- **File:** `app/vendor/dashboard/page.tsx:92`
  - **Original:** `const { data: { user: authUser } } = await supabase.auth.getUser()`
  - **Change To:** `const session = await auth(); const authUser = session?.user;`

- **File:** `app/vendor/onboarding/confirmation/page.tsx:30`
  - **Original:** `const { data: { user } } = await supabase.auth.getUser()`
  - **Change To:** `const session = await auth(); const user = session?.user;`

- **File:** `app/vendor/onboarding/page.tsx:40`
  - **Original:** `const { data: { user } } = await supabase.auth.getUser()`
  - **Change To:** `const session = await auth(); const user = session?.user;`

- **File:** `app/vendor/overview/page.tsx:35`
  - **Original:** `const { data: { user: authUser } } = await supabase.auth.getUser()`
  - **Change To:** `const session = await auth(); const authUser = session?.user;`

---

## 2. Client-Side Code (Components)

**Pattern:** Replace `useUser()` or `useSupabase()` for authentication with the `useSession()` hook from `next-auth/react`.

- **File:** `components/Navigation.tsx:22`
  - **Original:** `const { data: { user: authUser } } = await supabase.auth.getUser()` (This is a server component, change as above)
  - **Change To:** `const session = await auth(); const authUser = session?.user;`

- **File:** `components/RoleSwitcher.tsx:28`
  - **Original:** `const { data: { user } } = await supabase.auth.getUser()` (This is a server component)
  - **Change To:** `const session = await auth(); const user = session?.user;`

- **File:** `app/providers.tsx`
  - **Original:** `useSupabase`, `useUser` exports and context.
  - **Change To:** These hooks have already been removed and replaced with `useSupabaseData`. This file is mostly correct, but any components still using `useUser` will need to be updated.

---

## 3. Helper & Library Code

**Pattern:** Deprecate functions that wrap `supabase.auth` calls and replace their usage with direct NextAuth.js function calls (`signIn`, `signOut`).

- **File:** `lib/auth-helpers.ts:20`
  - **Original:** `const { data: { user }, error } = await supabase.auth.getUser()`
  - **Change To:** This entire file can likely be deprecated. Its functionality is replaced by the `auth()` helper.

- **File:** `lib/supabase-client.ts` & `lib/supabase/client.ts`
  - **Original:** Contains `signInWithGoogle`, `signInWithApple`, `signOut`, `getUser`.
  - **Change To:** These files should be deprecated. The `AuthModal.tsx` component has already been updated to use `signIn` from `next-auth/react`. Other components calling these functions should be updated similarly.

- **File:** `lib/supabase-server.ts:23` & `lib/supabase.ts`
  - **Original:** Contains various `supabase.auth` wrappers.
  - **Change To:** These files should be deprecated in favor of the NextAuth `auth()` helper or client-side hooks.

---

## 4. Scripts & Testing

- **Files:** All files in `scripts/`
  - **Original:** Use `supabase.auth.admin` to create/manage users.
  - **Recommendation:** **No change needed for now.** These are backend administrative scripts. NextAuth does not provide a direct equivalent for this functionality. You should continue to use the Supabase admin client for programmatic user management outside of the user-facing authentication flow.

- **File:** `tests/e2e/auth.spec.ts:25`
  - **Original:** Asserts the popup URL is for Supabase.
  - **Change To:** The test needs to be updated to assert the new NextAuth.js authentication flow, checking for redirects to Google/Apple and the subsequent callback to your application.

This plan provides a comprehensive overview of the remaining work. You can now go through this checklist to complete the migration.
