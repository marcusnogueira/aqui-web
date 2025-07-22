'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useTranslation } from 'react-i18next'

// Force dynamic rendering for this component
export const dynamic = 'force-dynamic'

export function AuthStatus() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()

  if (status === 'loading') {
    return <span className="text-sm text-gray-400">{t('common.loading')}</span>
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
