'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'zh', name: '中文' },
    { code: 'tl', name: 'Tagalog' },
    { code: 'vi', name: 'Tiếng Việt' }
  ]

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode)
    setIsOpen(false)
  }

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-md bg-muted animate-pulse" />
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors text-sm text-muted-foreground hover:text-foreground"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4" />
        <span className="text-xs font-medium">{currentLanguage.name}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-md shadow-lg z-20 min-w-[120px]">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors first:rounded-t-md last:rounded-b-md ${
                  currentLanguage.code === language.code 
                    ? 'bg-muted text-foreground font-medium' 
                    : 'text-muted-foreground'
                }`}
              >
                {language.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
