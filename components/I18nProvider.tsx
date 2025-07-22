'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Initialize i18n on client side
    const initializeI18n = async () => {
      if (typeof window !== 'undefined') {
        // Check for saved language preference
        const savedLanguage = localStorage.getItem('i18nextLng')
        if (savedLanguage && savedLanguage !== i18n.language) {
          await i18n.changeLanguage(savedLanguage)
        }
      }
      setIsInitialized(true)
    }

    initializeI18n()
  }, [i18n])

  // Prevent hydration mismatch by not rendering until i18n is properly initialized
  if (!isInitialized) {
    return <>{children}</>
  }

  return <>{children}</>
}