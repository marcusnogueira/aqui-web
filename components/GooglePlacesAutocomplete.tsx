'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface PlaceResult {
  formatted_address: string
  place_id: string
  geometry?: google.maps.places.PlaceGeometry
  address_components?: google.maps.GeocoderAddressComponent[]
}

interface GooglePlacesAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelect?: (place: PlaceResult) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
  name?: string
}

export default function GooglePlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter an address",
  className = "",
  disabled = false,
  id,
  name
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeAutocomplete = async () => {
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
          version: 'weekly',
          libraries: ['places']
        })

        await loader.load()
        setIsLoaded(true)

        if (inputRef.current && !autocompleteRef.current) {
          // Initialize autocomplete
          autocompleteRef.current = new google.maps.places.Autocomplete(
            inputRef.current,
            {
              types: ['establishment', 'geocode'],
              fields: [
                'formatted_address',
                'place_id',
                'geometry.location',
                'address_components'
              ]
            }
          )

          // Add place selection listener
          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace()
            
            if (place && place.formatted_address) {
              const placeResult: PlaceResult = {
                formatted_address: place.formatted_address,
                place_id: place.place_id || '',
                geometry: place.geometry,
                address_components: place.address_components
              }

              onChange(place.formatted_address)
              onPlaceSelect?.(placeResult)
            }
          })
        }
      } catch (err) {
        console.error('Error loading Google Maps:', err)
        setError('Failed to load Google Maps. Please check your API key.')
      }
    }

    if (!isLoaded) {
      initializeAutocomplete()
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [isLoaded, onChange, onPlaceSelect])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  if (error) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`${className} border-red-300`}
          disabled={disabled}
          id={id}
          name={name}
        />
        <div className="absolute top-full left-0 mt-1 text-xs text-red-600">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
        disabled={disabled || !isLoaded}
        id={id}
        name={name}
      />
      {!isLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        </div>
      )}
    </div>
  )
}