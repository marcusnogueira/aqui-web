'use client'

import { useSession, signIn, signOut } from 'next-auth/react'

export function AuthStatus() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <span className="text-sm text-gray-400">Loading...</span>
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <img
          src={session.user.image ?? ''}
          alt="User Avatar"
          className="h-8 w-8 rounded-full"
        />
        <span className="text-sm font-medium">{session.user.name}</span>
        <button onClick={() => signOut()} className="text-sm text-red-500 ml-2">
          Sign out
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => signIn()} className="text-sm text-blue-500">
      Sign in
    </button>
  )
}
