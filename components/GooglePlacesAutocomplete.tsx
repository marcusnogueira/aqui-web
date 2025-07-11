'use client'

import { useState } from 'react'

interface PlaceResult {
  formatted_address: string
  place_id: string
  geometry?: {
    location: {
      lat(): number
      lng(): number
    }
  }
}

interface AddressInputProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelect?: (place: PlaceResult) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
  name?: string
}

// Simple address input component to replace Google Places Autocomplete
// This maintains the same interface but without Google Maps dependency
export default function AddressInput({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter an address",
  className = "",
  disabled = false,
  id,
  name
}: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    // Simple local suggestions based on common address patterns
    if (newValue.length > 2) {
      const commonSuggestions = [
        `${newValue}, San Francisco, CA`,
        `${newValue}, Oakland, CA`,
        `${newValue}, Berkeley, CA`,
        `${newValue}, San Jose, CA`
      ].filter(suggestion => 
        suggestion.toLowerCase().includes(newValue.toLowerCase())
      )
      setSuggestions(commonSuggestions.slice(0, 3))
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
    
    // Create a mock place result for compatibility
    const mockPlace: PlaceResult = {
      formatted_address: suggestion,
      place_id: `mock_${Date.now()}`,
      geometry: {
        location: {
          lat: () => 37.7749, // Default to San Francisco
          lng: () => -122.4194
        }
      }
    }
    
    onPlaceSelect?.(mockPlace)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault()
      handleSuggestionClick(suggestions[0])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        id={id}
        name={name}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={`suggestion-${index}`}
              className="px-4 py-2 cursor-pointer hover:bg-muted text-sm"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Export with the original name for backward compatibility
export { AddressInput as GooglePlacesAutocomplete }