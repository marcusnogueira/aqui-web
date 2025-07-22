'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder with the same dimensions to prevent layout shift
    return (
      <div className="w-9 h-9 rounded-md border border-input bg-background">
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-all duration-200 ease-in-out flex items-center justify-center group"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 transition-all duration-300 ease-in-out group-hover:rotate-90 group-hover:scale-110" />
      ) : (
        <Moon className="h-4 w-4 transition-all duration-300 ease-in-out group-hover:-rotate-12 group-hover:scale-110" />
      )}
    </button>
  )
}