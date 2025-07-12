'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { debounce } from 'lodash'
import { PERFORMANCE_CONFIG } from '@/lib/performance-config'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  debounceMs?: number
}

const SearchBarComponent = ({ value, onChange, placeholder, debounceMs = 300 }: SearchBarProps) => {
  const [localValue, setLocalValue] = useState(value)

  // Debounced onChange to reduce API calls
  const debouncedOnChange = useCallback(
    debounce((newValue: string) => {
      onChange(newValue)
    }, PERFORMANCE_CONFIG.SEARCH_DEBOUNCE_DELAY),
    [onChange]
  )

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    debouncedOnChange(newValue)
  }, [debouncedOnChange])

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedOnChange.cancel()
    }
  }, [debouncedOnChange])

  return (
    <div className="relative max-w-md mx-auto">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={handleInputChange}
        className="block w-full pl-10 pr-3 py-2 text-foreground placeholder:text-muted-foreground border border-border rounded-lg leading-5 bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
      />
    </div>
  )
}

// Export memoized component
export const SearchBar = React.memo(SearchBarComponent)